import NetworkDropdown from 'components/NetworkDropdown';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Vaults from 'views/Vaults';
import ErrorPage from 'views/ErrorPage';

import 'react-toastify/dist/ReactToastify.css';
import 'styles/globals.css';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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
            <Routes>
              <Route
                path="/"
                element={<Vaults />}
                errorElement={<ErrorPage />}
              />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
