import React, { useRef } from 'react';
import { BridgeProtocol } from '@agoric/web-components';
import { makeReactDappWalletBridge } from '@agoric/web-components/react';
import { Id, toast } from 'react-toastify';
import { useSetAtom, useAtomValue } from 'jotai';
import {
  offerSignerAtom,
  chainConnectionAtom,
  bridgeHrefAtom,
  walletUiHrefAtom,
  setIsDappApprovedAtom,
} from 'store/app';
import type { OfferConfig } from 'store/app';
import { signerTarget } from 'config';

// UNTIL https://github.com/Agoric/agoric-sdk/issues/6591
type BridgeReadyMessage = {
  detail: {
    data: {
      type: string;
    };
    isDappApproved: boolean;
    requestDappConnection: (petname: string) => void;
    addOffer: (offer: OfferConfig) => void;
  };
};

type BridgeMessage = {
  detail: {
    data: {
      type: string;
      isDappApproved: boolean;
    };
  };
};

type BridgeError = {
  detail: {
    type: string;
    e: Error;
  };
};

// Create a wrapper for dapp-wallet-bridge that is specific to
// the app's instance of React.
const DappWalletBridge = makeReactDappWalletBridge(React);

const WalletBridge = () => {
  const setIsDappApproved = useSetAtom(setIsDappApprovedAtom);
  const setOfferSigner = useSetAtom(offerSignerAtom);
  const chainConnection = useAtomValue(chainConnectionAtom);
  const warningToastId = useRef<Id | null>(null);
  const connectionSuccessfulToastId = useRef<Id | null>(null);
  const bridgeHref = useAtomValue(bridgeHrefAtom);
  const walletUiHref = useAtomValue(walletUiHrefAtom);

  const clearWarningToast = () =>
    warningToastId.current && toast.dismiss(warningToastId.current);

  const clearConnectionSuccessfulToast = () =>
    connectionSuccessfulToastId.current &&
    toast.dismiss(connectionSuccessfulToastId.current);

  const showWarningToast = () => {
    clearConnectionSuccessfulToast();
    warningToastId.current = toast.warning(
      <p>
        Dapp is in read-only mode. Enable the connection at{' '}
        <a
          className="underline text-blue-500"
          href={walletUiHref}
          target={signerTarget}
          rel="noreferrer"
        >
          {walletUiHref}
        </a>{' '}
        to perform swaps.
      </p>,
    );
  };

  const showConnectionSuccessfulToast = () => {
    clearWarningToast();
    connectionSuccessfulToastId.current = toast.success(
      <p>
        Successfully connected to Agoric wallet at{' '}
        <a
          className="underline text-blue-500"
          href={walletUiHref}
          target={signerTarget}
          rel="noreferrer"
        >
          {walletUiHref}
        </a>
      </p>,
      { autoClose: 5000 },
    );
  };

  const onBridgeReady = (ev: BridgeReadyMessage) => {
    const {
      detail: { isDappApproved, requestDappConnection, addOffer },
    } = ev;
    setOfferSigner({ addOffer, isDappApproved });
    if (isDappApproved) {
      showConnectionSuccessfulToast();
    } else {
      requestDappConnection('Inter Protocol UI');
      showWarningToast();
    }
  };

  const onError = (ev: BridgeError) => {
    const message = ev.detail.e.message;
    toast.error(
      <div>
        <p>
          Could not connect to Agoric wallet at{' '}
          <a
            className="underline text-blue-500"
            href={walletUiHref}
            target={signerTarget}
            rel="noreferrer"
          >
            {walletUiHref}
          </a>
          {message && `: ${message}`}
        </p>
      </div>,
    );
  };

  const onBridgeMessage = (ev: BridgeMessage) => {
    const { data } = ev.detail;
    switch (data.type) {
      case BridgeProtocol.dappApprovalChanged:
        setIsDappApproved(data.isDappApproved);
        if (data.isDappApproved) {
          showConnectionSuccessfulToast();
        } else {
          showWarningToast();
        }
        break;
      default:
        console.warn('Unhandled bridge message', data);
    }
  };

  return (
    <div className="hidden">
      {chainConnection && (
        <DappWalletBridge
          bridgeHref={bridgeHref}
          onBridgeMessage={onBridgeMessage}
          onBridgeReady={onBridgeReady}
          onError={onError}
          address={chainConnection.address}
          chainId={chainConnection.chainId}
        />
      )}
    </div>
  );
};

export default WalletBridge;
