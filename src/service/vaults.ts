import { fetchRPCAddr, fetchVstorageKeys } from 'utils/rpc';
import {
  keyForVault,
  PriceDescription,
  useVaultStore,
  VaultInfoChainData,
  VaultManager,
  VaultMetrics,
} from 'store/vaults';
import { makeFollower, iterateLatest } from '@agoric/casting';
import { appStore, VStorageKey } from 'store/app';
import type { BrandInfo } from 'store/app';
import type { Brand, Amount } from '@agoric/ertp/src/types';
import type { Ratio } from 'store/vaults';
import { toast } from 'react-toastify';
import { CapData } from '@endo/marshal';

const issuerPetnameToPriceFeed = new Map<string, string>([
  ['IbcATOM', 'ATOM-USD_price_feed'],
]);

type ValuePossessor<T> = {
  value: T;
};

type PriceFeedUpdate = ValuePossessor<PriceDescription>;

// Subscribes to price feeds for new brands.
const watchPriceFeeds = () => {
  let isStopped = false;
  const { leader, importContext } = appStore.getState();

  const brandsToWatch = new Set<Brand>();
  const watchedBrands = new Set<Brand>();
  let brandToInfo: Map<Brand, BrandInfo> | null = null;

  const watchFeed = async (brand: Brand) => {
    const { petname } = brandToInfo?.get(brand) ?? {};
    if (brandToInfo && !petname) {
      // brandToInfo was loaded but missing this asset, not good.
      throw new Error('Missing display info for brand ' + brand);
    }
    const priceFeed = issuerPetnameToPriceFeed.get(petname ?? '');
    if (!priceFeed) {
      if (petname) {
        // issuerPetnameToPriceFeed is missing this asset, not good.
        throw new Error('Missing price feed for brand ' + petname);
      }
      // brandToInfo must be null, try again after it loads.
      return;
    }

    const path = `:published.priceFeed.${priceFeed}`;
    const f = makeFollower(path, leader, {
      unserializer: importContext.fromBoard,
    });
    watchedBrands.add(brand);
    for await (const { value } of iterateLatest<PriceFeedUpdate>(f)) {
      if (isStopped) break;
      console.debug('got update', path, value);
      useVaultStore.getState().setPrice(brand, value);
    }
  };

  const watchNewBrands = () => {
    brandsToWatch.forEach((brand: Brand) => {
      if (watchedBrands.has(brand)) return;

      watchFeed(brand).catch((e: unknown) => {
        console.error('Error watching brand price feed', brand, e);
        useVaultStore.getState().setPriceError(brand, e);
      });
    });
  };

  const unsubAppStore = appStore.subscribe(({ brandToInfo: value }) => {
    brandToInfo = value;
    watchNewBrands();
  });

  const unsubVaultStore = useVaultStore.subscribe(({ vaultMetrics }) => {
    vaultMetrics.forEach(metrics =>
      brandsToWatch.add(metrics.retainedCollateral.brand),
    );
    watchNewBrands();
  });

  return () => {
    isStopped = true;
    unsubAppStore();
    unsubVaultStore();
  };
};

type VaultSubscribers = {
  asset: VStorageKey;
  vault: VStorageKey;
};

const watchUserVaults = () => {
  let isStopped = false;
  const watchedVaults = new Set<string>();

  const watchVault = async (offerId: string, subsciber: VStorageKey) => {
    const { leader, importContext } = appStore.getState();
    const f = makeFollower(subsciber, leader, {
      unserializer: importContext.fromBoard,
    });

    for await (const { value } of iterateLatest<VaultUpdate>(f)) {
      if (isStopped) break;
      console.debug('got update', subsciber, value);
      useVaultStore
        .getState()
        .setVault(offerId, { ...value, managerId: 'unknown' });
    }
  };

  const watchNewVaults = async (
    subscribers: Record<string, Record<string, VStorageKey>>,
  ) => {
    Object.entries(subscribers).forEach(([offerId, subscribers]) => {
      // XXX: This assumes all entries are vault offers, should filter somehow.
      if (!watchedVaults.has(offerId)) {
        watchedVaults.add(offerId);
        const vaultSubscriber = (subscribers as VaultSubscribers).vault;

        watchVault(offerId, vaultSubscriber).catch(e => {
          console.error(`Error watching vault ${offerId} ${vaultSubscriber}`);
          useVaultStore.getState().setVaultError(offerId, e);
        });
      }
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
  fundPursePetname: string,
  toLock: bigint,
  intoPursePetname: string,
  toBorrow: bigint,
) => {
  const INVITATION_METHOD = 'makeVaultInvitation';

  const { vaultFactoryInstanceHandle } = useVaultStore.getState();
  const { importContext, offerSigner } = appStore.getState();
  const serializedInstance = importContext.fromBoard.serialize(
    vaultFactoryInstanceHandle,
  ) as CapData<'Instance'>;

  const offerConfig = {
    publicInvitationMaker: INVITATION_METHOD,
    instanceHandle: serializedInstance,
    proposalTemplate: {
      give: {
        Collateral: {
          pursePetname: fundPursePetname,
          value: Number(toLock),
        },
      },
      want: {
        Minted: {
          pursePetname: intoPursePetname,
          value: Number(toBorrow),
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
