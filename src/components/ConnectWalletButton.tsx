import { useAtomValue } from 'jotai';
import { Oval } from 'react-loader-spinner';

import {
  chainConnectionAtom,
  isWalletConnectionInProgressAtom,
  networkConfigAtom,
  walletServiceAtom,
} from 'store/app';
import clsx from 'clsx';

const ConnectWalletButton = () => {
  const walletService = useAtomValue(walletServiceAtom);
  const isConnectionInProgress = useAtomValue(isWalletConnectionInProgressAtom);
  const chainConnection = useAtomValue(chainConnectionAtom);
  const { url } = useAtomValue(networkConfigAtom);

  const status = (() => {
    if (isConnectionInProgress) {
      return 'Connecting';
    } else if (chainConnection) {
      return 'Keplr Connected';
    }
    return 'Connect Keplr';
  })();

  return (
    <button
      className={clsx(
        'border border-primary group inline-flex items-center rounded-md px-3 py-2 bg-transparent text-base font-medium text-primary',
        !isConnectionInProgress && !chainConnection && 'hover:bg-gray-100',
      )}
      onClick={() => walletService.connect(url)}
    >
      <>
        {status}
        {isConnectionInProgress && (
          <div className="ml-1">
            <Oval color="#c084fc" height={18} width={18} />
          </div>
        )}
      </>
    </button>
  );
};

export default ConnectWalletButton;
