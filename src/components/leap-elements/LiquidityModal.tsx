import { LiquidityModal, Tabs } from '@leapwallet/elements';
import { useAtomValue } from 'jotai';
import { chainConnectionAtom, displayFunctionsAtom } from 'store/app';
import { useElementsWalletClient } from './walletClient';
import WalletIcon from 'svg/wallet';
import type { Brand } from '@agoric/ertp/src/types';
import { AssetSelector } from '@leapwallet/elements';

import '@leapwallet/elements/styles.css';

export enum Direction {
  deposit = 'DEPOSIT',
  withdraw = 'WITHDRAW',
}

type Props = {
  selectedAsset: Brand | null;
  direction: Direction;
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
    case 'stTIA':
      return 'stride-1';
    case 'stkATOM':
      // source: https://github.com/cosmos/chain-registry/blob/5a2352d22de715e0115fc64887944993bea8e123/persistence/chain.json#L4
      return 'core-1';
    case 'IST':
      return agoricChainId;
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
    case 'stTIA':
      return ['symbol', 'stTIA'] as AssetSelector;
    case 'stkATOM':
      return ['symbol', 'stkATOM'] as AssetSelector;
    case 'IST':
      return ['symbol', 'IST'] as AssetSelector;
    default:
      return undefined;
  }
};

const LeapLiquidityModal = ({ selectedAsset, direction }: Props) => {
  const chainConnection = useAtomValue(chainConnectionAtom);
  const elementsWalletClient = useElementsWalletClient();

  const { displayBrandPetname, displayBrandIcon } =
    useAtomValue(displayFunctionsAtom) ?? {};

  const collateralPetname =
    (selectedAsset ?? undefined) &&
    displayBrandPetname &&
    displayBrandPetname(selectedAsset);

  const buttonMsg = `${direction} ${collateralPetname ?? 'FUNDS'}`;

  const renderLiquidityButton = ({ onClick }: { onClick: () => void }) => {
    return (
      <button
        className="normal-case font-sans flex items-center gap-2 border-2 border-solid border-interGreen fill-interGreen text-interGreen rounded-md px-3 py-2 text-xs font-semibold bg-emerald-400 bg-opacity-0 hover:bg-opacity-10 active:bg-opacity-20 transition disabled:cursor-not-allowed"
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
        defaultActiveTab={
          collateralPetname === 'IST' ? Tabs.SWAP : Tabs.TRANSFER
        }
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
                destinationChainId:
                  direction === Direction.deposit
                    ? agoricChainId
                    : chainIdForCollateralPetname(collateralPetname),
                sourceAssetSelector:
                  assetForCollateralPetname(collateralPetname),
                sourceChainId:
                  direction === Direction.deposit
                    ? chainIdForCollateralPetname(collateralPetname)
                    : agoricChainId,
                destinationAssetSelector:
                  assetForCollateralPetname(collateralPetname),
              },
            },
            [Tabs.TRANSFER]: {
              enabled: true,
              defaults: {
                destinationChainId:
                  direction === Direction.deposit
                    ? agoricChainId
                    : chainIdForCollateralPetname(collateralPetname),
                sourceAssetSelector:
                  assetForCollateralPetname(collateralPetname),
                sourceChainId:
                  direction === Direction.deposit
                    ? chainIdForCollateralPetname(collateralPetname)
                    : agoricChainId,
              },
            },
          },
        }}
      />
    </div>
  );
};

export default LeapLiquidityModal;
