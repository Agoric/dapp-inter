import { AmountMath } from '@agoric/ertp';
import { useAtomValue } from 'jotai';
import { makeOpenVaultOffer } from 'service/vaults';
import { offerSignerAtom, pursesAtom } from 'store/app';
import { useVaultStore } from 'store/vaults';

type Props = { id: string };

const NewVault = ({ id }: Props) => {
  const {
    vaultGovernedParams,
    vaultManagerLoadingErrors,
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
    vaultManagerLoadingErrors.get(id) ||
    (brand && priceErrors.get(brand)) ||
    vaultFactoryParamsLoadingError;

  const purses = useAtomValue(pursesAtom);
  const istPurse = purses?.find(p => p.brand === metrics?.totalDebt?.brand);
  const collateralPurse = purses?.find(
    p => p.brand === metrics?.retainedCollateral?.brand,
  );

  const offerSigner = useAtomValue(offerSignerAtom);
  const isReady =
    manager &&
    metrics &&
    params &&
    price &&
    istPurse &&
    collateralPurse &&
    !error &&
    offerSigner.isDappApproved;

  // XXX: Calculate these based on user inputs and actual prices and liquidation ratios.
  const IST_TO_MINT = 5_000_000n; // 5 IST
  const COLLATERAL_TO_LOCK = 10_000_000_000n; // 1 million IbcATOM
  const proposeOffer = () => {
    assert(isReady);
    makeOpenVaultOffer(
      AmountMath.make(collateralPurse.brand, COLLATERAL_TO_LOCK),
      AmountMath.make(istPurse.brand, IST_TO_MINT),
    );
  };

  return (
    <button
      className="disabled:bg-gray-300 disabled:cursor-not-allowed bg-purple-500 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded"
      disabled={!isReady}
      onClick={() => proposeOffer()}
    >
      Mint 5 IST
    </button>
  );
};

export default NewVault;
