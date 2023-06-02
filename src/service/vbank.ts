import { appStore } from 'store/app';
import type { DisplayInfo, Brand } from '@agoric/ertp/src/types';
import { AgoricChainStoragePathKind as Kind } from 'rpc';

type VbankInfo = {
  brand: Brand;
  displayInfo: DisplayInfo<'nat'>;
  issuerName: string;
};

type VbankUpdate = Array<[string, VbankInfo]>;

export const watchVbank = () => {
  const { chainStorageWatcher } = appStore.getState();
  assert(chainStorageWatcher, 'chainStorageWatcher not initialized');

  const path = 'published.agoricNames.vbankAsset';

  chainStorageWatcher.watchLatest<VbankUpdate>(
    [Kind.Data, path],
    value => {
      console.debug('got update', path, value);
      if (!value) {
        appStore.setState({
          watchVbankError: `${path} returned undefined`,
        });
        return;
      }

      const brandToInfo = new Map(
        value.map(entry => [
          entry[1].brand,
          { ...entry[1].displayInfo, petname: entry[1].issuerName },
        ]),
      );
      appStore.setState({ brandToInfo });
    },
    log => {
      console.error('Error watching vbank assets', log);
      appStore.setState({
        watchVbankError: 'Error loading asset display info',
      });
    },
  );
};
