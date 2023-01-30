import { fetchRPCAddr, fetchVstorageKeys } from 'utils/rpc';
import {
  useVaultStore,
  VaultInfoChainData,
  VaultManager,
  VaultMetrics,
} from 'store/vaults';
import { makeFollower, iterateLatest } from '@agoric/casting';
import { appStore } from 'store/app';
import { toast } from 'react-toastify';
import { CapData } from '@endo/marshal';
import type { Brand, Amount } from '@agoric/ertp/src/types';
import type { Ratio, PriceQuote } from 'store/vaults';

type ValuePossessor<T> = {
  value: T;
};

type PriceFeedUpdate = ValuePossessor<{
  quoteAmount: PriceQuote;
  quotePayment: unknown;
}>;

// Subscribes to price feeds for new brands.
const watchPriceFeeds = () => {
  let isStopped = false;
  const { leader, importContext } = appStore.getState();

  // Map of collateral brands to any manager that publishes a price quote of
  // that brand. If two managers have the same brand, their price quotes are
  // the same (denoted in IST), so we only need to watch one.
  const brandsToWatch = new Map<Brand, string>();

  const watchedBrands = new Set<Brand>();

  const watchFeed = async (brand: Brand, managerId: string) => {
    watchedBrands.add(brand);
    const path = `:published.vaultFactory.${managerId}.quotes`;
    const f = makeFollower(path, leader, {
      unserializer: importContext.fromBoard,
    });

    for await (const { value } of iterateLatest<PriceFeedUpdate>(f)) {
      if (isStopped) break;
      console.debug('got update', path, value);
      useVaultStore.getState().setPrice(brand, value);
    }
  };

  const watchNewBrands = () => {
    brandsToWatch.forEach((managerId, brand) => {
      if (watchedBrands.has(brand)) return;

      watchFeed(brand, managerId).catch((e: unknown) => {
        console.error('Error watching brand price feed', brand, e);
        useVaultStore.getState().setPriceError(brand, e);
      });
    });
  };

  const unsubVaultStore = useVaultStore.subscribe(({ vaultMetrics }) => {
    vaultMetrics.forEach((metrics, managerId) => {
      const { brand } = metrics.retainedCollateral;
      if (!brandsToWatch.has(brand)) {
        brandsToWatch.set(metrics.retainedCollateral.brand, managerId);
      }
    });
    watchNewBrands();
  });

  return () => {
    isStopped = true;
    unsubVaultStore();
  };
};

type VaultSubscribers = {
  asset: string;
  vault: string;
};

/**
 * Ex. `asset: 'published.vaultFactory.manager0'` -> `'manager0'`.
 */
const getManagerIdFromSubscribers = (subscribers: VaultSubscribers) =>
  subscribers.asset.split('.').pop();

const watchUserVaults = () => {
  let isStopped = false;
  const watchedVaults = new Set<string>();

  const watchVault = async (
    offerId: string,
    subscriber: string,
    managerId: string,
  ) => {
    useVaultStore.getState().markVaultForLoading(offerId, managerId, offerId);

    const { leader, importContext } = appStore.getState();
    const f = makeFollower(`:${subscriber}`, leader, {
      unserializer: importContext.fromBoard,
    });

    for await (const { value } of iterateLatest<VaultUpdate>(f)) {
      if (isStopped) break;
      console.debug('got update', subscriber, value);
      useVaultStore.getState().setVault(offerId, {
        ...value,
        managerId,
        isLoading: false,
        createdByOfferId: offerId,
      });
    }
  };

  const watchNewVaults = async (
    subscribers: Record<string, Record<string, string>>,
  ) => {
    if (!useVaultStore.getState().vaults) {
      useVaultStore.setState({ vaults: new Map() });
    }

    Object.entries(subscribers).forEach(([offerId, subscribers]) => {
      // XXX: If a third party contract returns a similar looking offer result,
      // it could trick the UI into thinking the user has a vault. A better way
      // to filter offers will be needed in MN-3.
      const vaultSubscriber = (subscribers as VaultSubscribers).vault;
      if (!vaultSubscriber || watchedVaults.has(offerId)) {
        return;
      }
      watchedVaults.add(offerId);
      const managerId = getManagerIdFromSubscribers(
        subscribers as VaultSubscribers,
      );
      assert(managerId);

      watchVault(offerId, vaultSubscriber, managerId).catch(e => {
        console.error(`Error watching vault ${offerId} ${vaultSubscriber}`, e);
        useVaultStore.getState().setVaultError(offerId, e);
      });
    });
  };

  const unsubAppStore = appStore.subscribe(
    ({ offerIdsToPublicSubscribers: value }) => {
      if (value === null) return;
      watchNewVaults(value);
    },
  );

  return () => {
    isStopped = true;
    unsubAppStore();
  };
};

