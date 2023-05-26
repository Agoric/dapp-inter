export const AdjustVaultInstructions = () => (
  <div className="bg-white shadow-card rounded-10 px-7 pt-4 pb-3">
    <h3 className="font-bold font-serif">Instructions</h3>
    <ol className="list-decimal text-secondary text-sm mx-4 my-3 [&>li]:mt-1">
      <li>
        Select at least one action from either dropdown (you can complete a debt
        action, collateral action or both in the same adjustment).
      </li>
      <li>
        Enter vault adjustment amount (click the &quot;Deposit...&quot; button
        if you need to IBC transfer additional funds).
      </li>
      <li>Review the Vault Adjustment Summary.</li>
      <li>Click the &quot;Adjust Vault&quot; button.</li>
      <li>Approve the offer in the Agoric Smart Wallet.</li>
    </ol>
  </div>
);
