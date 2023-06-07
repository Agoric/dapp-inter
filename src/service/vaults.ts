import { useVaultStore, vaultLocalStorageStore } from 'store/vaults';
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
import type {
  LiquidationSchedule,
  VaultInfoChainData,
  VaultManager,
  VaultMetrics,
  LiquidationAuctionBook,
} from 'store/vaults';
import { AgoricChainStoragePathKind as Kind } from 'rpc';

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
          useVaultStore.getState().setVault(offerId, {
            ...value,
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

type VaultManagerUpdate = VaultManager;

type LiquidationAuctionBookUpdate = LiquidationAuctionBook;

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
        useVaultStore.getState().setVaultMetrics(id, value);
      },
      e => {
        console.error('Error watching vault manager metrics', id, e);
        useVaultStore.getState().setVaultManagerLoadingError(id, e);
      },
    );
    subscriptionStoppers.push(s);
  };

  const watchLiquidationAuctionBook = (id: string) => {
    const path = `published.auction.${id.replace('manager', 'book')}`;
    const s = chainStorageWatcher.watchLatest<LiquidationAuctionBookUpdate>(
      [Kind.Data, path],
      value => {
        console.debug('got update', path, value);
        useVaultStore.getState().setLiquidationAuctionBook(id, value);
      },
      e => {
        console.error('Error watching vault manager book', id, e);
        useVaultStore.getState().setVaultManagerLoadingError(id, e);
      },
    );
    subscriptionStoppers.push(s);
  };

  const watchManager = (path: string) => {
    watchGovernedParams(path);
    watchMetrics(path);
    const id = managerIdFromPath(path);
    watchLiquidationAuctionBook(id);

    const s = chainStorageWatcher.watchLatest<VaultManagerUpdate>(
      [Kind.Data, path],
      value => {
        console.debug('got update', path, value);
        useVaultStore.getState().setVaultManager(id, value);
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
  const serializedtoMint = importContext.fromBoard.serialize(
    toMint,
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
          amount: serializedtoMint,
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
  if (debt?.action === DebtAction.Mint) {
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
