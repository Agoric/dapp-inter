import type { Marshal } from '@endo/marshal';
import { appStore } from 'store/app';
import { iterateLatest, makeFollower } from '@agoric/casting';

export const watchVbank = (unserializer: Marshal<any>, leader: unknown) => {
  const path = ':published.agoricNames.vbankAsset';

  const watch = async () => {
    const f = makeFollower(path, leader, { unserializer });

    for await (const { value } of iterateLatest(f)) {
      console.debug('got update', path, value);
      const brandToInfo = new Map(
        (value as Array<any>).map(entry => [
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
