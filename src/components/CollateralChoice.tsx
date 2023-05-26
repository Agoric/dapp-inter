import { useAtom } from 'jotai';
import { useVaultStore } from 'store/vaults';
import { selectedCollateralIdAtom } from 'store/createVault';
import clsx from 'clsx';
import { useEffect } from 'react';
import type { DisplayFunctions } from 'store/app';
import { istAvailable } from 'utils/vaultMath';

type TableTowParams = { left: string; right: string };

const TableRow = ({ left, right }: TableTowParams) => {
  return (
    <tr className="h-7 text-sm">
      <td className="text-left text-secondary pr-2">{left}</td>
      <td className="text-right font-extrabold">{right}</td>
    </tr>
  );
};

const cardClasses = clsx(
  'w-fit px-6 pt-2 pb-4 bg-white rounded-10',
  'shadow-card box-border',
  'outline-2 outline-offset-2 border-2',
);

export const SkeletonCollateralChoice = () => {
  return (
    <div className={clsx(cardClasses, 'border-transparent')}>
      <div className="bg-gray-100 h-12 w-12 rounded-full animate-pulse my-2 mx-auto"></div>
      <div className="bg-gray-100 h-7 w-20 rounded-lg animate-pulse my-5 mx-auto"></div>
      <div className="mt-4">
        <div className="bg-gray-100 h-4 w-48 rounded-md animate-pulse my-2"></div>
        <div className="bg-gray-100 h-4 w-48 rounded-md animate-pulse my-2"></div>
        <div className="bg-gray-100 h-4 w-48 rounded-md animate-pulse my-2"></div>
        <div className="bg-gray-100 h-4 w-48 rounded-md animate-pulse my-2"></div>
      </div>
    </div>
  );
};

type CollateralChoiceParams = {
  id: string;
  displayFunctions: DisplayFunctions;
};

const CollateralChoice = ({ id, displayFunctions }: CollateralChoiceParams) => {
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
  const isReady = manager && metrics && params && price && vaultFactoryParams;
  const shouldShowError = error;

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
      <div
        className={clsx(
          cardClasses,
          'h-[248px] w-60 border-transparent text-lg text-alert pt-3',
        )}
      >
        <p>Error: {error && error.toString()}</p>
      </div>
    );
  }

  if (!isReady) {
    return <SkeletonCollateralChoice />;
  }
  const {
    displayAmount,
    displayBrandPetname,
    displayPercent,
    displayBrandIcon,
  } = displayFunctions;

  const mintedAvailable = istAvailable(params.debtLimit, metrics.totalDebt);

  const logoSrc = displayBrandIcon(metrics.totalCollateral.brand);

  // TODO: Come up with a naming scheme after rc0
  // https://github.com/Agoric/agoric-sdk/issues/6518
  const collateralTitle = 'ATOM';

  const isSelected = selectedCollateralId === id;

  const onClick = () => {
    if (isSelected) {
      setSelectedCollateralId(null);
    } else {
      setSelectedCollateralId(id);
    }
  };

  // This for all intents and purposes has the role of a button, even though
  // its conntent doesn't fit the content categories of a button:
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#technical_summary
  //
  // Perhaps the cards that you click to select are an a11y anti-pattern, could
  // be something to revisit.
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-fit px-6 pt-2 pb-4 bg-white rounded-10 cursor-pointer',
        'shadow-card box-border',
        'outline-2 outline-offset-2 border-2 hover:scale-105 transition',
        isSelected ? 'border-interGreen' : 'border-transparent',
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
          <TableRow
            left="Min. Collat. Ratio"
            right={`${displayPercent(
              params.inferredMinimumCollateralization,
              0,
            )}%`}
          />
          <TableRow
            left="Stability Fee"
            right={`${displayPercent(params.interestRate, 2)}%`}
          />
          <TableRow
            left="IST Available"
            right={`${displayAmount(
              mintedAvailable,
              0,
              'locale',
            )} ${displayBrandPetname(params.debtLimit.brand)}`}
          />
          <TableRow
            left="Liquidation Ratio"
            right={`${displayPercent(params.liquidationMargin, 0)}%`}
          />
        </tbody>
      </table>
    </button>
  );
};

export default CollateralChoice;
