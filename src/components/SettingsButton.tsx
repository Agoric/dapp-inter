import { useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { HiOutlineCog } from 'react-icons/hi';
import { isNodeSelectorOpenAtom } from 'store/app';

const SettingsButton = () => {
  const setIsNodeSelectorOpen = useSetAtom(isNodeSelectorOpenAtom);

  const onClick = useCallback(() => {
    setIsNodeSelectorOpen(true);
  }, [setIsNodeSelectorOpen]);

  return (
    <button
      aria-label="Settings"
      className="inline-flex justify-center items-center rounded-full bg-black bg-opacity-5 px-2 py-2 text-2xl hover:bg-opacity-10 active:bg-opacity-20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition"
      onClick={onClick}
    >
      <HiOutlineCog />
    </button>
  );
};

export default SettingsButton;
