import { useState } from 'react';
import OfferSignerBridge from 'components/OfferSignerBridge';
import { ToastContainer } from 'react-toastify';
import { RouterProvider, createHashRouter } from 'react-router-dom';
import Vaults from 'views/Vaults';
import ErrorPage from 'views/ErrorPage';
import { useEffect } from 'react';
import { watchVbank } from 'service/vbank';
import { useAtomValue, useAtom, useSetAtom } from 'jotai';
import {
  chainStorageWatcherAtom,
  currentTimeAtom,
  importContextAtom,
  isAppVersionOutdatedAtom,
  networkConfigAtom,
} from 'store/app';
import Root from 'views/Root';
import DisclaimerDialog from 'components/DisclaimerDialog';
import { secondsSinceEpoch } from 'utils/date';
import { vaultStoreAtom } from 'store/vaults';
import AppVersionDialog from 'components/AppVersionDialog';
import { currentlyVisitedHash, ipfsHashLength } from 'utils/ipfs';
import { fetchRPCAddr } from 'utils/rpc';
import { makeAgoricChainStorageWatcher } from 'rpc';

import 'react-toastify/dist/ReactToastify.css';
import 'styles/globals.css';

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
  const importContext = useAtomValue(importContextAtom);
  const [chainStorageWatcher, setChainStorageWatcher] = useAtom(
    chainStorageWatcherAtom,
  );
  const [error, setError] = useState<unknown | null>(null);

  useEffect(() => {
    let isCancelled = false;
    if (chainStorageWatcher) return;
    const startWatching = async () => {
      try {
        const rpcAddr = await fetchRPCAddr(netConfig.url);
        if (isCancelled) return;
        setChainStorageWatcher(
          makeAgoricChainStorageWatcher(
            rpcAddr,
            importContext.fromBoard.unserialize,
            e => {
              setError(e);
              throw e;
            },
          ),
        );
        watchVbank();
      } catch (e) {
        if (isCancelled) return;
        setError(e);
      }
    };
    startWatching();

    return () => {
      isCancelled = true;
    };
  }, [
    setError,
    netConfig,
    chainStorageWatcher,
    setChainStorageWatcher,
    importContext.fromBoard.unserialize,
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
      <OfferSignerBridge />
      <div className="w-screen max-w-7xl m-auto">
        {error ? (
          <>
            <div>Error connecting to chain</div>
            <details>{error.toString()}</details>
          </>
        ) : (
          <RouterProvider router={router} />
        )}
      </div>
      <DisclaimerDialog />
      <AppVersionDialog />
    </div>
  );
};

export default App;
