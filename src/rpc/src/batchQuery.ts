import { AgoricChainStoragePathKind } from './types';
import type { Unserialize } from '@endo/marshal';

export const batchVstorageQuery = (
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

          const data = JSON.parse(window.atob(entry.result.response.value));

          if (paths[index][0] === AgoricChainStoragePathKind.Children) {
            return [
              JSON.stringify(paths[index]),
              { value: data.children, blockHeight: undefined },
            ];
          }

          const value = JSON.parse(data.value);

          const latestValueStr = value.values[value.values.length - 1];
          return [
            JSON.stringify(paths[index]),
            {
              blockHeight: value.blockHeight,
              value: unserialize(JSON.parse(latestValueStr)),
            },
          ];
        }),
      ),
    );
};
