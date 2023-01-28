import { useState } from 'react';
import OfferSignerBridge from 'components/OfferSignerBridge';
import { ToastContainer } from 'react-toastify';
import { RouterProvider, createHashRouter } from 'react-router-dom';
import Vaults from 'views/Vaults';
import ErrorPage from 'views/ErrorPage';
import { useEffect } from 'react';
import { watchVbank } from 'service/vbank';
import { useAtomValue, useAtom } from 'jotai';
import { leaderAtom, networkConfigAtom } from 'store/app';
import { makeLeader } from '@agoric/casting';

import 'react-toastify/dist/ReactToastify.css';
import 'styles/globals.css';
import Root from 'views/Root';

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

const App = () => {
  const netConfig = useAtomValue(networkConfigAtom);
  const [leader, setLeader] = useAtom(leaderAtom);
  const [error, setError] = useState<unknown | null>(null);

  useEffect(() => {
    let isCancelled = false;
    if (leader) return;
    const startWatching = async () => {
      try {
        const newLeader = await makeLeader(netConfig.url);
        if (isCancelled) return;
        setLeader(newLeader);
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
  }, [setError, leader, netConfig, setLeader]);

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
    </div>
  );
};

export default App;
