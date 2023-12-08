export const fetchChainInfo = async (netconfigURL: string) => {
  const response = await fetch(netconfigURL, {
    headers: { accept: 'application/json' },
  });
  const { rpcAddrs, chainName, apiAddrs } = await response.json();

  return {
    rpc: rpcAddrs[Math.floor(Math.random() * rpcAddrs.length)],
    api: apiAddrs[Math.floor(Math.random() * apiAddrs.length)],
    chainName,
  };
};

export const fetchAllAddrs = async (netconfigURL: string) => {
  const response = await fetch(netconfigURL, {
    headers: { accept: 'application/json' },
  });
  const { rpcAddrs, apiAddrs } = await response.json();

  return {
    rpcAddrs,
    apiAddrs,
  };
};
