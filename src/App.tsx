import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import { RouterProvider, createHashRouter } from 'react-router-dom';
import Vaults from 'views/Vaults';
import ErrorPage from 'views/ErrorPage';
import { watchVbank } from 'service/vbank';
import { useAtomValue, useAtom, useSetAtom } from 'jotai';
import {
  chainStorageWatcherAtom,
  currentTimeAtom,
  isAppVersionOutdatedAtom,
  networkConfigAtom,
  rpcNodeAtom,
  appStore,
} from 'store/app';
import Root from 'views/Root';
import DisclaimerDialog from 'components/DisclaimerDialog';
import { secondsSinceEpoch } from 'utils/date';
import { vaultStoreAtom } from 'store/vaults';
import AppVersionDialog from 'components/AppVersionDialog';
import { currentlyVisitedHash, ipfsHashLength } from 'utils/ipfs';
import { fetchChainInfo } from 'utils/rpc';
import { makeAgoricChainStorageWatcher } from '@agoric/rpc';

import 'react-toastify/dist/ReactToastify.css';
import 'styles/globals.css';
import ChainConnectionErrorDialog from 'components/ChainConnectionErrorDialog';
import { useStore } from 'zustand';

const router = createHashRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Vaults />,
        errorElement: <ErrorPage />,
        path: '/vaults',
      },
    ],
  },
]);

const TIME_UPDATE_INTERVAL_MS = 1000;

const useTimeKeeper = () => {
  const setCurrentTime = useSetAtom(currentTimeAtom);

  useEffect(() => {
    const id = setInterval(
      () => setCurrentTime(secondsSinceEpoch()),
      TIME_UPDATE_INTERVAL_MS,
    );

    return () => {
      clearInterval(id);
    };
  }, [setCurrentTime]);
};

const useAppVersionWatcher = () => {
  const { vaultFactoryParams } = useAtomValue(vaultStoreAtom);
  const setIsAppVersionOutdated = useSetAtom(isAppVersionOutdatedAtom);

  const { referencedUI } = vaultFactoryParams ?? {};

  useEffect(() => {
    // We can roughly approximate if it's a valid hash, rather than empty or
    // "NONE" or the like, by checking its length. Otherwise don't complain.
    if (referencedUI?.length !== ipfsHashLength) {
      return;
    }

    const current = currentlyVisitedHash();

    if (referencedUI !== current) {
      setIsAppVersionOutdated(true);
    }
  }, [referencedUI, setIsAppVersionOutdated]);
};

const App = () => {
  const netConfig = useAtomValue(networkConfigAtom);
  const [chainStorageWatcher, setChainStorageWatcher] = useAtom(
    chainStorageWatcherAtom,
  );
  const { setChainConnectionError } = useStore(appStore);
  const setRpcNode = useSetAtom(rpcNodeAtom);

  useEffect(() => {
    let isCancelled = false;
    if (chainStorageWatcher) return;
    const startWatching = async () => {
      try {
        const { rpc, chainName, api } = await fetchChainInfo(netConfig.url);
        if (isCancelled) return;
        setRpcNode(rpc);
        setChainStorageWatcher(
          makeAgoricChainStorageWatcher(api, chainName, e => {
            console.error(e);
            setChainConnectionError(
              new Error(
                'Received invalid response from API Endpoint: ' + e.message,
              ),
            );
          }),
        );

        watchVbank();
      } catch (e) {
        if (isCancelled) return;
        setChainConnectionError(
          new Error(
            `Error fetching network config from ${netConfig.url}` +
              (e instanceof Error ? `: ${e.message}` : ''),
          ),
        );
      }
    };
    startWatching();

    return () => {
      isCancelled = true;
    };
  }, [
    netConfig,
    chainStorageWatcher,
    setChainStorageWatcher,
    setRpcNode,
    setChainConnectionError,
  ]);

  useTimeKeeper();
  useAppVersionWatcher();

  return (
    <div>
      <ToastContainer
        position={'bottom-right'}
        closeOnClick={false}
        newestOnTop={true}
        hideProgressBar={true}
        autoClose={false}
      ></ToastContainer>
      <div className="w-screen max-w-7xl m-auto">
        <RouterProvider router={router} />
      </div>
      <DisclaimerDialog />
      <AppVersionDialog />
      <ChainConnectionErrorDialog />
    </div>
  );
};

export default App;
