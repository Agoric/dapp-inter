import { Dialog, Transition } from '@headlessui/react';
import { useSetAtom, useAtomValue } from 'jotai';
import { Fragment } from 'react';
import { walletUiHrefAtom } from 'store/app';
import { ViewMode, viewModeAtom } from 'store/vaults';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const VaultCreationDialog = ({ isOpen, onClose }: Props) => {
  const walletUrl = useAtomValue(walletUiHrefAtom);
  const setViewMode = useSetAtom(viewModeAtom);

  const goToWallet = () => {
    window.open(walletUrl, 'wallet');
  };

  const gotToVaults = () => {
    onClose();
    setViewMode(ViewMode.Manage);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center text-center cursor-pointer">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="cursor-default w-full max-w-2xl mx-3 transform overflow-hidden rounded-[10px] bg-white text-left align-middle shadow-[0_22px_34px_rgba(116,116,116,0.25)] transition-all">
                <Dialog.Title
                  as="div"
                  className="font-serif text-2xl text-white font-medium px-8 py-6 bg-interPurple"
                >
                  Success: Offer Submitted
                </Dialog.Title>
                <div className="font-serif mt-4 mx-8 mb-8">
                  <p>
                    Your vault creation request has been successfully submitted.
                    Go to your Agoric Smart Wallet to approve. Once your offer
                    is approved, you will be able to view and manage your vault.
                  </p>
                </div>
                <div className="h-[1px] mx-8 bg-[#D8D8D8]" />
                <div className="py-6 px-8">
                  <div className="flex justify-end gap-6">
                    <button
                      className="text-btn-xs flex justify-center rounded  text-[#A3A5B9] border-[#A3A5B9] border-2 px-6 py-3 bg-gray-500 bg-opacity-0 hover:bg-opacity-10 active:bg-opacity-20"
                      onClick={gotToVaults}
                    >
                      Back to vaults
                    </button>
                    <button
                      className="text-btn-xs flex justify-center rounded border border-transparent text-white bg-interPurple px-16 py-3 hover:opacity-80 active:opacity-60"
                      onClick={goToWallet}
                    >
                      Go to wallet
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default VaultCreationDialog;
