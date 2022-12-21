import { useAtomValue } from 'jotai';
import { displayFunctionsAtom } from 'store/app';
import { useVaultStore } from 'store/vaults';

const CollateralChoice = ({ id }: { id: string }) => {
  const { displayAmount, displayPercent, displayBrandPetname } =
    useAtomValue(displayFunctionsAtom);

  const {
    vaultGovernedParams,
    vaultLoadingErrors,
    vaultManagers,
    vaultMetrics,
  } = useVaultStore();

  const error = vaultLoadingErrors.get(id);
  if (error) {
    return (
      <div>
        <h3>Vault ID: {id}</h3>
        <p>Error: {error.toString()}</p>
      </div>
    );
  }

  const manager = vaultManagers.get(id);
  const metrics = vaultMetrics.get(id);
  const params = vaultGovernedParams.get(id);
  const isLoading = !(manager && metrics && params);
  const content = isLoading ? (
    <div>Loading...</div>
  ) : (
    <>
      <p>
        Debt limit: {displayAmount(params.DebtLimit.value)}{' '}
        {displayBrandPetname(params.DebtLimit.value.brand)}
      </p>
      <p>Interest rate: {displayPercent(params.InterestRate.value, 2)}%</p>
      <p>Compounded interest: {displayPercent(manager.compoundedInterest)}%</p>
      <p>
        Latest interest update:{' '}
        {new Date(Number(manager.latestInterestUpdate) * 1000).toUTCString()}
      </p>
      <p>
        Liquidation margin: {displayPercent(params.LiquidationMargin.value, 2)}%
      </p>
      <p>
        Liquidation penalty:{' '}
        {displayPercent(params.LiquidationPenalty.value, 2)}%
      </p>
      <p>Loan fee: {displayPercent(params.LoanFee.value, 2)}%</p>
      <p>Number of active vaults: {metrics.numActiveVaults}</p>
      <p>Number of liquidating vaults: {metrics.numLiquidatingVaults}</p>
      <p>
        Number of liquidations completed: {metrics.numLiquidationsCompleted}
      </p>
      <p>
        Retained collateral: {displayAmount(metrics.retainedCollateral)}{' '}
        {displayBrandPetname(metrics.retainedCollateral.brand)}
      </p>
      <p>
        Total collateral: {displayAmount(metrics.totalCollateral)}{' '}
        {displayBrandPetname(metrics.totalCollateral.brand)}
      </p>
      <p>
        Total debt: {displayAmount(metrics.totalDebt)}{' '}
        {displayBrandPetname(metrics.totalDebt.brand)}
      </p>
      <p>
        Total overage received: {displayAmount(metrics.totalOverageReceived)}{' '}
        {displayBrandPetname(metrics.totalOverageReceived.brand)}
      </p>
      <p>
        Total proceeds received: {displayAmount(metrics.totalProceedsReceived)}{' '}
        {displayBrandPetname(metrics.totalProceedsReceived.brand)}
      </p>
      <p>
        Total shortfall received:{' '}
        {displayAmount(metrics.totalShortfallReceived)}{' '}
        {displayBrandPetname(metrics.totalShortfallReceived.brand)}
      </p>
    </>
  );

  return (
    <div className="w-fit p-4 pt-2 border border-solid border-black">
      <h3 className="font-semibold mb-1">Vault Manager ID: {id}</h3>
      {content}
    </div>
  );
};

export default CollateralChoice;
