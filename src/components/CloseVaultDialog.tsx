import { signerTarget } from 'config';
import { useSetAtom, useAtomValue } from 'jotai';
import { useMemo, useState } from 'react';
import { makeCloseVaultOffer } from 'service/vaults';
import { displayFunctionsAtom, walletUiHrefAtom } from 'store/app';
import { ViewMode, viewModeAtom } from 'store/vaults';
import { motion } from 'framer-motion';
import BaseDialog from './BaseDialog';
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
  'Closing a vault is permanent and cannot be undone. To close your vault, please approve the offer in your wallet.';

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
  const { displayAmount, displayBrandPetname } = displayFunctions ?? {
    displayAmount: () => '',
    displayBrandPetname: () => '',
  };

  const walletUrl = useAtomValue(walletUiHrefAtom);
  const setViewMode = useSetAtom(viewModeAtom);
  const [hasSentOffer, setHasSentOffer] = useState(false);

  const goToWallet = () => {
    window.open(walletUrl, signerTarget);
  };

  const goToVaults = () => {
    onClose();
    setViewMode(ViewMode.Manage);
  };

  const closeVault = async () => {
    assert(vaultOfferId);
    await makeCloseVaultOffer(vaultOfferId, totalCollateral, totalDebt);
    setHasSentOffer(true);
  };

  const primaryAction = hasSentOffer ? goToWallet : closeVault;
  const primaryActionLabel = hasSentOffer ? 'Go to Wallet' : 'Close Out Vault';

  const secondaryAction = hasSentOffer ? goToVaults : onClose;
  const secondaryActionLabel = hasSentOffer ? 'Back to Vaults' : 'Cancel';

  const debtRow = useMemo(() => {
    if (!totalDebt) {
      return null;
    }

    const left = `${displayBrandPetname(totalDebt.brand)} Debt to Pay Back`;

    const right = `${displayAmount(
      totalDebt,
      2,
      'locale',
    )} ${displayBrandPetname(totalDebt.brand)}`;

    return <TableRow left={left} right={right} />;
  }, [displayAmount, displayBrandPetname, totalDebt]);

  const collateralRow = useMemo(() => {
    if (!totalCollateral) {
      return null;
    }

    const left = `${displayBrandPetname(
      totalCollateral.brand,
    )} Collateral to Receive`;

    const right = `${displayAmount(
      totalCollateral,
      2,
      'locale',
    )} ${displayBrandPetname(totalCollateral.brand)}`;

    return <TableRow left={left} right={right} />;
  }, [displayAmount, displayBrandPetname, totalCollateral]);

  const body = (
    <>
      <p>{message}</p>
      <table className="mx-auto my-10 font-sans">
        <tbody>
          {debtRow}
          {collateralRow}
        </tbody>
      </table>
      {hasSentOffer && (
        <motion.div
          {...noticeProps}
          className="overflow-hidden text-interOrange"
        >
          Offer sent to Agoric Smart Wallet for approval.
        </motion.div>
      )}
    </>
  );

  return (
    <BaseDialog
      title="Are you sure you want to close your vault?"
      body={body}
      isOpen={isOpen}
      onClose={onClose}
      onPrimaryAction={primaryAction}
      onSecondaryAction={secondaryAction}
      primaryActionLabel={primaryActionLabel}
      secondaryActionLabel={secondaryActionLabel}
    />
  );
};

export default CloseVaultDialog;
