import { useVaultStore, vaultLocalStorageStore } from 'store/vaults';
import { appStore } from 'store/app';
import { toast } from 'react-toastify';
import { calculateMinimumCollateralization } from '@agoric/inter-protocol/src/vaultFactory/math';
import { CollateralAction, DebtAction } from 'store/adjustVault';
import type { Brand, Amount } from '@agoric/ertp/src/types';
import type { Ratio, PriceQuote } from 'store/vaults';
import type {
  AgoricContractInvitationSpec,
  ContinuingInvitationSpec,
} from '@agoric/smart-wallet/src/invitations';
import type {
  LiquidationSchedule,
  VaultInfoChainData,
  VaultMetrics,
} from 'store/vaults';
import { AgoricChainStoragePathKind as Kind } from '@agoric/rpc';
import { invertRatio } from '@agoric/zoe/src/contractSupport';

type ValuePossessor<T> = {
  value: T;
};

type PriceFeedUpdate = {
  quoteAmount: PriceQuote;
  quotePayment: unknown;
};

const getChainStorageWatcher = () => {
  const { chainStorageWatcher } = appStore.getState();
  assert(chainStorageWatcher, 'chainStorageWatcher not initialized');

  return chainStorageWatcher;
};

const watchLiquidationSchedule = () => {
  const chainStorageWatcher = getChainStorageWatcher();

  const path = 'published.auction.schedule';

  return chainStorageWatcher.watchLatest<LiquidationSchedule>(
    [Kind.Data, path],
    liquidationSchedule => useVaultStore.setState({ liquidationSchedule }),
    e => console.error(`Error watching ${path}`, e),
  );
};

// Subscribes to price feeds for new brands.
const watchPriceFeeds = (prefix: string) => {
  const chainStorageWatcher = getChainStorageWatcher();
  const subscriptionStoppers = new Array<() => void>();

  // Map of collateral brands to any manager that publishes a price quote of
  // that brand. If two managers have the same brand, their price quotes are
  // the same (denoted in IST), so we only need to watch one.
  const brandsToWatch = new Map<Brand, string>();

  const watchedBrands = new Set<Brand>();

  const watchFeed = (brand: Brand, managerId: string) => {
    watchedBrands.add(brand);
    const path = `${prefix}.${managerId}.quotes`;

    subscriptionStoppers.push(
      chainStorageWatcher.watchLatest<PriceFeedUpdate>(
        [Kind.Data, path],
        value => {
          console.debug('got update', path, value);
          useVaultStore.getState().setPrice(brand, value);
        },
        e => {
          console.error('Error watching brand price feed', brand, e);
          useVaultStore.getState().setPriceError(brand, e);
        },
      ),
    );
  };

  const watchNewBrands = () => {
    brandsToWatch.forEach((managerId, brand) => {
      if (watchedBrands.has(brand)) return;
      watchFeed(brand, managerId);
    });
  };

  const updateBrands = (vaultMetrics: Map<string, VaultMetrics>) => {
    vaultMetrics.forEach((metrics, managerId) => {
      const { brand } = metrics.retainedCollateral;
      if (!brandsToWatch.has(brand)) {
        brandsToWatch.set(metrics.retainedCollateral.brand, managerId);
      }
    });
    watchNewBrands();
  };

  const { vaultMetrics: currentMetrics } = useVaultStore.getState();
  updateBrands(currentMetrics);

  const unsubVaultStore = useVaultStore.subscribe(({ vaultMetrics }) => {
    updateBrands(vaultMetrics);
  });

  return () => {
    unsubVaultStore();
    for (const s of subscriptionStoppers) {
      s();
    }
  };
};

type VaultSubscribers = {
  vault: string;
};

/**
 * Ex. `asset: 'published.vaultFactory.manager0'` -> `'manager0'`.
 */
const getManagerIdFromSubscribers = (subscribers: VaultSubscribers) =>
  subscribers.vault
    .split('.')
    .find(node => node.startsWith('manager') && !node.startsWith('managers'));

const MANAGER_RE = /manager\d+/;

const managerIdFromPath = (path: string) => {
  const id = path.split('.').find(segment => segment.match(MANAGER_RE));
  assert(id, 'No manager id found in path ' + path);
  return id;
};

