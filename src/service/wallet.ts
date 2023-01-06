import { makeAsyncIterableFromNotifier as iterateNotifier } from '@agoric/notifier';
import { appStore } from 'store/app';
import { toast } from 'react-toastify';
import SmartWalletNotFoundToast from 'components/SmartWalletNotFoundToast';
import {
  makeAgoricKeplrConnection,
  AgoricKeplrConnectionErrors as Errors,
} from '@agoric/web-components';
import type { Id as ToastId, ToastContent, ToastOptions } from 'react-toastify';

export const watchPurses = (chainConnection: { pursesNotifier: unknown }) => {
  let isCancelled = false;

  const watch = async () => {
    const n = chainConnection.pursesNotifier;

    for await (const purses of iterateNotifier(n)) {
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

type ConnectionError = {
  message: string;
};

export const makeWalletService = () => {
  let stopWatchingPurses: () => void;
  let toastId: ToastId;

  const clearToast = () => {
    if (toastId) {
      toast.dismiss(toastId);
    }
  };

  const showToast = (content: ToastContent, options?: ToastOptions) => {
    toastId = toast.error(content, options);
  };

  const connect = async (networkConfigUrl: string) => {
    const { isWalletConnectionInProgress, chainConnection, importContext } =
      appStore.getState();

    if (isWalletConnectionInProgress || chainConnection) return;

    let connection;
    appStore.setState({ isWalletConnectionInProgress: true });
    try {
      connection = await makeAgoricKeplrConnection(
        networkConfigUrl,
        importContext,
      );
      appStore.setState({ chainConnection: connection });
      stopWatchingPurses = watchPurses(connection);
      clearToast();
    } catch (e: unknown) {
      clearToast();
      switch ((e as ConnectionError).message) {
        case Errors.enableKeplr:
          showToast('Enable the connection in Keplr to continue.', {
            hideProgressBar: false,
            autoClose: 5000,
          });
          break;
        case Errors.networkConfig:
          showToast('Network not found.');
          break;
        case Errors.noSmartWallet:
          showToast(SmartWalletNotFoundToast);
          break;
      }
    } finally {
      appStore.setState({ isWalletConnectionInProgress: false });
    }
  };

  const disconnect = () => {
    stopWatchingPurses && stopWatchingPurses();
    appStore.setState({ purses: null });
    appStore.setState({ chainConnection: null });
    appStore.setState({ offerSigner: { isDappApproved: false } });
  };

  return { connect, disconnect };
};
