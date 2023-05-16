import 'ses'; // adds harden
import { expect, it, describe } from 'vitest';
import {
  computeToLock,
  debtAfterChange,
  istAvailable,
  lockedAfterChange,
  maxIstToMintFromVault,
} from '../../src/utils/vaultMath';
import { CollateralAction, DebtAction } from '../../src/store/adjustVault';
import { makeRatioFromAmounts } from '@agoric/zoe/src/contractSupport';
import { AmountMath } from '@agoric/ertp';
import { Far } from '@endo/marshal';

const mintedBrand = Far('minted brand', {});
const collateralBrand = Far('locked brand', {});

describe('computeToLock', () => {
  it('should round up for the given collateral ratio', () => {
    const priceRate = makeRatioFromAmounts(
      AmountMath.make(mintedBrand, 7_100_000n),
      AmountMath.make(collateralBrand, 10_000n),
    );

    const collateralizationRatio = makeRatioFromAmounts(
      AmountMath.make(mintedBrand, 150n),
      AmountMath.make(mintedBrand, 100n),
    );

    const toReceive = 5_000_000n;

    const mintFee = makeRatioFromAmounts(
      AmountMath.make(mintedBrand, 1n),
      AmountMath.make(mintedBrand, 100n),
    );

    expect(
      computeToLock(
        priceRate,
        collateralizationRatio,
        toReceive,
        collateralizationRatio,
        mintFee,
        'ceil',
      ),
    ).toEqual(10670n);
  });

  it('should use the locked price if lower', () => {
    const priceRate = makeRatioFromAmounts(
      AmountMath.make(mintedBrand, 8_100_000n),
      AmountMath.make(collateralBrand, 10_000n),
    );

    const lockedPrice = makeRatioFromAmounts(
      AmountMath.make(mintedBrand, 7_100_000n),
      AmountMath.make(collateralBrand, 10_000n),
    );

    const collateralizationRatio = makeRatioFromAmounts(
      AmountMath.make(mintedBrand, 150n),
      AmountMath.make(mintedBrand, 100n),
    );

    const toReceive = 5_000_000n;

    const mintFee = makeRatioFromAmounts(
      AmountMath.make(mintedBrand, 1n),
      AmountMath.make(mintedBrand, 100n),
    );

    expect(
      computeToLock(
        priceRate,
        collateralizationRatio,
        toReceive,
        collateralizationRatio,
        mintFee,
        'ceil',
        lockedPrice,
      ),
    ).toEqual(10670n);
  });
});

describe('debtAfterDelta', () => {
  it('should handle no changes', () => {
    const totalDebt = AmountMath.make(mintedBrand, 1n);
    const mintFee = makeRatioFromAmounts(
      AmountMath.makeEmpty(mintedBrand),
      AmountMath.make(mintedBrand, 1n),
    );

    expect(
      debtAfterChange(
        DebtAction.None,
        mintFee,
        totalDebt,
        AmountMath.make(mintedBrand, 1n),
      ),
    ).toEqual(totalDebt);

    expect(debtAfterChange(DebtAction.Mint, mintFee, totalDebt, null)).toEqual(
      totalDebt,
    );

    expect(
      debtAfterChange(
        DebtAction.Mint,
        mintFee,
        totalDebt,
        AmountMath.makeEmpty(mintedBrand),
      ),
    ).toEqual(totalDebt);
  });

  it('should handle minting with a loan fee', () => {
    const totalDebt = AmountMath.make(mintedBrand, 100n);
    const mintFee = makeRatioFromAmounts(
      AmountMath.make(mintedBrand, 20n),
      AmountMath.make(mintedBrand, 1000n),
    );

    expect(
      debtAfterChange(
        DebtAction.Mint,
        mintFee,
        totalDebt,
        AmountMath.make(mintedBrand, 100n),
      ),
    ).toEqual(AmountMath.make(mintedBrand, 202n));
  });

  it('should handle minting without a loan fee', () => {
    const totalDebt = AmountMath.make(mintedBrand, 100n);
    const mintFee = makeRatioFromAmounts(
      AmountMath.make(mintedBrand, 0n),
      AmountMath.make(mintedBrand, 1000n),
    );

    expect(
      debtAfterChange(
        DebtAction.Mint,
        mintFee,
        totalDebt,
        AmountMath.make(mintedBrand, 100n),
      ),
    ).toEqual(AmountMath.make(mintedBrand, 200n));
  });

  it('should handle repaying', () => {
    const totalDebt = AmountMath.make(mintedBrand, 100n);
    const mintFee = makeRatioFromAmounts(
      AmountMath.make(mintedBrand, 20n),
      AmountMath.make(mintedBrand, 1000n),
    );

    expect(
      debtAfterChange(
        DebtAction.Repay,
        mintFee,
        totalDebt,
        AmountMath.make(totalDebt.brand, 50n),
      ),
    ).toEqual(AmountMath.make(mintedBrand, 50n));
  });

  it('should handle repaying below zero', () => {
    const totalDebt = AmountMath.make(mintedBrand, 100n);
    const mintFee = makeRatioFromAmounts(
      AmountMath.make(mintedBrand, 20n),
      AmountMath.make(mintedBrand, 1000n),
    );

    expect(
      debtAfterChange(
        DebtAction.Repay,
        mintFee,
        totalDebt,
        AmountMath.make(mintedBrand, 200n),
      ),
    ).toEqual(AmountMath.makeEmpty(mintedBrand));
  });
});

