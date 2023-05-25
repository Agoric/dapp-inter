export const AdjustVaultInstructions = () => (
  <div className="bg-white shadow-[0_22px_34px_rgba(116,116,116,0.25)] rounded-[10px] px-7 py-4">
    <h3 className="font-bold font-serif">Instructions</h3>
    <ol className="list-decimal text-[#A3A5B9] text-sm mx-4 my-3 [&>li]:mt-1">
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
