import NetworkDropdown from 'components/NetworkDropdown';
import { ToastContainer } from 'react-toastify';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Vaults from 'views/Vaults';
import ErrorPage from 'views/ErrorPage';

import 'react-toastify/dist/ReactToastify.css';
import 'styles/globals.css';
import { useEffect } from 'react';
import { watchVbank } from 'service/vbank';
import { useAtomValue } from 'jotai';
import { importContextAtom, leaderAtom } from 'store/app';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Vaults />,
    errorElement: <ErrorPage />,
  },
]);

const App = () => {
  const { fromBoard: unserializer } = useAtomValue(importContextAtom);
  const leader = useAtomValue(leaderAtom);

  useEffect(() => {
    watchVbank(unserializer, leader);
  }, []);

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
          <RouterProvider router={router} />
        </div>
      </div>
    </>
  );
};

export default App;
