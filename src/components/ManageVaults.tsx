import clsx from 'clsx';
import { useVaultStore } from 'store/vaults';
import VaultSummary from 'components/VaultSummary';
import { chainConnectionAtom, displayFunctionsAtom } from 'store/app';
import { useAtomValue } from 'jotai';
import type { PropsWithChildren } from 'react';

type EmptyViewProps = PropsWithChildren<{ isShimmering?: boolean }>;

const EmptyView = ({ children, isShimmering = false }: EmptyViewProps) => {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center overflow-hidden opacity-80',
        isShimmering && 'animate-pulse',
      )}
    >
      <img
        className="relative -top-20 opacity-70"
        width="600px"
        height="600px"
        src="./donut-lock.png"
        alt="vaults unavailable"
      ></img>
      <div className="relative -top-36 text-lg opa">{children}</div>
    </div>
  );
};

const ManageVaults = () => {
  const vaults = useVaultStore(state => state.vaults);
  const chainConnection = useAtomValue(chainConnectionAtom);
  const displayFunctions = useAtomValue(displayFunctionsAtom);

  if (!chainConnection) {
    return <EmptyView>Connect your wallet to manage your vaults.</EmptyView>;
  }

  if (vaults?.size === 0) {
    return <EmptyView>You have not opened any vaults yet.</EmptyView>;
  }

  if (!(vaults && displayFunctions)) {
    return <EmptyView isShimmering={true}>Loading your vaults...</EmptyView>;
  }

  const content = [...vaults.entries()].map(([offerId]) => (
    <VaultSummary key={offerId} offerId={offerId} />
  ));

  return <div className="flex gap-4 flex-wrap p-1">{content}</div>;
};

export default ManageVaults;
