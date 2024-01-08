import { Combobox as HeadlessComboBox, Transition } from '@headlessui/react';
import { Fragment, useCallback, useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';

const Combobox = ({
  options,
  value,
  onValueChange,
}: {
  options: string[];
  value?: string;
  onValueChange: (newValue: string) => void;
}) => {
  const [query, setQuery] = useState('');

  const filteredOptions =
    query === ''
      ? options
      : options.filter(option => {
          return option.includes(query);
        });

  const onInputChange = useCallback(
    (newValue: string) => {
      setQuery(newValue);
    },
    [setQuery],
  );

  const optionClasses = ({ active }: { active: boolean }) =>
    `relative cursor-pointer select-none py-2 pl-4 pr-4 text-gray-900 hover:bg-gray-100 ${
      active && 'bg-black bg-opacity-5'
    }`;

  return (
    <HeadlessComboBox value={value ?? ''} onChange={onValueChange}>
      <div className="relative mt-1">
        <div className="relative w-full cursor-default overflow-hidden rounded-lg border-solid border-[#d8d8d8] border-[1px] text-left">
          <HeadlessComboBox.Input
            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 focus-visible:outline-none"
            onChange={event => onInputChange(event.target.value)}
          />
          <HeadlessComboBox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <FiChevronDown
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </HeadlessComboBox.Button>
        </div>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <HeadlessComboBox.Options className="z-50 absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
            {filteredOptions?.map(option => (
              <HeadlessComboBox.Option
                key={option}
                value={option}
                className={optionClasses}
              >
                {option}
              </HeadlessComboBox.Option>
            ))}
            {query && !options.includes(query) && (
              <HeadlessComboBox.Option value={query} className={optionClasses}>
                Add &quot;{query}&quot;
              </HeadlessComboBox.Option>
            )}
          </HeadlessComboBox.Options>
        </Transition>
      </div>
    </HeadlessComboBox>
  );
};

export default Combobox;
