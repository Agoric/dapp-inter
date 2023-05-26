import clsx from 'clsx';
import WalletIcon from 'svg/wallet';
import { signerTarget } from 'config';
import { useAtomValue } from 'jotai';
import { walletUiHrefAtom } from 'store/app';

type Props = {
  message?: string;
  className?: string;
};

const AssetTransferButton = ({
  message = 'Transfer Funds',
  className,
}: Props) => {
  const walletUrl = useAtomValue(walletUiHrefAtom);

  const goToWallet = () => {
    window.open(walletUrl, signerTarget);
  };

  return (
    <button
      aria-label="Open wallet"
      onClick={goToWallet}
      className={clsx(
        'font-sans flex items-center gap-2 border-2 border-solid border-interGreen fill-interGreen text-interGreen rounded-md px-3 py-2 uppercase text-xs font-semibold bg-emerald-400 bg-opacity-0 hover:bg-opacity-10 active:bg-opacity-20 transition',
        className,
      )}
    >
      <WalletIcon />
      {message}
    </button>
  );
};

export default AssetTransferButton;
