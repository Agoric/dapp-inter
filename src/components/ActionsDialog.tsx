import { Dialog, Transition } from '@headlessui/react';
import clsx from 'clsx';
import { Fragment, ReactElement, useRef } from 'react';

type DialogAction = {
  label: string;
  action: () => void;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  body: ReactElement;
  primaryAction: DialogAction;
  secondaryAction?: DialogAction;
  primaryActionDisabled?: boolean;
  // Whether to initially focus the primary action.
  initialFocusPrimary?: boolean;
};

const ActionsDialog = ({
  isOpen,
  onClose,
  title,
  body,
  primaryAction,
  secondaryAction,
  primaryActionDisabled = false,
  initialFocusPrimary = false,
}: Props) => {
  const primaryButtonRef = useRef(null);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={onClose}
        initialFocus={initialFocusPrimary ? primaryButtonRef : undefined}
      >
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
              <Dialog.Panel className="cursor-default w-full max-w-2xl mx-3 transform overflow-hidden rounded-10 bg-white text-left align-middle shadow-card transition-all">
                <Dialog.Title
                  as="div"
                  className="font-serif text-2xl text-white font-medium px-8 py-6 bg-interPurple"
                >
                  {title}
                </Dialog.Title>
                <div className="font-serif mt-4 mx-8 mb-8">{body}</div>
                <div className="h-[1px] mx-8 bg-[#D8D8D8]" />
                <div className="py-6 px-8">
                  <div className="flex justify-end gap-6">
                    {secondaryAction && (
                      <button
                        className="transition text-btn-xs flex justify-center rounded text-[#A3A5B9] border-[#A3A5B9] border-2 px-6 py-3 bg-gray-500 bg-opacity-0 hover:bg-opacity-10 active:bg-opacity-20"
                        onClick={secondaryAction.action}
                      >
                        {secondaryAction.label}
                      </button>
                    )}
                    <button
                      ref={primaryButtonRef}
                      disabled={primaryActionDisabled}
                      className={clsx(
                        'transition text-btn-xs flex justify-center rounded border border-transparent text-white px-16 py-3',
                        primaryActionDisabled
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-interPurple hover:opacity-80 active:opacity-60',
                      )}
                      onClick={primaryAction.action}
                    >
                      {primaryAction.label}
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

export default ActionsDialog;
