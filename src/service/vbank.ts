import type { Marshal } from '@endo/marshal';
import { appStore } from 'store/app';
import { iterateLatest, makeFollower } from '@agoric/casting';
import type { DisplayInfo, Brand } from '@agoric/ertp/src/types';

type VbankInfo = {
  brand: Brand;
  displayInfo: DisplayInfo<'nat'>;
  issuerName: string;
};

export const watchVbank = (unserializer: Marshal<unknown>, leader: unknown) => {
  const path = ':published.agoricNames.vbankAsset';

  const watch = async () => {
    const f = makeFollower(path, leader, { unserializer });

    for await (const { value } of iterateLatest(f)) {
      console.debug('got update', path, value);
      const brandToInfo = new Map(
        (value as Array<[string, VbankInfo]>).map(entry => [
          entry[1].brand,
          { ...entry[1].displayInfo, petname: entry[1].issuerName },
        ]),
      );
      appStore.setState({ brandToInfo });
    }
  };

  watch().catch(e => {
    console.error('Error watching vbank assets', e);
    appStore.setState({ watchVbankError: 'Error loading asset display info' });
  });
};
