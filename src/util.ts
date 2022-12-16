export const fetchVstorageKeys = (
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

  return fetch(rpcAddr, options)
    .then(res => res.json())
    .then(
      d => d.result.response.value && JSON.parse(atob(d.result.response.value)),
    );
};

export const fetchRPCAddr = async (netconfigURL: string) => {
  const response = await fetch(netconfigURL, {
    headers: { accept: 'application/json' },
  });
  const networkConfig = await response.json();

  return networkConfig.rpcAddrs[0];
};
