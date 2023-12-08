import { useEffect, useState } from 'react';
import { appStore, chainStorageWatcherAtom, rpcNodeAtom } from 'store/app';
import { useAtomValue } from 'jotai';
import ActionsDialog from './ActionsDialog';
import { useStore } from 'zustand';

const ChainConnectionErrorDialog = () => {
  const { chainConnectionError } = useStore(appStore);
  const chainStorageWatcher = useAtomValue(chainStorageWatcherAtom);
  const rpcNode = useAtomValue(rpcNodeAtom);
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (chainConnectionError) {
      setIsShowing(true);
    }
  }, [chainConnectionError]);

  const body = (
    <div className="mt-2 p-1 max-h-96 overflow-y-auto">
      <p className="mb-2">
        There was an issue connecting to the chain - likely due to RPC node
        issues. We are working to resolve it with our RPC providers. Please
        check back in a couple of hours.
      </p>
      {chainStorageWatcher && (
        <p>
          API Endpoint:{' '}
          <span className="text-blue-500">{chainStorageWatcher?.apiAddr}</span>
        </p>
      )}
      {rpcNode && (
        <p>
          RPC Endpoint: <span className="text-blue-500">{rpcNode}</span>
        </p>
      )}
      <p>
        Error:{' '}
        <span className="text-alert">{chainConnectionError?.toString()}</span>
      </p>
    </div>
  );

  return (
    <ActionsDialog
      title="Chain Connection Error"
      body={body}
      isOpen={isShowing}
      secondaryAction={{
        action: () => {
          setIsShowing(false);
        },
        label: 'Dismiss',
      }}
      onClose={() => {
        setIsShowing(false);
      }}
    />
  );
};

export default ChainConnectionErrorDialog;
