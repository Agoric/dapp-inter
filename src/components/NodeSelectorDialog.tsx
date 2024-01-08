import {
  chainStorageWatcherAtom,
  isNodeSelectorOpenAtom,
  networkConfigAtom,
  rpcNodeAtom,
  savedApiNodeAtom,
  savedRpcNodeAtom,
} from 'store/app';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import ActionsDialog from './ActionsDialog';
import Combobox from 'components/Combobox';
import { useEffect, useState } from 'react';
import { fetchAllAddrs } from 'utils/rpc';

const useRpcAddrs = () => {
  const [rpcAddrs, setRpcAddrs] = useState([]);
  const [apiAddrs, setApiAddrs] = useState([]);
  const networkConfig = useAtomValue(networkConfigAtom);

  useEffect(() => {
    const fetchAddrs = async () => {
      const { rpcAddrs, apiAddrs } = await fetchAllAddrs(networkConfig.url);
      setRpcAddrs(rpcAddrs);
      setApiAddrs(apiAddrs);
    };

    try {
      fetchAddrs();
    } catch (e) {
      console.error('Error loading RPC Addrs', e);
    }
  }, [networkConfig]);

  return { rpcAddrs, apiAddrs };
};
const NodeSelectorDialog = () => {
  const [isOpen, setIsOpen] = useAtom(isNodeSelectorOpenAtom);
  const { rpcAddrs, apiAddrs } = useRpcAddrs();
  const watcher = useAtomValue(chainStorageWatcherAtom);
  const rpcAddr = useAtomValue(rpcNodeAtom);
  const [api, setApi] = useState(watcher?.apiAddr);
  const [rpc, setRpc] = useState(rpcAddr ?? undefined);
  const [initialApi, setInitialApi] = useState(api);
  const [initialRpc, setInitialRpc] = useState(rpc);
  const setSavedRpc = useSetAtom(savedRpcNodeAtom);
  const setSavedApi = useSetAtom(savedApiNodeAtom);

  const save = () => {
    assert(api && rpc);
    setSavedApi(api);
    setSavedRpc(rpc);
    setIsOpen(false);
    window.location.reload();
  };

  useEffect(() => {
    if (isOpen) {
      const currentRpc = rpcAddr ?? undefined;
      const currentApi = watcher?.apiAddr;
      setRpc(rpcAddr ?? undefined);
      setApi(watcher?.apiAddr);
      setInitialRpc(currentRpc);
      setInitialApi(currentApi);
    }
  }, [isOpen, rpcAddr, watcher?.apiAddr]);

  const body = (
    <div className="mt-2 p-1 max-h-96">
      <p>RPC Endpoint:</p>
      <Combobox
        onValueChange={(value: string) => {
          setRpc(value);
        }}
        value={rpc}
        options={rpcAddrs}
      />
      <p className="mt-4">API Endpoint:</p>
      <Combobox
        onValueChange={(value: string) => {
          setApi(value);
        }}
        value={api}
        options={apiAddrs}
      />
    </div>
  );

  return (
    <ActionsDialog
      title="Connection Settings"
      body={body}
      isOpen={isOpen}
      primaryAction={{
        action: save,
        label: 'Save',
      }}
      secondaryAction={{
        action: () => {
          setIsOpen(false);
        },
        label: 'Cancel',
      }}
      onClose={() => {
        setIsOpen(false);
      }}
      initialFocusPrimary
      overflow
      primaryActionDisabled={
        !(api && rpc) || (initialApi === api && initialRpc === rpc)
      }
    />
  );
};

export default NodeSelectorDialog;
