import { LiquidityModal, Tabs } from '@leapwallet/elements';
import { useAtomValue } from 'jotai';
import { chainConnectionAtom, displayFunctionsAtom } from 'store/app';
import { useElementsWalletClient } from './walletClient';
import WalletIcon from 'svg/wallet';
import type { Brand } from '@agoric/ertp/src/types';
import { AssetSelector } from '@leapwallet/elements';

import '@leapwallet/elements/styles.css';

type Props = {
  selectedAsset: Brand | null;
};

const agoricChainId = 'agoric-3';

const chainIdForCollateralPetname = (petname?: string) => {
  switch (petname) {
    case 'stATOM':
      return 'stride-1';
    case 'stOSMO':
      return 'stride-1';
    case 'ATOM':
      return 'cosmoshub-4';
    default:
      return undefined;
  }
};

const assetForCollateralPetname = (petname?: string) => {
  switch (petname) {
    case 'stATOM':
      return ['symbol', 'stATOM'] as AssetSelector;
    case 'stOSMO':
      return ['symbol', 'stOSMO'] as AssetSelector;
    case 'ATOM':
      return ['symbol', 'ATOM'] as AssetSelector;
    default:
      return undefined;
  }
};

const LeapLiquidityModal = ({ selectedAsset }: Props) => {
  const chainConnection = useAtomValue(chainConnectionAtom);
  const elementsWalletClient = useElementsWalletClient();

  const { displayBrandPetname, displayBrandIcon } =
    useAtomValue(displayFunctionsAtom) ?? {};

  const collateralPetname =
    (selectedAsset ?? undefined) &&
    displayBrandPetname &&
    displayBrandPetname(selectedAsset);

  const buttonMsg = `Deposit ${collateralPetname ?? 'Funds'}`;

  const renderLiquidityButton = ({ onClick }: { onClick: () => void }) => {
    return (
      <button
        className="font-sans flex items-center gap-2 border-2 border-solid border-interGreen fill-interGreen text-interGreen rounded-md px-3 py-2 uppercase text-xs font-semibold bg-emerald-400 bg-opacity-0 hover:bg-opacity-10 active:bg-opacity-20 transition disabled:cursor-not-allowed"
        onClick={onClick}
      >
        <WalletIcon />
        {buttonMsg}
      </button>
    );
  };

  return (
    <div>
      <LiquidityModal
        renderLiquidityButton={renderLiquidityButton}
        theme="light"
        walletClientConfig={{
          userAddress: chainConnection?.address,
          walletClient: elementsWalletClient,
          connectWallet: (chainId?: string) => {
            return elementsWalletClient.connect(chainId);
          },
        }}
        defaultActiveTab={Tabs.TRANSFER}
        config={{
          icon:
            (displayBrandIcon && displayBrandIcon(selectedAsset)) ??
            './IST.png',
          title: buttonMsg,
          subtitle: '',
          tabsConfig: {
            [Tabs.BRIDGE_USDC]: {
              enabled: false,
            },
            [Tabs.FIAT_ON_RAMP]: {
              enabled: false,
            },
            [Tabs.CROSS_CHAIN_SWAPS]: {
              enabled: true,
              defaults: {
                destinationChainId:
                  chainIdForCollateralPetname(collateralPetname),
                destinationAssetSelector:
                  assetForCollateralPetname(collateralPetname),
              },
            },
            [Tabs.SWAP]: {
              enabled: true,
              defaults: {
                destinationChainId: agoricChainId,
                destinationAssetSelector:
                  assetForCollateralPetname(collateralPetname),
                sourceChainId: chainIdForCollateralPetname(collateralPetname),
              },
            },
            [Tabs.TRANSFER]: {
              enabled: true,
              defaults: {
                destinationChainId: agoricChainId,
                sourceAssetSelector:
                  assetForCollateralPetname(collateralPetname),
                sourceChainId: chainIdForCollateralPetname(collateralPetname),
              },
            },
          },
        }}
      />
    </div>
  );
};

export default LeapLiquidityModal;
