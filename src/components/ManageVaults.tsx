import clsx from 'clsx';
import { chainConnectionAtom, displayFunctionsAtom } from 'store/app';
import { useCallback } from 'react';
import { useVaultStore, viewModeAtom, ViewMode } from 'store/vaults';
import VaultSummary from 'components/VaultSummary';
import { useAtomValue, useSetAtom } from 'jotai';
import { FaPlusCircle } from 'react-icons/fa';
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
  const setMode = useSetAtom(viewModeAtom);
  const vaults = useVaultStore(state => state.vaults);
  const chainConnection = useAtomValue(chainConnectionAtom);
  const displayFunctions = useAtomValue(displayFunctionsAtom);

  const buttonProps = {
    text: (
      <>
        <FaPlusCircle size={16} />
        <span>&nbsp;&nbsp;Add new vault</span>
      </>
    ),
    onClick: useCallback(() => setMode(ViewMode.Create), [setMode]),
  };

  let content;

  if (!chainConnection) {
    content = <EmptyView>Connect your wallet to manage your vaults.</EmptyView>;
  } else if (vaults?.size === 0) {
    content = <EmptyView>You have not opened any vaults yet.</EmptyView>;
  } else if (!(vaults && displayFunctions)) {
    content = <EmptyView isShimmering={true}>Loading your vaults...</EmptyView>;
  } else {
    content = (
      <div className="flex gap-4 flex-wrap p-1">
        {[...vaults.keys()].map(vaultKey => (
          <VaultSummary key={vaultKey} vaultKey={vaultKey} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="w-full flex justify-between mt-6">
        <div className="font-serif font-medium text-2xl">My Vaults</div>
        <button
          className="text-[#f9fafe] text-xs uppercase flex flex-row justify-center items-center p-3 bg-interPurple rounded-md shadow-[0_10px_14px_-4px_rgba(183,135,245,0.3)]"
          onClick={buttonProps.onClick}
        >
          {buttonProps.text}
        </button>
      </div>
      {content}
    </>
  );
};

export default ManageVaults;
