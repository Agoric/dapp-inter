import AmountInput from 'components/AmountInput';

const ConfigureNewVault = () => {
  return (
    <div className="mt-8 px-12 py-8 bg-white rounded-[20px] shadow-[0_40px_40px_0_rgba(116,116,116,0.25)]">
      <h3 className="mb-3 font-serif font-bold leading-[26px]">Configure</h3>
      <p className="font-serif text-[#666980] leading-[26px]">
        Choose your vault parameters.
      </p>
      <div className="mt-12 flex gap-x-20 gap-y-6 flex-wrap">
        <AmountInput label="Atom to lock up *" error="Need to obtain funds" />
        <AmountInput label="Collateralization ratio *" />
        <AmountInput label="IST to receive *" disabled />
      </div>
      <p className="mt-12 italic font-serif text-[#666980] text-sm leading-[22px]">
        A vault creation fee will be charged on vault creation.
      </p>
    </div>
  );
};

export default ConfigureNewVault;