describe('lockedAfterDelta', () => {
  it('should handle no changes', () => {
    const totalLocked = AmountMath.make(collateralBrand, 100n);

    expect(
      lockedAfterChange(
        CollateralAction.None,
        totalLocked,
        AmountMath.make(collateralBrand, 1n),
      ),
    ).toEqual(totalLocked);

    expect(
      lockedAfterChange(CollateralAction.Deposit, totalLocked, null),
    ).toEqual(totalLocked);

    expect(
      lockedAfterChange(
        CollateralAction.Deposit,
        totalLocked,
        AmountMath.makeEmpty(collateralBrand),
      ),
    ).toEqual(totalLocked);
  });

  it('should handle depositing', () => {
    const totalLocked = AmountMath.make(collateralBrand, 100n);

    expect(
      lockedAfterChange(
        CollateralAction.Deposit,
        totalLocked,
        AmountMath.make(collateralBrand, 100n),
      ),
    ).toEqual(AmountMath.make(collateralBrand, 200n));
  });

  it('should handle withdrawing', () => {
    const totalLocked = AmountMath.make(collateralBrand, 100n);

    expect(
      lockedAfterChange(
        CollateralAction.Withdraw,
        totalLocked,
        AmountMath.make(collateralBrand, 50n),
      ),
    ).toEqual(AmountMath.make(collateralBrand, 50n));
  });

  it('should handle withdrawing below zero', () => {
    const totalLocked = AmountMath.make(collateralBrand, 100n);

    expect(
      lockedAfterChange(
        CollateralAction.Withdraw,
        totalLocked,
        AmountMath.make(collateralBrand, 200n),
      ),
    ).toEqual(AmountMath.makeEmpty(collateralBrand));
  });
});

describe('istAvailable', () => {
  it('should give the difference between the debt limit and total debt', () => {
    expect(
      istAvailable(
        AmountMath.make(mintedBrand, 100n),
        AmountMath.make(mintedBrand, 60n),
      ),
    ).toEqual(AmountMath.make(mintedBrand, 40n));
  });

  it('should round up to zero if debt exceeds limit', () => {
    expect(
      istAvailable(
        AmountMath.make(mintedBrand, 100n),
        AmountMath.make(mintedBrand, 101n),
      ),
    ).toEqual(AmountMath.makeEmpty(mintedBrand));
  });
});

