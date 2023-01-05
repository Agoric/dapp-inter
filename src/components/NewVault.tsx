import { useVaultStore } from 'store/vaults';

type Props = { id: string };

const NewVault = ({ id }: Props) => {
  const {
    vaultGovernedParams,
    vaultLoadingErrors,
    vaultManagers,
    vaultMetrics,
    prices,
    priceErrors,
  } = useVaultStore();

  const manager = vaultManagers.get(id);
  const metrics = vaultMetrics.get(id);
  const params = vaultGovernedParams.get(id);
  const brand = metrics?.retainedCollateral?.brand;
  const price = brand && prices.get(brand);

  const error = vaultLoadingErrors.get(id) || (brand && priceErrors.get(brand));

  const isReady = manager && metrics && params && price && error === undefined;

  return (
    <button
      className="bg-purple-500 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded"
      disabled={!isReady}
    >
      Borrow 10 IST
    </button>
  );
};

export default NewVault;
