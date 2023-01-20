import { useAtomValue } from 'jotai';
import { Oval } from 'react-loader-spinner';

import {
  ChainConnection,
  chainConnectionAtom,
  isWalletConnectionInProgressAtom,
  networkConfigAtom,
  walletServiceAtom,
} from 'store/app';
import clsx from 'clsx';

const truncatedAddress = (chainConnection: ChainConnection) =>
  chainConnection.address.substring(chainConnection.address.length - 7);

const ConnectWalletButton = () => {
  const walletService = useAtomValue(walletServiceAtom);
  const isConnectionInProgress = useAtomValue(isWalletConnectionInProgressAtom);
  const chainConnection = useAtomValue(chainConnectionAtom);
  const { url } = useAtomValue(networkConfigAtom);

  const status = (() => {
    if (isConnectionInProgress) {
      return 'Connecting';
    } else if (chainConnection) {
      // TODO, add a way to call walletService.disconnect.
      return `...${truncatedAddress(chainConnection)} Connected`;
    }
    return 'Connect Wallet';
  })();

  return (
    <button
      className={clsx(
        'uppercase box-border border-2 border-mineShaft h-11 inline-flex items-center justify-center rounded-[4px] w-44 py-2 bg-transparent text-xs font-black',
        !isConnectionInProgress &&
          !chainConnection &&
          'hover:bg-black hover:bg-opacity-5',
      )}
      onClick={() => walletService.connect(url)}
    >
      <>
        {status}
        {isConnectionInProgress && (
          <div className="ml-1">
            <Oval color="var(--color-mineShaft)" height={18} width={18} />
          </div>
        )}
      </>
    </button>
  );
};

export default ConnectWalletButton;