describe('maxIstToMintFromVault', () => {
  it('should prevent the user from exceeding the mint limit', () => {
    // Effective limit on new debt is 99n.
    const [debtLimit, totalDebt] = [
      AmountMath.make(mintedBrand, 200n),
      AmountMath.make(mintedBrand, 101n),
    ];

    // Vault already has 40n debt.
    const currentDebt = AmountMath.make(mintedBrand, 40n);

    // Vault has ample collateral.
    const currentLocked = AmountMath.make(collateralBrand, 1000000n);

    // Loan fee is 10%.
    const mintFee = makeRatioFromAmounts(
      AmountMath.make(mintedBrand, 10n),
      AmountMath.make(mintedBrand, 100n),
    );

    // Price: 10 Collateral = 1 Minted
    const priceRate = {
      amountIn: AmountMath.make(collateralBrand, 1000n),
      amountOut: AmountMath.make(mintedBrand, 100n),
    };

    // 150%
    const minCollateralization = makeRatioFromAmounts(
      AmountMath.make(mintedBrand, 150n),
      AmountMath.make(mintedBrand, 100n),
    );

    expect(
      maxIstToMintFromVault(
        debtLimit,
        totalDebt,
        currentDebt,
        mintFee,
        currentLocked,
        priceRate,
        minCollateralization,
      ),
    ).toEqual(90n); // After loan fee becomes 99n.
  });

  it('should prevent the user from going below min collateralization', () => {
    // Effective limit on new debt is 100n.
    const [debtLimit, totalDebt] = [
      AmountMath.make(mintedBrand, 200n),
      AmountMath.make(mintedBrand, 100n),
    ];

    // Vault already has 80n debt.
    const currentDebt = AmountMath.make(mintedBrand, 80n);

    // Loan fee is 10%.
    const mintFee = makeRatioFromAmounts(
      AmountMath.make(mintedBrand, 10n),
      AmountMath.make(mintedBrand, 100n),
    );

    // Price: 10 Collateral = 1 Minted
    const priceRate = {
      amountIn: AmountMath.make(collateralBrand, 1000n),
      amountOut: AmountMath.make(mintedBrand, 100n),
    };

    // Vault has has 250% colllateralization ratio:
    // 2000n / 10 = 200n collateral value (in minted).
    // 200n / 80n = 2.5:1 collateral value:minted value
    const currentLocked = AmountMath.make(collateralBrand, 2000n);

    // 150%
    const minCollateralization = makeRatioFromAmounts(
      AmountMath.make(mintedBrand, 150n),
      AmountMath.make(mintedBrand, 100n),
    );

    const expectedValue = 48n;

    expect(
      maxIstToMintFromVault(
        debtLimit,
        totalDebt,
        currentDebt,
        mintFee,
        currentLocked,
        priceRate,
        minCollateralization,
      ),
    ).toEqual(expectedValue);
  });

  it('should use the lowest between quote price and next auction start price', () => {
    // Effective limit on new debt is 900n.
    const [debtLimit, totalDebt] = [
      AmountMath.make(mintedBrand, 1000n),
      AmountMath.make(mintedBrand, 100n),
    ];

    // Vault already has 80n debt.
    const currentDebt = AmountMath.make(mintedBrand, 80n);

    // Loan fee is 10%.
    const mintFee = makeRatioFromAmounts(
      AmountMath.make(mintedBrand, 10n),
      AmountMath.make(mintedBrand, 100n),
    );

    // Price: 5 Collateral = 1 Minted
    const priceRate = harden({
      amountIn: AmountMath.make(collateralBrand, 500n),
      amountOut: AmountMath.make(mintedBrand, 100n),
    });

    // Next Start Price: 11 Collateral = 1 Minted (Lower than quote price)
    const lockedPrice = harden({
      denominator: AmountMath.make(collateralBrand, 1100n),
      numerator: AmountMath.make(mintedBrand, 100n),
    });

    const currentLocked = AmountMath.make(collateralBrand, 2000n);

    // 150%
    const minCollateralization = makeRatioFromAmounts(
      AmountMath.make(mintedBrand, 150n),
      AmountMath.make(mintedBrand, 100n),
    );

    const expectedValue = 36n;

    expect(
      maxIstToMintFromVault(
        debtLimit,
        totalDebt,
        currentDebt,
        mintFee,
        currentLocked,
        priceRate,
        minCollateralization,
        lockedPrice,
      ),
    ).toEqual(expectedValue);
  });
});
