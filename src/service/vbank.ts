import { appStore } from 'store/app';
import { iterateLatest, makeFollower } from '@agoric/casting';
import type { DisplayInfo, Brand } from '@agoric/ertp/src/types';

type VbankInfo = {
  brand: Brand;
  displayInfo: DisplayInfo<'nat'>;
  issuerName: string;
};

type VbankUpdate = { value: Array<[string, VbankInfo]> };

export const watchVbank = () => {
  const path = ':published.agoricNames.vbankAsset';
  const { importContext, leader } = appStore.getState();

  const watch = async () => {
    const f = makeFollower(path, leader, {
      unserializer: importContext.fromBoard,
    });

    for await (const { value } of iterateLatest<VbankUpdate>(f)) {
      console.debug('got update', path, value);
      const brandToInfo = new Map(
        value.map(entry => [
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
