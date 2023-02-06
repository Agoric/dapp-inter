import { Fragment, MouseEventHandler } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { FiChevronDown } from 'react-icons/fi';
import clsx from 'clsx';

const Item = ({
  label,
  onClick,
}: {
  label: string;
  onClick: MouseEventHandler;
}) => {
  return (
    <div className="px-1 py-1 ">
      <Menu.Item>
        {({ active }) => (
          <button
            onClick={onClick}
            className={`${
              active ? 'bg-violet-300 text-white' : 'text-gray-900'
            } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
          >
            {label}
          </button>
        )}
      </Menu.Item>
    </div>
  );
};

type Props = {
  choices: string[];
  selection: string;
  onSelection: (selection: string) => void;
  label: string;
  disabled?: boolean;
};

const StyledDropdown = ({
  choices,
  selection,
  onSelection,
  label,
  disabled = false,
}: Props) => {
  const items = choices.map(choice => (
    <Item
      key={choice}
      onClick={() => {
        onSelection(choice);
      }}
      label={choice}
    />
  ));

  return (
    <Menu as="div" className="relative inline-block text-left font-sans">
      <div>
        <div className="uppercase text-[#F4CCAE] text-xs font-medium my-[2px] h-5">
          {label}
        </div>
        <div
          className={clsx(
            'w-64 flex flex-row transition rounded p-[2px] bg-gradient-to-r shadow-[0_12px_20px_-8px_#F0F0F0] focus-within:shadow-[0_12px_20px_-8px_rgba(255,83,0,0.2)]',
            disabled
              ? 'from-[#D9D9D9] to-[#A8A8A8]'
              : 'from-[#FF7A1A] to-[#FFD81A]',
          )}
        >
          <Menu.Button className="py-2 inline-flex w-full justify-between items-center bg-white rounded-sm px-4 h-full text-sm font-medium">
            {selection}
            <FiChevronDown
              className="ml-2 -mr-1 h-6 w-5 text-interYellow"
              aria-hidden="true"
            />
          </Menu.Button>
        </div>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          {items}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default StyledDropdown;
