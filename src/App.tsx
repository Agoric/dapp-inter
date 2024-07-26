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
  networkConfigAtom,
  rpcNodeAtom,
  appStore,
  savedApiNodeAtom,
  savedRpcNodeAtom,
} from 'store/app';
import Root from 'views/Root';
import DisclaimerDialog from 'components/DisclaimerDialog';
import { secondsSinceEpoch } from 'utils/date';
import { fetchChainInfo } from 'utils/rpc';
import { makeAgoricChainStorageWatcher } from '@agoric/rpc';

import 'react-toastify/dist/ReactToastify.css';
import 'styles/globals.css';
import ChainConnectionErrorDialog from 'components/ChainConnectionErrorDialog';
import { useStore } from 'zustand';
import NodeSelectorDialog from 'components/NodeSelectorDialog';

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

const App = () => {
  const netConfig = useAtomValue(networkConfigAtom);
  const savedRpcNode = useAtomValue(savedRpcNodeAtom);
  const savedApiNode = useAtomValue(savedApiNodeAtom);
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
        setRpcNode(savedRpcNode || rpc);
        setChainStorageWatcher(
          makeAgoricChainStorageWatcher(savedApiNode || api, chainName, e => {
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
    savedRpcNode,
    savedApiNode,
  ]);

  useTimeKeeper();

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
      <ChainConnectionErrorDialog />
      <NodeSelectorDialog />
    </div>
  );
};

export default App;
