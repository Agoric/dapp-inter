import React from 'react';
import { makeAsyncIterableFromNotifier as iterateNotifier } from '@agoric/notifier';
import {
  appStore,
  ChainConnection,
  latestDisclaimerIndex,
  localStorageStore,
} from 'store/app';
import { toast } from 'react-toastify';
import SmartWalletNotFoundToast from 'components/SmartWalletNotFoundToast';
import {
  makeAgoricKeplrConnection,
  AgoricKeplrConnectionErrors as Errors,
} from '@agoric/web-components';
import type { Id as ToastId, ToastContent, ToastOptions } from 'react-toastify';

export const watchPurses = (chainConnection: ChainConnection) => {
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

export const watchPublicSubscribers = (chainConnection: ChainConnection) => {
  let isCancelled = false;

  const watch = async () => {
    const n = chainConnection.publicSubscribersNotifier;

    for await (const entries of iterateNotifier(n)) {
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

type ConnectionError = {
  message: string;
};

const autoCloseDelayMs = 7000;

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

  const connect = async (
    networkConfigUrl: string,
    shouldCheckDisclaimer = true,
  ) => {
    const { isWalletConnectionInProgress, chainConnection, importContext } =
      appStore.getState();

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
      const connection = await makeAgoricKeplrConnection(
        networkConfigUrl,
        importContext,
      );
      appStore.setState({ chainConnection: connection });
      stopWatchingPurses = watchPurses(connection);
      stopWatchingPublicSubscribers = watchPublicSubscribers(connection);
      clearToast();
      localStorageStore.getState().setHasWalletPreviouslyConnected(true);
    } catch (e: unknown) {
      clearToast();
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
        case Errors.noSmartWallet:
          showToast(
            React.createElement(SmartWalletNotFoundToast, {
              hideProgressBar: false,
              autoClose: autoCloseDelayMs,
            }),
          );
          break;
      }
    } finally {
      appStore.setState({ isWalletConnectionInProgress: false });
    }
  };

  const disconnect = () => {
    stopWatchingPurses && stopWatchingPurses();
    stopWatchingPublicSubscribers && stopWatchingPublicSubscribers();
    appStore.setState({
      offerIdsToPublicSubscribers: null,
      purses: null,
      chainConnection: null,
      offerSigner: { isDappApproved: false },
    });
  };

  return { connect, disconnect };
};
