import './installSesLockdown';
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
      <div>
        Hello, Inter Protocol!
      </div>
    </>
  );
};

export default App;
