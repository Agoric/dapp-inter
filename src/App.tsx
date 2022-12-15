import NetworkDropdown from 'components/NetworkDropdown';
import { ToastContainer } from 'react-toastify';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Vaults from 'views/Vaults';
import ErrorPage from 'views/ErrorPage';

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
