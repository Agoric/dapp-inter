import { useEffect, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { currentTimeAtom, displayFunctionsAtom, pursesAtom } from 'store/app';
import type { Amount, Brand } from '@agoric/ertp/src/types';
import { LiquidationSchedule } from 'store/vaults';
import { queryTotalActiveVaults } from './rpc';

export const usePurseBalanceDisplay = (brand?: Brand<'nat'> | null) => {
  const purses = useAtomValue(pursesAtom);

  const { displayBrandPetname, displayAmount } =
    useAtomValue(displayFunctionsAtom) ?? {};

  return useMemo(() => {
    if (!(displayAmount && displayBrandPetname && brand)) {
      return '0.00';
    }
    const purse = purses?.find(p => p.brand === brand);
    if (!purse) {
      return '0.00 ' + displayBrandPetname(brand);
    }
    return `${displayAmount(
      purse.currentAmount as Amount<'nat'>,
      2,
      'locale',
    )} ${displayBrandPetname(brand)}`;
  }, [brand, displayAmount, displayBrandPetname, purses]);
};

export const usePurseForBrand = (brand?: Brand<'nat'> | null) => {
  const purses = useAtomValue(pursesAtom);

  return purses?.find(p => p.brand === brand);
};

export const useAuctionTimer = (schedule: LiquidationSchedule | null) => {
  const currentTime = useAtomValue(currentTimeAtom);

  const minutesUntilNextAuction =
    schedule?.nextStartTime &&
    Math.max(
      Math.floor((Number(schedule.nextStartTime.absValue) - currentTime) / 60),
      0,
    );

  const secondsUntilNextAuction =
    schedule?.nextStartTime &&
    Math.max(
      Math.floor((Number(schedule.nextStartTime.absValue) - currentTime) % 60),
      0,
    );

  return minutesUntilNextAuction !== undefined &&
    secondsUntilNextAuction !== undefined
    ? `in ${minutesUntilNextAuction}m ${secondsUntilNextAuction}s`
    : '';
};

/**
 * Polls the total number of active vaults if configured to use mainnet,
 * otherwise returns null.
 *
 * This fetches from subquery, rather than a vstorage query to a network node,
 * because the query is more complex. However, subquery only works on mainnet,
 * hence why it checks the network config. Also, data might lag by up to 15
 * minutes.
 */
export const useTotalActiveVaultsQuery = (networkConfigUrl: string) => {
  const pollPeriodMs = 60_000;
  const [numActiveVaults, setNumActiveVaults] = useState<number | null>(null);

  useEffect(() => {
    let pollTimeout: number | undefined = undefined;

    const pollNumActiveVaults = async () => {
      const res = await queryTotalActiveVaults();
      setNumActiveVaults(res);
      pollTimeout = window.setTimeout(pollNumActiveVaults, pollPeriodMs);
    };

    if (networkConfigUrl.includes('main.agoric.net')) {
      pollNumActiveVaults();
    }

    return () => {
      pollTimeout && clearTimeout(pollTimeout);
    };
  }, [networkConfigUrl]);

  return numActiveVaults;
};
