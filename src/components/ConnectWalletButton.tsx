import { useAtomValue } from 'jotai';
import { Oval } from 'react-loader-spinner';

import {
  ChainConnection,
  chainConnectionAtom,
  chainStorageWatcherAtom,
  isWalletConnectionInProgressAtom,
  localStorageStore,
  networkConfigAtom,
  walletServiceAtom,
} from 'store/app';
import { suggestChain } from '@agoric/web-components';
import clsx from 'clsx';
import { useEffect } from 'react';
import { useStore } from 'zustand';

const truncatedAddress = (chainConnection: ChainConnection) =>
  chainConnection.address.substring(chainConnection.address.length - 7);

const ConnectWalletButton = () => {
  const walletService = useAtomValue(walletServiceAtom);
  const chainStorageWatcher = useAtomValue(chainStorageWatcherAtom);
  const isConnectionInProgress = useAtomValue(isWalletConnectionInProgressAtom);
  const chainConnection = useAtomValue(chainConnectionAtom);
  const { url } = useAtomValue(networkConfigAtom);
  const { hasWalletPreviouslyConnected } = useStore(localStorageStore);

  // Automatically connect if the user has previously connected.
  useEffect(() => {
    if (
      chainStorageWatcher &&
      hasWalletPreviouslyConnected &&
      !(isConnectionInProgress || chainConnection)
    ) {
      walletService.connect();
    }
  }, [
    chainConnection,
    hasWalletPreviouslyConnected,
    isConnectionInProgress,
    url,
    walletService,
    chainStorageWatcher,
  ]);

  const status = (() => {
    if (isConnectionInProgress) {
      return 'Connecting';
    } else if (chainConnection) {
      // TODO, add a way to call walletService.disconnect.
      return `...${truncatedAddress(chainConnection)} Connected`;
    }
    return 'Connect Wallet';
  })();

  const handleSuggestChainAndConnectWallet = async () => {
    await suggestChain(url);
    walletService.connect();
  };

  const isDisabled = !chainStorageWatcher;

  return (
    <button
      disabled={isDisabled}
      className={clsx(
        'transition uppercase box-border border-2 border-primary h-11 inline-flex items-center justify-center rounded w-44 py-2 bg-transparent text-xs font-black',
        !isConnectionInProgress && !chainConnection && !isDisabled
          ? 'hover:bg-black hover:bg-opacity-5 cursor-pointer'
          : 'cursor-default',
      )}
      onClick={handleSuggestChainAndConnectWallet}
    >
      <>
        {status}
        {isConnectionInProgress && (
          <div className="ml-1">
            <Oval color="rgb(var(--color-primary))" height={18} width={18} />
          </div>
        )}
      </>
    </button>
  );
};

export default ConnectWalletButton;
