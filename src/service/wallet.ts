import { subscribeLatest } from '@agoric/notifier';
import {
  appStore,
  latestDisclaimerIndex,
  localStorageStore,
  ChainConnection,
} from 'store/app';
import { toast } from 'react-toastify';
import { makeAgoricWalletConnection, Errors } from '@agoric/web-components';
import type { Id as ToastId, ToastContent, ToastOptions } from 'react-toastify';

const watchPurses = (chainConnection: ChainConnection) => {
  let isCancelled = false;

  const watch = async () => {
    const n = chainConnection.pursesNotifier;

    for await (const purses of subscribeLatest(n)) {
      if (isCancelled) return;
      console.debug('got purses', purses);
      appStore.setState({ purses });
    }
  };
  watch().catch((err: Error) => {
    toast.error('There was a problem reading your purse info from the chain.');
    console.error('got watchPurses err', err);
  });

  return () => {
    isCancelled = true;
  };
};

const watchPublicSubscribers = (chainConnection: ChainConnection) => {
  let isCancelled = false;

  const watch = async () => {
    const n = chainConnection.publicSubscribersNotifier;

    for await (const entries of subscribeLatest(n)) {
      if (isCancelled) return;
      if (!entries) continue;

      const offerIdsToPublicSubscribers = Object.fromEntries(entries);
      console.debug(
        'got offer ids to public subscribers',
        offerIdsToPublicSubscribers,
      );
      appStore.setState({ offerIdsToPublicSubscribers });
    }
  };
  watch().catch((err: Error) => {
    toast.error('There was a problem reading your vault info from the chain.');
    console.error('got watchPublicSubscribers err', err);
  });

  return () => {
    isCancelled = true;
  };
};

const watchSmartWalletProvision = async (chainConnection: ChainConnection) => {
  const n = chainConnection.smartWalletStatusNotifier;
  for await (const status of subscribeLatest(n)) {
    console.debug('Provision status', status);
    appStore.setState({ smartWalletProvisioned: status?.provisioned });
  }
};

type ConnectionError = {
  message: string;
};

const autoCloseDelayMs = 7000;

const getReadOnlyAddressFromUrlParams = () =>
  new URLSearchParams(window.location.search).get('address');

const makeReadOnlyClientConfig = (address: string) => {
  return {
    address,
    client: {
      getSequence: () => 0,
      signAndBroadcast: (_address: string, msgs: unknown[], _fee: unknown) => {
        console.log('Messages to sign copied below:');
        console.log(msgs);
        throw new Error(
          'Cannot sign message in read-only mode. See previous console log for message contents.',
        );
      },
    },
  };
};

export const makeWalletService = () => {
  let stopWatchingPurses: () => void;
  let stopWatchingPublicSubscribers: () => void;
  let toastId: ToastId;

  const clearToast = () => {
    if (toastId) {
      toast.dismiss(toastId);
    }
  };

  const showToast = (content: ToastContent, options?: ToastOptions) => {
    toastId = toast.error(content, options);
  };

  const readOnlyAddress = getReadOnlyAddressFromUrlParams();

  const connect = async (shouldCheckDisclaimer = true) => {
    const {
      isWalletConnectionInProgress,
      chainConnection,
      chainStorageWatcher,
      rpcNode,
    } = appStore.getState();

    if (isWalletConnectionInProgress || chainConnection) return;

    if (
      shouldCheckDisclaimer &&
      latestDisclaimerIndex !==
        localStorageStore.getState().latestDisclaimerAgreedIndex
    ) {
      appStore.setState({ isDisclaimerDialogShowing: true });
      return;
    }

    appStore.setState({ isWalletConnectionInProgress: true });
    try {
      assert(rpcNode);
      assert(chainStorageWatcher);
      const connection = await makeAgoricWalletConnection(
        chainStorageWatcher,
        rpcNode,
        (e: unknown) =>
          appStore
            .getState()
            .setChainConnectionError(
              new Error(
                'Error watching wallet state' +
                  (e instanceof Error ? `: ${e.message}` : ''),
              ),
            ),
        // @ts-expect-error Fake clientConfig for special read-only mode.
        readOnlyAddress ? makeReadOnlyClientConfig(readOnlyAddress) : undefined,
      );
      appStore.setState({ chainConnection: connection });
      stopWatchingPurses = watchPurses(connection);
      stopWatchingPublicSubscribers = watchPublicSubscribers(connection);
      watchSmartWalletProvision(connection);
      clearToast();
      localStorageStore.getState().setHasWalletPreviouslyConnected(true);
    } catch (e: unknown) {
      clearToast();
      appStore.setState({ isWalletConnectionInProgress: false });
      localStorageStore.getState().setHasWalletPreviouslyConnected(false);
      switch ((e as ConnectionError).message) {
        case Errors.enableKeplr:
          showToast('Enable the connection in Keplr to continue.', {
            hideProgressBar: false,
            autoClose: autoCloseDelayMs,
          });
          break;
        case Errors.networkConfig:
          showToast('Network not found.');
          break;
        default:
          showToast('Error connecting to wallet, see console for more info.');
          console.error('Unexpected error', e);
          break;
      }
      return;
    }

    appStore.subscribe((state, prev) => {
      if (
        state.smartWalletProvisioned !== null &&
        prev.smartWalletProvisioned === null
      ) {
        appStore.setState({ isWalletConnectionInProgress: false });
      }
    });
  };

  const disconnect = () => {
    stopWatchingPurses && stopWatchingPurses();
    stopWatchingPublicSubscribers && stopWatchingPublicSubscribers();
    appStore.setState({
      offerIdsToPublicSubscribers: null,
      purses: null,
      chainConnection: null,
    });
  };

  return { connect, disconnect };
};