type GovernedParamsUpdate = ValuePossessor<{
  current: {
    DebtLimit: ValuePossessor<Amount<'nat'>>;
    InterestRate: ValuePossessor<Ratio>;
    LiquidationPenalty: ValuePossessor<Ratio>;
    LiquidationMargin: ValuePossessor<Ratio>;
    LoanFee: ValuePossessor<Ratio>;
  };
}>;

type MetricsUpdate = ValuePossessor<VaultMetrics>;

type VaultManagerUpdate = ValuePossessor<VaultManager>;

type VaultFactoryParamsUpdate = ValuePossessor<{
  current: { MinInitialDebt: ValuePossessor<Amount<'nat'>> };
}>;

type AgoricInstancesUpdate = ValuePossessor<Array<[string, unknown]>>;

type VaultUpdate = ValuePossessor<VaultInfoChainData>;

export const watchVaultFactory = (netconfigUrl: string) => {
  let isStopped = false;
  const { leader, importContext } = appStore.getState();

  const makeBoardFollower = (path: string) =>
    makeFollower(path, leader, { unserializer: importContext.fromBoard });

  const watchGovernedParams = async (id: string) => {
    const path = `:published.vaultFactory.${id}.governance`;
    const f = makeBoardFollower(path);
    for await (const { value } of iterateLatest<GovernedParamsUpdate>(f)) {
      if (isStopped) break;
      console.debug('got update', path, value);
      const { current } = value;
      const debtLimit = current.DebtLimit.value;
      const interestRate = current.InterestRate.value;
      const liquidationPenalty = current.LiquidationPenalty.value;
      const liquidationMargin = current.LiquidationMargin.value;
      const loanFee = current.LoanFee.value;

      useVaultStore.getState().setVaultGovernedParams(id, {
        debtLimit,
        interestRate,
        liquidationMargin,
        liquidationPenalty,
        loanFee,
      });
    }
  };

  const watchMetrics = async (id: string) => {
    const path = `:published.vaultFactory.${id}.metrics`;
    const f = makeBoardFollower(path);
    for await (const { value } of iterateLatest<MetricsUpdate>(f)) {
      if (isStopped) break;
      console.debug('got update', path, value);
      useVaultStore.getState().setVaultMetrics(id, value);
    }
  };

  const watchManager = async (id: string) => {
    watchGovernedParams(id);
    watchMetrics(id);

    const path = `:published.vaultFactory.${id}`;
    const f = makeBoardFollower(path);
    for await (const { value } of iterateLatest<VaultManagerUpdate>(f)) {
      if (isStopped) break;
      console.debug('got update', path, value);
      useVaultStore.getState().setVaultManager(id, value);
    }
  };

  const watchVaultFactoryParams = async () => {
    const path = ':published.vaultFactory.governance';
    const f = makeBoardFollower(path);
    for await (const { value } of iterateLatest<VaultFactoryParamsUpdate>(f)) {
      if (isStopped) break;
      console.debug('got update', path, value);
      useVaultStore.setState({
        vaultFactoryParams: {
          minInitialDebt: value.current.MinInitialDebt.value,
        },
      });
    }
  };

  const watchVaultFactoryInstanceHandle = async () => {
    const path = ':published.agoricNames.instance';
    const f = makeBoardFollower(path);
    for await (const { value } of iterateLatest<AgoricInstancesUpdate>(f)) {
      if (isStopped) break;
      console.debug('got update', path, value);
      const instanceEntry = value.find(
        ([instanceName]) => instanceName === 'VaultFactory',
      );
      assert(instanceEntry, 'Missing VaultFactory from agoricNames.instances');
      useVaultStore.setState({ vaultFactoryInstanceHandle: instanceEntry[1] });
    }
  };

  const startWatching = async () => {
    let rpc: string;
    try {
      rpc = await fetchRPCAddr(netconfigUrl);
    } catch (e) {
      if (isStopped) return;
      const msg = 'Error fetching RPC address from network config';
      console.error(msg, netconfigUrl, e);
      useVaultStore.setState({ managerIdsLoadingError: msg });
      return;
    }
    if (isStopped) return;

    let managerIds;
    try {
      managerIds = await fetchVstorageKeys(rpc, 'published.vaultFactory').then(
        res =>
          (res.children as string[]).filter(key => key.startsWith('manager')),
      );
      assert(managerIds);
    } catch (e) {
      if (isStopped) return;
      const msg = 'Error fetching vault managers';
      console.error(msg, e);
      useVaultStore.setState({ managerIdsLoadingError: msg });
      return;
    }
    if (isStopped) return;

    useVaultStore.setState({ vaultManagerIds: managerIds });
    managerIds.forEach(id =>
      watchManager(id).catch(e => {
        console.error('Error watching vault manager id', id, e);
        useVaultStore.getState().setVaultManagerLoadingError(id, e);
      }),
    );
    watchVaultFactoryParams().catch(e => {
      console.error('Error watching vault factory governed params', e);
      useVaultStore.setState({
        vaultFactoryParamsLoadingError:
          'Error loading vault factorys governed parameters',
      });
    });
    watchVaultFactoryInstanceHandle().catch(e => {
      console.error('Error watching agoric instances', e);
      useVaultStore.setState({
        vaultFactoryInstanceHandleLoadingError:
          'Error loading vault factory instance id',
      });
    });
  };

  startWatching();
  const stopWatchingPriceFeeds = watchPriceFeeds();
  const stopWatchingUserVaults = watchUserVaults();

  return () => {
    isStopped = true;
    stopWatchingPriceFeeds();
    stopWatchingUserVaults();
  };
};