const getIndexFromVaultPath = (subscriberPath: string) =>
  Number(subscriberPath.split('.').pop()?.replace('vault', ''));

const watchUserVaults = () => {
  const chainStorageWatcher = getChainStorageWatcher();
  const subscriptionStoppers = new Array<() => void>();
  const watchedVaults = new Set<string>();

  const watchVault = (
    offerId: string,
    subscriber: string,
    managerId: string,
  ) => {
    vaultLocalStorageStore.getState().setHasPreviouslyCreatedVault(true);
    const indexWithinManager = getIndexFromVaultPath(subscriber);

    useVaultStore
      .getState()
      .markVaultForLoading(offerId, managerId, offerId, indexWithinManager);

    const path = `${subscriber}`;

    subscriptionStoppers.push(
      chainStorageWatcher.watchLatest<VaultInfoChainData>(
        [Kind.Data, path],
        value => {
          console.debug('got update', subscriber, value);
          const debtSnapshot = value.debtSnapshot && {
            debt: value.debtSnapshot.debt,
            stabilityFee:
              value.debtSnapshot.stabilityFee ??
              // @ts-expect-error backwards compatible until https://github.com/Agoric/agoric-sdk/issues/7839
              value.debtSnapshot?.interest,
          };

          useVaultStore.getState().setVault(offerId, {
            ...value,
            debtSnapshot,
            managerId,
            isLoading: false,
            createdByOfferId: offerId,
            indexWithinManager: indexWithinManager,
          });
        },
        e => {
          console.error(`Error watching vault ${offerId} ${path}`, e);
          useVaultStore.getState().setVaultError(offerId, e);
        },
      ),
    );
  };

  const watchNewVaults = (
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

      watchVault(offerId, vaultSubscriber, managerId);
    });
  };

  const unsubAppStore = appStore.subscribe(
    ({ offerIdsToPublicSubscribers: value }) => {
      if (value === null) return;
      watchNewVaults(value);
    },
  );

  return () => {
    unsubAppStore();
    for (const s of subscriptionStoppers) {
      s();
    }
  };
};

type GoverenedParamsCurrent = {
  DebtLimit: ValuePossessor<Amount<'nat'>>;
  StabilityFee?: ValuePossessor<Ratio>;
  // TODO remove backwards compatibility after https://github.com/Agoric/agoric-sdk/issues/7588
  InterestRate: ValuePossessor<Ratio>;
  LiquidationPenalty: ValuePossessor<Ratio>;
  LiquidationMargin: ValuePossessor<Ratio>;
  LiquidationPadding: ValuePossessor<Ratio>;
  MintFee: ValuePossessor<Ratio>;
};

type GovernedParamsUpdate = {
  current: GoverenedParamsCurrent;
};

type MetricsUpdate = VaultMetrics;

type VaultManagerUpdate = {
  compoundedStabilityFee?: Ratio;
  // TODO remove backwards compatibility after https://github.com/Agoric/agoric-sdk/issues/7588
  compoundedInterest: Ratio;
  latestStabilityFeeUpdate?: bigint;
  // TODO remove backwards compatibility after https://github.com/Agoric/agoric-sdk/issues/7588
  latestInterestUpdate: bigint;
};

type VaultFactoryParamsUpdate = {
  current: {
    MinInitialDebt: ValuePossessor<Amount<'nat'>>;
    ReferencedUI?: ValuePossessor<string>;
    // TODO remove backwards compatibility after https://github.com/Agoric/agoric-sdk/issues/7839
    EndorsedUI: ValuePossessor<string>;
  };
};

