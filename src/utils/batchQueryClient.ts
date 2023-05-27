import type { Unserialize } from '@endo/marshal';

export enum AgoricChainStoragePathKind {
  Children = 'children',
  Data = 'data',
}

const batchVstorageQuery = (
  node: string,
  unserialize: Unserialize<string>,
  paths: [AgoricChainStoragePathKind, string][],
) => {
  const options = {
    method: 'POST',
    body: JSON.stringify(
      paths.map(path => ({
        jsonrpc: '2.0',
        id: 1,
        method: 'abci_query',
        params: { path: `/custom/vstorage/${path[0]}/${path[1]}` },
        prove: true,
      })),
    ),
  };

  return fetch(node, options)
    .then(res => res.json())
    .then(res =>
      Object.fromEntries(
        (Array.isArray(res) ? res : [res]).map((entry, index) => {
          if (!entry.result.response.value) {
            throw new Error(
              'Cannot parse value of response for path' +
                paths[index] +
                ': ' +
                entry,
            );
          }

          const data = JSON.parse(atob(entry.result.response.value));

          if (paths[index][0] === AgoricChainStoragePathKind.Children) {
            return [
              JSON.stringify(paths[index]),
              { value: data.children, blockHeight: undefined },
            ];
          }

          const value = JSON.parse(data.value);

          return [
            JSON.stringify(paths[index]),
            {
              blockHeight: value.blockHeight,
              value: unserialize(JSON.parse(value.values.pop())),
            },
          ];
        }),
      ),
    );
};

export type UpdateHandler<T> = (latestValue: T) => void;

type Subscriber<T> = {
  onUpdate: UpdateHandler<T>;
};

const newPathQueryDelayMs = 20;
const refreshLowerBoundMs = 2000;
const refreshUpperBoundMs = 4000;

const randomRefreshPeriod = () =>
  Math.floor(Math.random() * (refreshUpperBoundMs - refreshLowerBoundMs)) +
  refreshLowerBoundMs;

export const makePathSubscriber = <T>(onUpdate: UpdateHandler<T>) => ({
  onUpdate,
});

export const makeAgoricChainStorageWatcher = (
  rpcAddr: string,
  unserialize: Unserialize<string>,
) => {
  // Map of paths to [identifier, value] pairs of most recent response values.
  //
  // The 'identifier' is used to avoid notifying subscribers for already-seen
  // values. For 'data' queries, 'identifier' is the blockheight of the
  // response. For 'children' queries, 'identifier' is the stringified array
  // of children.
  const latestValueCache = new Map<string, [string, unknown]>();

  const watchedPathsToSubscribers = new Map<string, Set<Subscriber<unknown>>>();
  let isNewPathWatched = false;
  let isQueryInProgress = false;
  let nextQueryTimeout: number | null = null;

  const queueNextQuery = () => {
    if (isQueryInProgress || !watchedPathsToSubscribers.size) {
      return;
    }

    if (isNewPathWatched) {
      // If there's new paths to watch, schedule another query very soon.
      if (nextQueryTimeout) {
        window.clearTimeout(nextQueryTimeout);
      }
      nextQueryTimeout = window.setTimeout(queryUpdates, newPathQueryDelayMs);
    } else {
      // Otherwise, refresh after a normal interval.
      nextQueryTimeout = window.setTimeout(queryUpdates, randomRefreshPeriod());
    }
  };

  const queryUpdates = async () => {
    isQueryInProgress = true;
    nextQueryTimeout = null;
    isNewPathWatched = false;

    const paths = [...watchedPathsToSubscribers.keys()].map(pathKey =>
      JSON.parse(pathKey),
    );

    if (!paths.length) {
      isQueryInProgress = false;
      return;
    }

    try {
      const data = await batchVstorageQuery(rpcAddr, unserialize, paths);
      watchedPathsToSubscribers.forEach((subscribers, path) => {
        const { blockHeight, value } = data[path];
        const lastValue = latestValueCache.get(path);

        if (
          lastValue &&
          (blockHeight === lastValue[0] ||
            JSON.stringify(value) === lastValue[0])
        ) {
          // The value isn't new, don't notify.
          return;
        }

        latestValueCache.set(path, [
          blockHeight ?? JSON.stringify(value),
          value,
        ]);

        subscribers.forEach(s => {
          s.onUpdate(value);
        });
      });
    } finally {
      isQueryInProgress = false;
      queueNextQuery();
    }
  };

  const stopWatching = (pathKey: string, subscriber: Subscriber<unknown>) => {
    const subscribersForPath = watchedPathsToSubscribers.get(pathKey);
    assert(subscribersForPath, 'Trying to unsubscribed from unwatched path');

    if (subscribersForPath.size === 1) {
      watchedPathsToSubscribers.delete(pathKey);
      latestValueCache.delete(pathKey);
    } else {
      subscribersForPath.delete(subscriber);
    }
  };

  const queueNewPathForQuery = () => {
    if (!isNewPathWatched) {
      isNewPathWatched = true;
      queueNextQuery();
    }
  };

  const watchLatest = <T>(
    path: [AgoricChainStoragePathKind, string],
    onUpdate: (latestValue: T) => void,
  ) => {
    const pathKey = JSON.stringify(path);
    const subscriber = makePathSubscriber(onUpdate);

    const latestValue = latestValueCache.get(pathKey);
    if (latestValue) {
      (subscriber as Subscriber<unknown>).onUpdate(latestValue[1]);
    }

    const samePathSubscribers = watchedPathsToSubscribers.get(pathKey);
    if (samePathSubscribers !== undefined) {
      samePathSubscribers.add(subscriber as Subscriber<unknown>);
    } else {
      watchedPathsToSubscribers.set(
        pathKey,
        new Set([subscriber as Subscriber<unknown>]),
      );
      queueNewPathForQuery();
    }

    return () => stopWatching(pathKey, subscriber as Subscriber<unknown>);
  };

  return {
    watchLatest,
  };
};