export const makeOpenVaultOffer = async (
  toLock: Amount<'nat'>,
  toBorrow: Amount<'nat'>,
) => {
  const INVITATION_METHOD = 'makeVaultInvitation';

  const { vaultFactoryInstanceHandle } = useVaultStore.getState();
  const { importContext, offerSigner } = appStore.getState();
  const serializedInstance = importContext.fromBoard.serialize(
    vaultFactoryInstanceHandle,
  ) as CapData<'Instance'>;
  const serializedToLock = importContext.fromBoard.serialize(
    toLock,
  ) as CapData<'Amount'>;
  const serializedtoBorrow = importContext.fromBoard.serialize(
    toBorrow,
  ) as CapData<'Amount'>;

  const offerConfig = {
    publicInvitationMaker: INVITATION_METHOD,
    instanceHandle: serializedInstance,
    proposalTemplate: {
      give: {
        Collateral: {
          amount: serializedToLock,
        },
      },
      want: {
        Minted: {
          amount: serializedtoBorrow,
        },
      },
    },
  };

  try {
    assert(offerSigner.addOffer);
    offerSigner.addOffer(offerConfig);
    console.log('Offer proposed', offerConfig);
  } catch (e: unknown) {
    console.error(e);
    toast.error('Unable to propose offer.');
  }
};
