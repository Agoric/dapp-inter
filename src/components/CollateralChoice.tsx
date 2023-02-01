import { useAtom, useAtomValue } from 'jotai';
import { displayFunctionsAtom } from 'store/app';
import { useVaultStore } from 'store/vaults';
import { AmountMath } from '@agoric/ertp';
import { selectedCollateralIdAtom } from 'store/createVault';
import clsx from 'clsx';
import { useEffect } from 'react';

type TableTowParams = { left: string; right: string };

const TableRow = ({ left, right }: TableTowParams) => {
  return (
    <tr className="h-7 text-sm">
      <td className="text-left text-[#A3A5B9] pr-2">{left}</td>
      <td className="text-right font-extrabold">{right}</td>
    </tr>
  );
};

type CollateralChoiceParams = { id: string };

const CollateralChoice = ({ id }: CollateralChoiceParams) => {
  const [selectedCollateralId, setSelectedCollateralId] = useAtom(
    selectedCollateralIdAtom,
  );

  const {
    vaultManagerIds,
    vaultGovernedParams,
    vaultManagerLoadingErrors,
    vaultManagers,
    vaultMetrics,
    prices,
    priceErrors,
    vaultFactoryParams,
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
  const displayFunctions = useAtomValue(displayFunctionsAtom);
  const isReady = manager && metrics && params && price && vaultFactoryParams;
  const shouldShowError = error || !displayFunctions;

  useEffect(() => {
    // Auto-select if only vault manager after loading.
    if (!shouldShowError && isReady && vaultManagerIds?.length === 1) {
      setSelectedCollateralId(id);
    }
  }, [
    id,
    isReady,
    setSelectedCollateralId,
    shouldShowError,
    vaultManagerIds?.length,
  ]);

  if (shouldShowError) {
    return (
      <div>
        <>
          <h3>Vault ID: {id}</h3>
          {error && <p>Error: {error.toString()}</p>}
          {!displayFunctions && <p>Error: unable to display asset</p>}
        </>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="w-fit p-4 pt-2 border border-solid border-black">
        Loading...
      </div>
    );
  }
  const {
    displayAmount,
    displayBrandPetname,
    displayPercent,
    displayBrandIcon,
  } = displayFunctions;

  const istAvailable = AmountMath.subtract(params.debtLimit, metrics.totalDebt);

  const logoSrc = displayBrandIcon(metrics.totalCollateral.brand);

  // TODO: Come up with a naming scheme after rc0
  // https://github.com/Agoric/agoric-sdk/issues/6518
  const collateralTitle = 'ATOM';

  const isSelected = selectedCollateralId === id;

  return (
    <button
      onClick={() => setSelectedCollateralId(id)}
      className={clsx(
        'w-fit px-6 pt-2 pb-4 bg-white rounded-[10.7px] cursor-pointer',
        'shadow-[0_25px_35.6px_0_rgba(116,116,116,0.25)] box-border',
        'outline-2 outline-offset-2 border-2',
        isSelected ? 'border-[#00B1A6]' : 'border-transparent',
      )}
    >
      <img
        className="mx-auto my-2"
        height="48"
        width="48"
        src={logoSrc}
        alt={displayBrandPetname(metrics.totalCollateral.brand)}
      ></img>
      <h3 className="text-center text-xl font-medium font-serif">
        {collateralTitle}
      </h3>
      <table className="mt-4">
        <tbody>
          <TableRow left="Min. Collat. Ratio" right={`-- %`} />
          <TableRow
            left="Interest Rate"
            right={`${displayPercent(params.interestRate, 2)}%`}
          />
          <TableRow
            left="IST Available"
            right={`${displayAmount(istAvailable)} ${displayBrandPetname(
              params.debtLimit.brand,
            )}`}
          />
          <TableRow
            left="Liquidation Ratio"
            right={`${displayPercent(params.liquidationMargin, 2)}%`}
          />
        </tbody>
      </table>
    </button>
  );
};

export default CollateralChoice;
