// Until casting supports querying keys https://github.com/Agoric/agoric-sdk/issues/6690
export const fetchVstorageKeys = async (
  rpcAddr: string,
  path: string,
  height?: number,
) => {
  const options = {
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'abci_query',
      params: {
        path: '/custom/vstorage/children/' + path,
        height: height && height.toString(),
      }, // height must be a string (bigint)
    }),
  };

  const res = await fetch(rpcAddr, options);
  const d = await res.json();
  return d.result.response.value && JSON.parse(atob(d.result.response.value));
};

export const fetchRPCAddr = async (netconfigURL: string) => {
  const response = await fetch(netconfigURL, {
    headers: { accept: 'application/json' },
  });
  const { rpcAddrs } = await response.json();

  return rpcAddrs[Math.floor(Math.random() * rpcAddrs.length)];
};