export const watchVaultFactory = () => {
  const chainStorageWatcher = getChainStorageWatcher();
  const subscriptionStoppers = new Array<() => void>();

  const watchGovernedParams = (prefix: string) => {
    const path = `${prefix}.governance`;
    const id = managerIdFromPath(prefix);
    const s = chainStorageWatcher.watchLatest<GovernedParamsUpdate>(
      [Kind.Data, path],
      value => {
        console.debug('got update', path, value);
        const { current } = value;
        const stabilityFee =
          current.StabilityFee?.value ?? value.current.InterestRate?.value;
        const liquidationPenalty = current.LiquidationPenalty.value;
        const liquidationMargin = current.LiquidationMargin.value;
        const liquidationPadding = current.LiquidationPadding.value;
        const mintFee = current.MintFee.value;
        const debtLimit = current.DebtLimit.value;

        const inferredMinimumCollateralization =
          calculateMinimumCollateralization(
            liquidationMargin,
            liquidationPadding,
          );

        useVaultStore.getState().setVaultGovernedParams(id, {
          debtLimit,
          stabilityFee,
          liquidationMargin,
          liquidationPenalty,
          mintFee,
          inferredMinimumCollateralization,
        });
      },
      e => {
        console.error('Error watching vault manager params', id, e);
        useVaultStore.getState().setVaultManagerLoadingError(id, e);
      },
    );
    subscriptionStoppers.push(s);
  };

  const watchMetrics = (prefix: string) => {
    const path = `${prefix}.metrics`;
    const id = managerIdFromPath(prefix);
    const s = chainStorageWatcher.watchLatest<MetricsUpdate>(
      [Kind.Data, path],
      value => {
        console.debug('got update', path, value);
        useVaultStore.getState().setVaultMetrics(id, {
          ...value,
          // Invert the lockedQuote to be congruent with oracle price quotes.
          lockedQuote: value.lockedQuote && invertRatio(value.lockedQuote),
        });
      },
      e => {
        console.error('Error watching vault manager metrics', id, e);
        useVaultStore.getState().setVaultManagerLoadingError(id, e);
      },
    );
    subscriptionStoppers.push(s);
  };

  const watchManager = (path: string) => {
    watchGovernedParams(path);
    watchMetrics(path);
    const id = managerIdFromPath(path);

    const s = chainStorageWatcher.watchLatest<VaultManagerUpdate>(
      [Kind.Data, path],
      value => {
        console.debug('got update', path, value);
        const compoundedStabilityFee =
          value.compoundedStabilityFee ?? value.compoundedInterest;
        const latestStabilityFeeUpdate =
          value.latestStabilityFeeUpdate ?? value.latestInterestUpdate;
        useVaultStore.getState().setVaultManager(id, {
          compoundedStabilityFee,
          latestStabilityFeeUpdate,
        });
      },
      e => {
        console.error('Error watching vault manager', id, e);
        useVaultStore.getState().setVaultManagerLoadingError(id, e);
      },
    );
    subscriptionStoppers.push(s);
  };

  const watchVaultFactoryParams = () => {
    const path = 'published.vaultFactory.governance';
    const s = chainStorageWatcher.watchLatest<VaultFactoryParamsUpdate>(
      [Kind.Data, path],
      value => {
        console.debug('got update', path, value);
        useVaultStore.setState({
          vaultFactoryParams: {
            minInitialDebt: value.current.MinInitialDebt.value,
            referencedUI:
              value.current.ReferencedUI?.value ??
              value.current.EndorsedUI?.value,
          },
        });
      },
      e => {
        console.error('Error watching vault factory params', e);
        useVaultStore.setState({
          vaultFactoryParamsLoadingError: 'Error loading vault factory params',
        });
      },
    );
    subscriptionStoppers.push(s);
  };

  const startWatching = () => {
    const managerPrefix = 'published.vaultFactory.managers';
    const watchedManagers = new Set<string>();

    const unsubManagerIds = chainStorageWatcher.watchLatest<string[]>(
      [Kind.Children, managerPrefix],
      managerIds => {
        useVaultStore.setState({ vaultManagerIds: managerIds });

        for (const id of managerIds) {
          if (watchedManagers.has(id)) continue;
          watchedManagers.add(id);
          watchManager(`${managerPrefix}.${id}`);
        }
      },
      e => {
        const msg = 'Error fetching vault managers';
        console.error(msg, e);
        useVaultStore.setState({ managerIdsLoadingError: msg });
      },
    );
    subscriptionStoppers.push(unsubManagerIds);

    subscriptionStoppers.push(watchPriceFeeds(`${managerPrefix}`));

    watchVaultFactoryParams();
  };

  startWatching();
  subscriptionStoppers.push(watchUserVaults());
  subscriptionStoppers.push(watchLiquidationSchedule());

  return () => {
    for (const s of subscriptionStoppers) {
      s();
    }
  };
};

