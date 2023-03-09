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
import { calculateMinimumCollateralization } from '@agoric/inter-protocol/src/vaultFactory/math';
import { CollateralAction, DebtAction } from 'store/adjustVault';
import type { Brand, Amount } from '@agoric/ertp/src/types';
import type { Ratio, PriceQuote } from 'store/vaults';
import type {
  AgoricContractInvitationSpec,
  ContinuingInvitationSpec,
} from '@agoric/smart-wallet/src/invitations';

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
    const path = `:published.vaultFactory.managers.${managerId}.quotes`;
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
  vault: string;
};

/**
 * Ex. `asset: 'published.vaultFactory.manager0'` -> `'manager0'`.
 */
const getManagerIdFromSubscribers = (subscribers: VaultSubscribers) =>
  subscribers.vault.split('.').find(node => node.includes('manager'));

const getIndexFromVaultPath = (subscriberPath: string) =>
  Number(subscriberPath.split('.').pop()?.replace('vault', ''));

const watchUserVaults = () => {
  let isStopped = false;
  const watchedVaults = new Set<string>();

  const watchVault = async (
    offerId: string,
    subscriber: string,
    managerId: string,
  ) => {
    const indexWithinManager = getIndexFromVaultPath(subscriber);

    useVaultStore
      .getState()
      .markVaultForLoading(offerId, managerId, offerId, indexWithinManager);

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
        indexWithinManager: indexWithinManager,
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
    LiquidationPadding: ValuePossessor<Ratio>;
    LoanFee: ValuePossessor<Ratio>;
  };
}>;

type MetricsUpdate = ValuePossessor<VaultMetrics>;

type VaultManagerUpdate = ValuePossessor<VaultManager>;

type VaultFactoryParamsUpdate = ValuePossessor<{
  current: { MinInitialDebt: ValuePossessor<Amount<'nat'>> };
}>;

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
      const interestRate = current.InterestRate.value;
      const liquidationPenalty = current.LiquidationPenalty.value;
      const liquidationMargin = current.LiquidationMargin.value;
      const liquidationPadding = current.LiquidationPadding.value;
      const loanFee = current.LoanFee.value;
      const debtLimit = current.DebtLimit.value;

      const inferredMinimumCollateralization =
        calculateMinimumCollateralization(
          liquidationMargin,
          liquidationPadding,
        );

      useVaultStore.getState().setVaultGovernedParams(id, {
        debtLimit,
        interestRate,
        liquidationMargin,
        liquidationPenalty,
        loanFee,
        inferredMinimumCollateralization,
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
  const { importContext, offerSigner } = appStore.getState();

  const spec: AgoricContractInvitationSpec = {
    source: 'agoricContract',
    instancePath: ['VaultFactory'],
    callPipe: [
      ['getCollateralManager', [toLock.brand]],
      ['makeVaultInvitation'],
    ],
  };

  const invitationSpec = importContext.fromBoard.serialize(harden(spec));

  const serializedToLock = importContext.fromBoard.serialize(
    toLock,
  ) as CapData<'Amount'>;
  const serializedtoBorrow = importContext.fromBoard.serialize(
    toBorrow,
  ) as CapData<'Amount'>;

  const offerConfig = {
    invitationSpec,
    proposalTemplate: harden({
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
    }),
  };

  try {
    assert(offerSigner.addOffer && offerSigner.isDappApproved);
    offerSigner.addOffer(offerConfig);
    console.log('Offer proposed', offerConfig);
  } catch (e: unknown) {
    console.error(e);
    toast.error('Unable to propose offer.');
    throw e;
  }
};

type Proposal = {
  give: {
    Collateral?: { amount: CapData<string> };
    Minted?: { amount: CapData<string> };
  };
  want: {
    Collateral?: { amount: CapData<string> };
    Minted?: { amount: CapData<string> };
  };
};

type AdjustParams = {
  vaultOfferId: string;
  collateral?: { amount: Amount<'nat'>; action: CollateralAction };
  debt?: { amount: Amount<'nat'>; action: DebtAction };
};

export const makeAdjustVaultOffer = async ({
  vaultOfferId,
  collateral,
  debt,
}: AdjustParams) => {
  const { importContext, offerSigner } = appStore.getState();

  const spec: ContinuingInvitationSpec = {
    source: 'continuing',
    previousOffer: vaultOfferId,
    invitationMakerName: 'AdjustBalances',
  };

  const invitationSpec = importContext.fromBoard.serialize(harden(spec));

  const proposal: Proposal = { give: {}, want: {} };

  if (collateral?.action === CollateralAction.Deposit) {
    proposal.give.Collateral = {
      amount: importContext.fromBoard.serialize(collateral.amount),
    };
  }
  if (collateral?.action === CollateralAction.Withdraw) {
    proposal.want.Collateral = {
      amount: importContext.fromBoard.serialize(collateral.amount),
    };
  }
  if (debt?.action === DebtAction.Borrow) {
    proposal.want.Minted = {
      amount: importContext.fromBoard.serialize(debt.amount),
    };
  }
  if (debt?.action === DebtAction.Repay) {
    proposal.give.Minted = {
      amount: importContext.fromBoard.serialize(debt.amount),
    };
  }

  const offerConfig = {
    invitationSpec,
    proposalTemplate: harden(proposal),
  };

  try {
    assert(offerSigner.addOffer && offerSigner.isDappApproved);
    offerSigner.addOffer(offerConfig);
    console.log('Offer proposed', offerConfig);
  } catch (e: unknown) {
    console.error(e);
    toast.error('Unable to propose offer.');
    throw e;
  }
};

export const makeCloseVaultOffer = async (
  vaultOfferId: string,
  collateral?: Amount<'nat'>,
  debt?: Amount<'nat'>,
) => {
  const { importContext, offerSigner } = appStore.getState();

  const spec: ContinuingInvitationSpec = {
    source: 'continuing',
    previousOffer: vaultOfferId,
    invitationMakerName: 'CloseVault',
  };

  const invitationSpec = importContext.fromBoard.serialize(harden(spec));

  const collateralToWant = collateral
    ? {
        amount: importContext.fromBoard.serialize(collateral),
      }
    : undefined;

  const mintedToGive = collateral
    ? {
        amount: importContext.fromBoard.serialize(debt),
      }
    : undefined;

  const proposal = {
    give: { Minted: mintedToGive },
    want: { Collateral: collateralToWant },
  };

  const offerConfig = {
    invitationSpec,
    proposalTemplate: harden(proposal),
  };

  try {
    assert(offerSigner.addOffer && offerSigner.isDappApproved);
    offerSigner.addOffer(offerConfig);
    console.log('Offer proposed', offerConfig);
  } catch (e: unknown) {
    console.error(e);
    toast.error('Unable to propose offer.');
    throw e;
  }
};