/* ============== BELOW FOR TESTING ONLY ============== */

const fetchRPCAddr = async (netconfigURL: string) => {
  const response = await fetch(netconfigURL, {
    headers: { accept: 'application/json' },
  });
  const { rpcAddrs } = await response.json();

  return rpcAddrs[Math.floor(Math.random() * rpcAddrs.length)];
};

let watcher: ReturnType<typeof makeAgoricChainStorageWatcher>;

export const tryBatchRequests = async (
  networkConfigUrl: string,
  unserialize: Unserialize<string>,
) => {
  const rpc = await fetchRPCAddr(networkConfigUrl);
  watcher ||= makeAgoricChainStorageWatcher(rpc, unserialize);

  const stopWatching = watcher.watchLatest(
    [AgoricChainStoragePathKind.Data, 'published.vaultFactory.governance'],
    d => {
      console.log('GOT UPDATE (SHOULD STOP LATER)', d);
    },
  );
  const stopWatching2 = watcher.watchLatest(
    [AgoricChainStoragePathKind.Data, 'published.vaultFactory.governance'],
    d => {
      console.log('GOT UPDATE (duplicate)', d);
    },
  );
  watcher.watchLatest(
    [AgoricChainStoragePathKind.Children, 'published.vaultFactory'],
    d => {
      console.log('GOT UPDATE', d);
    },
  );
  watcher.watchLatest(
    [AgoricChainStoragePathKind.Children, 'published.vaultFactory.managers'],
    d => {
      console.log('GOT UPDATE', d);
    },
  );

  // Soon enough to be included in first query.
  window.setTimeout(() => {
    watcher.watchLatest(
      [
        AgoricChainStoragePathKind.Children,
        'published.vaultFactory.managers.manager0.vaults',
      ],
      d => {
        console.log('GOT UPDATE (SHOULD BE IN FIRST QUERY)', d);
      },
    );
  }, 10);

  // Later on...
  window.setTimeout(() => {
    watcher.watchLatest(
      [
        AgoricChainStoragePathKind.Data,
        'published.vaultFactory.managers.manager0.vaults.vault1',
      ],
      d => {
        console.log('GOT UPDATE (SHOULD BE LATER)', d);
      },
    );
    stopWatching();
  }, 3000);

  window.setTimeout(() => {
    watcher.watchLatest(
      [
        AgoricChainStoragePathKind.Data,
        'published.vaultFactory.managers.manager0.vaults.vault2',
      ],
      d => {
        console.log('GOT UPDATE (SHOULD BE MUCH LATER)', d);
      },
    );
    watcher.watchLatest(
      [AgoricChainStoragePathKind.Children, 'published.vaultFactory'],
      d => {
        console.log('REPEAT UPDATE (SHOULD BE MUCH LATER)', d);
      },
    );
    stopWatching2();
  }, 10000);
};
