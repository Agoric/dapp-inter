import { expect, it, describe } from 'vitest';
import { debtAfterDelta, lockedAfterDelta } from '../../src/utils/vaultMath';
import { CollateralAction, DebtAction } from '../../src/store/adjustVault';
import { makeRatioFromAmounts } from '@agoric/zoe/src/contractSupport';
import { AmountMath } from '@agoric/ertp';
import { Far } from '@endo/marshal';

const mintedBrand = Far('minted brand', {});
const collateralBrand = Far('locked brand', {});

describe('debtAfterDelta', () => {
  it('should handle no changes', () => {
    const totalDebt = AmountMath.make(mintedBrand, 1n);
    const loanFee = makeRatioFromAmounts(
      AmountMath.makeEmpty(mintedBrand),
      AmountMath.make(mintedBrand, 1n),
    );

    expect(debtAfterDelta(DebtAction.None, loanFee, totalDebt, 1n)).toEqual(
      totalDebt,
    );

    expect(debtAfterDelta(DebtAction.Borrow, loanFee, totalDebt, null)).toEqual(
      totalDebt,
    );

    expect(debtAfterDelta(DebtAction.Borrow, loanFee, totalDebt, 0n)).toEqual(
      totalDebt,
    );
  });

  it('should handle borrowing with a loan fee', () => {
    const totalDebt = AmountMath.make(mintedBrand, 100n);
    const loanFee = makeRatioFromAmounts(
      AmountMath.make(mintedBrand, 20n),
      AmountMath.make(mintedBrand, 1000n),
    );

    expect(debtAfterDelta(DebtAction.Borrow, loanFee, totalDebt, 100n)).toEqual(
      AmountMath.make(mintedBrand, 202n),
    );
  });

  it('should handle borrowing without a loan fee', () => {
    const totalDebt = AmountMath.make(mintedBrand, 100n);
    const loanFee = makeRatioFromAmounts(
      AmountMath.make(mintedBrand, 0n),
      AmountMath.make(mintedBrand, 1000n),
    );

    expect(debtAfterDelta(DebtAction.Borrow, loanFee, totalDebt, 100n)).toEqual(
      AmountMath.make(mintedBrand, 200n),
    );
  });

  it('should handle repaying', () => {
    const totalDebt = AmountMath.make(mintedBrand, 100n);
    const loanFee = makeRatioFromAmounts(
      AmountMath.make(mintedBrand, 20n),
      AmountMath.make(mintedBrand, 1000n),
    );

    expect(debtAfterDelta(DebtAction.Repay, loanFee, totalDebt, 50n)).toEqual(
      AmountMath.make(mintedBrand, 50n),
    );
  });

  it('should handle repaying below zero', () => {
    const totalDebt = AmountMath.make(mintedBrand, 100n);
    const loanFee = makeRatioFromAmounts(
      AmountMath.make(mintedBrand, 20n),
      AmountMath.make(mintedBrand, 1000n),
    );

    expect(debtAfterDelta(DebtAction.Repay, loanFee, totalDebt, 200n)).toEqual(
      AmountMath.makeEmpty(mintedBrand),
    );
  });
});

describe('lockedAfterDelta', () => {
  it('should handle no changes', () => {
    const totalLocked = AmountMath.make(collateralBrand, 100n);

    expect(lockedAfterDelta(CollateralAction.None, totalLocked, 1n)).toEqual(
      totalLocked,
    );

    expect(
      lockedAfterDelta(CollateralAction.Deposit, totalLocked, null),
    ).toEqual(totalLocked);

    expect(lockedAfterDelta(CollateralAction.Deposit, totalLocked, 0n)).toEqual(
      totalLocked,
    );
  });

  it('should handle depositing', () => {
    const totalLocked = AmountMath.make(collateralBrand, 100n);

    expect(
      lockedAfterDelta(CollateralAction.Deposit, totalLocked, 100n),
    ).toEqual(AmountMath.make(collateralBrand, 200n));
  });

  it('should handle withdrawing', () => {
    const totalLocked = AmountMath.make(collateralBrand, 100n);

    expect(
      lockedAfterDelta(CollateralAction.Withdraw, totalLocked, 50n),
    ).toEqual(AmountMath.make(collateralBrand, 50n));
  });

  it('should handle withdrawing below zero', () => {
    const totalLocked = AmountMath.make(collateralBrand, 100n);

    expect(
      lockedAfterDelta(CollateralAction.Withdraw, totalLocked, 200n),
    ).toEqual(AmountMath.makeEmpty(collateralBrand));
  });
});
