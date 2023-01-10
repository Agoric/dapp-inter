import { useAtomValue } from 'jotai';
import { makeOpenVaultOffer } from 'service/vaults';
import { offerSignerAtom, pursesAtom } from 'store/app';
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
    vaultFactoryParamsLoadingError,
  } = useVaultStore();
  const manager = vaultManagers.get(id);
  const metrics = vaultMetrics.get(id);
  const params = vaultGovernedParams.get(id);
  const brand = metrics?.retainedCollateral?.brand;
  const price = brand && prices.get(brand);

  const error =
    vaultLoadingErrors.get(id) ||
    (brand && priceErrors.get(brand)) ||
    vaultFactoryParamsLoadingError;

  const offerSigner = useAtomValue(offerSignerAtom);
  const isReady =
    manager &&
    metrics &&
    params &&
    price &&
    !error &&
    offerSigner.isDappApproved;

  const purses = useAtomValue(pursesAtom);
  const istPurse = purses?.find(p => p.brand === metrics?.totalDebt?.brand);
  const collateralPurse = purses?.find(
    p => p.brand === metrics?.retainedCollateral?.brand,
  );

  const IST_TO_BORROW = 5_000_000n; // 5 IST

  // TODO: Calculate these based on user inputs and actual prices and liquidation ratios.
  const proposeOffer = () => {
    makeOpenVaultOffer(
      collateralPurse?.pursePetname,
      10_000_000_000n,
      istPurse?.pursePetname,
      IST_TO_BORROW,
    );
  };

  return (
    <button
      className="disabled:bg-gray-300 disabled:cursor-not-allowed bg-purple-500 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded"
      disabled={!isReady}
      onClick={() => proposeOffer()}
    >
      Borrow 5 IST
    </button>
  );
};

export default NewVault;
