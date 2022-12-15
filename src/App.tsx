import NetworkDropdown from 'components/NetworkDropdown';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import 'styles/globals.css';

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
      <div className="p-4 flex w-full max-w-7xl justify-end m-auto">
        <NetworkDropdown />
      </div>
    </>
  );
};

export default App;
