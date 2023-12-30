import { type WalletClient } from '@leapwallet/elements';
import { useMemo } from 'react';
import { getKeplr } from './getKeplr';
import { fromBase64 } from '@cosmjs/encoding';
import type { StdSignDoc, SignDoc } from '@keplr-wallet/types';

type ElementsWalletClient = WalletClient & {
  connect: (chainId?: string) => Promise<void>;
};

// See https://docs.leapwallet.io/cosmos/elements/wallet-client-setup.
//
// This just uses the Keplr APIs described in
// https://docs.keplr.app/api/#keplr-specific-features, rather than CosmJS, so
// so that Keplr handles all the account types, RPCs, and assets for us.
//
// XXX: Find a way to get https://www.npmjs.com/package/@cosmos-kit/react
// working with endo to support more wallets and non-keplr-supported chains.
export const useElementsWalletClient = (): ElementsWalletClient => {
  // @ts-expect-error Some unimpactful mismatch between the 'Long' types in
  // Keplr's SignDoc and the one used by leap elements.
  const walletClient: ElementsWalletClient = useMemo(() => {
    const enable = async (chainIds: string | string[]) => {
      const keplr = await getKeplr();
      assert(keplr, 'keplr not installed');
      return keplr.enable(chainIds);
    };

    return {
      connect: async (chainId?: string) => {
        return enable(chainId ?? []);
      },
      enable,
      getAccount: async (chainId: string) => {
        const keplr = await getKeplr();
        assert(keplr, 'keplr not installed');
        const key = await keplr.getKey(chainId);

        return {
          bech32Address: key.bech32Address,
          pubKey: key.pubKey,
          isNanoLedger: key.isNanoLedger ?? false,
        };
      },
      getSigner: async (chainId: string) => {
        const keplr = await getKeplr();
        assert(keplr, 'keplr not installed');
        const signer = await keplr.getOfflineSigner(chainId);

        return {
          signDirect: async (signerAddress: string, signDoc: SignDoc) => {
            const { signature, signed } = await signer.signDirect(
              signerAddress,
              signDoc,
            );
            return {
              signature: fromBase64(signature.signature),
              signed,
            };
          },
          signAmino: async (address: string, signDoc: StdSignDoc) => {
            const { signature, signed } = await signer.signAmino(
              address,
              signDoc,
            );
            return {
              signature: fromBase64(signature.signature),
              signed,
            };
          },
        };
      },
    };
  }, []);

  return walletClient;
};
