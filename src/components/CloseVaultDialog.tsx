import { useSetAtom, useAtomValue } from 'jotai';
import { useMemo, useState } from 'react';
import { makeCloseVaultOffer } from 'service/vaults';
import { displayFunctionsAtom } from 'store/app';
import { ViewMode, viewModeAtom } from 'store/vaults';
import { motion } from 'framer-motion';
import ActionsDialog from './ActionsDialog';
import type { Amount } from '@agoric/ertp/src/types';

type TableRowProps = {
  left: string;
  right: string;
};

const TableRow = ({ left, right }: TableRowProps) => (
  <tr className="leading-7">
    <td className="text-left pr-8">{left}</td>
    <td className="text-right font-black">{right}</td>
  </tr>
);

type Props = {
  isOpen: boolean;
  onClose: () => void;
  vaultOfferId?: string;
  totalCollateral?: Amount<'nat'>;
  totalDebt?: Amount<'nat'>;
};

const noticeProps = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  transition: { type: 'tween' },
};

const message =
  'Closing a vault is permanent and cannot be undone. To close your vault, approve the offer in your wallet.';

const CloseVaultDialog = ({
  isOpen,
  onClose,
  vaultOfferId,
  totalCollateral,
  totalDebt,
}: Props) => {
  if (isOpen) {
    assert(vaultOfferId, 'Need a vault to close');
  }

  const displayFunctions = useAtomValue(displayFunctionsAtom);
  const setViewMode = useSetAtom(viewModeAtom);
  const [hasOfferSatisfied, setHasOfferSatisfied] = useState(false);

  const goToVaults = () => {
    onClose();
    setViewMode(ViewMode.Manage);
  };

  const closeVault = () => {
    assert(vaultOfferId);
    makeCloseVaultOffer(vaultOfferId, totalCollateral, totalDebt, () => {
      setHasOfferSatisfied(true);
      goToVaults();
    });
  };

  const primaryAction = closeVault;
  const primaryActionLabel = 'Close Out Vault';
  const secondaryAction = hasOfferSatisfied ? goToVaults : onClose;
  const secondaryActionLabel = hasOfferSatisfied ? 'Back to Vaults' : 'Cancel';

  const debtRow = useMemo(() => {
    if (!totalDebt || !displayFunctions) {
      return null;
    }
    const { displayAmount, displayBrandPetname } = displayFunctions;

    const left = `${displayBrandPetname(totalDebt.brand)} Debt to Pay Back`;

    const right = `${displayAmount(
      totalDebt,
      2,
      'locale',
    )} ${displayBrandPetname(totalDebt.brand)}`;

    return <TableRow left={left} right={right} />;
  }, [displayFunctions, totalDebt]);

  const collateralRow = useMemo(() => {
    if (!totalCollateral || !displayFunctions) {
      return null;
    }

    const { displayAmount, displayBrandPetname } = displayFunctions;

    const left = `${displayBrandPetname(
      totalCollateral.brand,
    )} Collateral to Receive`;

    const right = `${displayAmount(
      totalCollateral,
      2,
      'locale',
    )} ${displayBrandPetname(totalCollateral.brand)}`;

    return <TableRow left={left} right={right} />;
  }, [displayFunctions, totalCollateral]);

  const body = (
    <>
      <p>{message}</p>
      <table className="mx-auto my-10 font-sans">
        <tbody>
          {debtRow}
          {collateralRow}
        </tbody>
      </table>
      {hasOfferSatisfied && (
        <motion.div
          {...noticeProps}
          className="overflow-hidden text-interOrange"
        >
          Vault has been closed successfully.
        </motion.div>
      )}
    </>
  );

  return (
    <ActionsDialog
      title="Are you sure you want to close your vault?"
      body={body}
      isOpen={isOpen}
      onClose={onClose}
      primaryAction={{ action: primaryAction, label: primaryActionLabel }}
      secondaryAction={{ action: secondaryAction, label: secondaryActionLabel }}
      primaryActionDisabled={hasOfferSatisfied}
    />
  );
};

export default CloseVaultDialog;
