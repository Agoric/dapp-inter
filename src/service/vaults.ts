import { fetchRPCAddr, fetchVstorageKeys } from 'utils/rpc';
import {
  PriceDescription,
  useVaultStore,
  VaultManager,
  VaultMetrics,
} from 'store/vaults';
import { makeFollower, iterateLatest } from '@agoric/casting';
import { appStore } from 'store/app';
import type { BrandInfo } from 'store/app';
import type { Brand, Amount } from '@agoric/ertp/src/types';
import type { Ratio } from 'store/vaults';

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

type GovernedParamsUpdate = {
  value: {
    current: {
      DebtLimit: ValuePossessor<Amount<'nat'>>;
      InterestRate: ValuePossessor<Ratio>;
      LiquidationPenalty: ValuePossessor<Ratio>;
      LiquidationMargin: ValuePossessor<Ratio>;
      LoanFee: ValuePossessor<Ratio>;
    };
  };
};

type MetricsUpdate = ValuePossessor<VaultMetrics>;

type VaultManagerUpdate = ValuePossessor<VaultManager>;

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

  const startWatching = async () => {
    let rpc;
    try {
      rpc = await fetchRPCAddr(netconfigUrl);
    } catch (e) {
      if (isStopped) return;
      const msg = 'Error fetching RPC address from network config';
      console.error(msg, netconfigUrl, e);
      useVaultStore.setState({ vaultIdsLoadingError: msg });
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
      useVaultStore.setState({ vaultIdsLoadingError: msg });
      return;
    }
    if (isStopped) return;

    useVaultStore.setState({ vaultManagerIds: managerIds });
    managerIds.forEach(id =>
      watchManager(id).catch(e => {
        console.error('Error watching vault manager id', id, e);
        useVaultStore.getState().setVaultLoadingError(id, e);
      }),
    );
  };

  startWatching();
  const stopWatchingPriceFeeds = watchPriceFeeds();

  return () => {
    isStopped = true;
    stopWatchingPriceFeeds();
  };
};
