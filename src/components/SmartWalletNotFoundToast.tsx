import { signerTarget } from 'config';
import { walletUiHrefAtom } from 'store/app';
import { useAtomValue } from 'jotai';

const SmartWalletNotFoundToast = () => {
  const walletUiHref = useAtomValue(walletUiHrefAtom);

  return (
    <p>
      No Agoric smart wallet found for this address. Create one at{' '}
      <a
        className="underline text-blue-500"
        href={walletUiHref}
        target={signerTarget}
      >
        {walletUiHref}
      </a>{' '}
      then try again.
    </p>
  );
};

export default SmartWalletNotFoundToast;
