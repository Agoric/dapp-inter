export const fetchRPCAddr = async (netconfigURL: string) => {
  const response = await fetch(netconfigURL, {
    headers: { accept: 'application/json' },
  });
  const { rpcAddrs } = await response.json();

  return rpcAddrs[Math.floor(Math.random() * rpcAddrs.length)];
};
