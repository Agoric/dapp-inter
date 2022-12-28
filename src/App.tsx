import { useState } from 'react';
import NetworkDropdown from 'components/NetworkDropdown';
import { ToastContainer } from 'react-toastify';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Vaults from 'views/Vaults';
import ErrorPage from 'views/ErrorPage';
import { useEffect } from 'react';
import { watchVbank } from 'service/vbank';
import { useAtomValue, useAtom } from 'jotai';
import { leaderAtom, networkConfigAtom } from 'store/app';
import { makeLeader } from '@agoric/casting';

import 'react-toastify/dist/ReactToastify.css';
import 'styles/globals.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Vaults />,
    errorElement: <ErrorPage />,
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
    <>
      <ToastContainer
        position={'bottom-right'}
        closeOnClick={false}
        newestOnTop={true}
        hideProgressBar={true}
        autoClose={false}
      ></ToastContainer>
      <div className="w-screen max-w-7xl m-auto">
        <div className="flex w-full justify-end p-4">
          <NetworkDropdown />
        </div>
        <div className="w-full">
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
    </>
  );
};

export default App;
