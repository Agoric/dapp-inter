import { fetchRPCAddr, fetchVstorageKeys } from 'utils/rpc';
import { useVaultStore } from 'store/vaults';
import { makeFollower, iterateLatest } from '@agoric/casting';
import { appStore } from 'store/app';
import type { Marshal } from '@endo/marshal';
import type { BrandInfo } from 'store/app';
import type { Brand } from '@agoric/ertp/src/types';

const issuerPetnameToPriceFeed = new Map<string, string>([
  ['IbcATOM', 'ATOM-USD_price_feed'],
]);

// Subscribes to price feeds for new brands.
const watchPriceFeeds = (unserializer: Marshal<unknown>, leader: unknown) => {
  let isStopped = false;
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
    const f = makeFollower(path, leader, { unserializer });
    watchedBrands.add(brand);
    for await (const { value } of iterateLatest(f)) {
      if (isStopped) break;
      console.debug('got update', path, value);
      useVaultStore.getState().setPrice(brand, value.quoteAmount);
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

export const watchVaultFactory = (
  netconfigUrl: string,
  unserializer: Marshal<unknown>,
  leader: unknown,
) => {
  let isStopped = false;

  const makeBoardFollower = (path: string) =>
    makeFollower(path, leader, { unserializer });

  const watchGovernedParams = async (id: string) => {
    const path = `:published.vaultFactory.${id}.governance`;
    const f = makeBoardFollower(path);
    for await (const { value } of iterateLatest(f)) {
      if (isStopped) break;
      console.debug('got update', path, value);
      useVaultStore.getState().setVaultGovernedParams(id, value.current);
    }
  };

  const watchMetrics = async (id: string) => {
    const path = `:published.vaultFactory.${id}.metrics`;
    const f = makeBoardFollower(path);
    for await (const { value } of iterateLatest(f)) {
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
    for await (const { value } of iterateLatest(f)) {
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
  const stopWatchingPriceFeeds = watchPriceFeeds(unserializer, leader);

  return () => {
    isStopped = true;
    stopWatchingPriceFeeds();
  };
};