export const makeOpenVaultOffer = async (
  toLock: Amount<'nat'>,
  toMint: Amount<'nat'>,
  onSuccess?: () => void,
) => {
  const { chainConnection } = appStore.getState();
  assert(chainConnection);

  const spec: AgoricContractInvitationSpec = {
    source: 'agoricContract',
    instancePath: ['VaultFactory'],
    callPipe: [
      ['getCollateralManager', [toLock.brand]],
      ['makeVaultInvitation'],
    ],
  };

  const proposal = {
    give: {
      Collateral: toLock,
    },
    want: {
      Minted: toMint,
    },
  };

  const toastId = toast.info('Submitting transaction...');
  chainConnection.makeOffer(
    spec,
    proposal,
    undefined,
    ({ status, data }: { status: string; data: object }) => {
      if (status === 'error') {
        console.error('Offer error', data);
        toast.dismiss(toastId);
        toast.error(`Offer failed: ${data}`);
      }
      if (status === 'refunded') {
        toast.dismiss(toastId);
        toast.error('Offer refunded');
      }
      if (status === 'accepted') {
        toast.dismiss(toastId);
        onSuccess && onSuccess();
      }
    },
  );
};

type Proposal = {
  give: {
    Collateral?: Amount;
    Minted?: Amount;
  };
  want: {
    Collateral?: Amount;
    Minted?: Amount;
  };
};

type AdjustParams = {
  vaultOfferId: string;
  collateral?: { amount: Amount<'nat'>; action: CollateralAction };
  debt?: { amount: Amount<'nat'>; action: DebtAction };
  onSuccess?: () => void;
};

export const makeAdjustVaultOffer = async ({
  vaultOfferId,
  collateral,
  debt,
  onSuccess,
}: AdjustParams) => {
  const { chainConnection } = appStore.getState();
  assert(chainConnection);

  const spec: ContinuingInvitationSpec = {
    source: 'continuing',
    previousOffer: vaultOfferId,
    invitationMakerName: 'AdjustBalances',
  };

  const proposal: Proposal = { give: {}, want: {} };

  if (collateral?.action === CollateralAction.Deposit) {
    proposal.give.Collateral = collateral.amount;
  }
  if (collateral?.action === CollateralAction.Withdraw) {
    proposal.want.Collateral = collateral.amount;
  }
  if (debt?.action === DebtAction.Mint) {
    proposal.want.Minted = debt.amount;
  }
  if (debt?.action === DebtAction.Repay) {
    proposal.give.Minted = debt.amount;
  }

  const toastId = toast.info('Submitting transaction...');
  chainConnection.makeOffer(
    spec,
    proposal,
    undefined,
    ({ status, data }: { status: string; data: object }) => {
      if (status === 'error') {
        console.error('Offer error', data);
        toast.dismiss(toastId);
        toast.error(`Offer failed: ${data}`);
      }
      if (status === 'refunded') {
        toast.dismiss(toastId);
        toast.error('Offer refunded');
      }
      if (status === 'accepted') {
        toast.dismiss(toastId);
        onSuccess && onSuccess();
      }
    },
  );
};

export const makeCloseVaultOffer = async (
  vaultOfferId: string,
  collateral?: Amount<'nat'>,
  debt?: Amount<'nat'>,
  onSuccess?: () => void,
) => {
  const { chainConnection } = appStore.getState();
  assert(chainConnection);

  const spec: ContinuingInvitationSpec = {
    source: 'continuing',
    previousOffer: vaultOfferId,
    invitationMakerName: 'CloseVault',
  };

  const proposal = {
    give: { Minted: debt },
    want: { Collateral: collateral },
  };

  const toastId = toast.info('Submitting transaction...');
  chainConnection.makeOffer(
    spec,
    proposal,
    undefined,
    ({ status, data }: { status: string; data: object }) => {
      if (status === 'error') {
        console.error('Offer error', data);
        toast.dismiss(toastId);
        toast.error(`Offer failed: ${data}`);
      }
      if (status === 'refunded') {
        toast.dismiss(toastId);
        toast.error('Offer refunded');
      }
      if (status === 'accepted') {
        toast.dismiss(toastId);
        onSuccess && onSuccess();
      }
    },
  );
};
