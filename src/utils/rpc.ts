export const fetchChainInfo = async (netconfigURL: string) => {
  const response = await fetch(netconfigURL, {
    headers: { accept: 'application/json' },
  });
  const { rpcAddrs, chainName, apiAddrs, dappInterJumperBanner } =
    await response.json();

  return {
    rpc: rpcAddrs[Math.floor(Math.random() * rpcAddrs.length)],
    api: apiAddrs[Math.floor(Math.random() * apiAddrs.length)],
    chainName,
    dappInterJumperBanner,
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

export const queryTotalActiveVaults = async () => {
  const res = await fetch(
    'https://api.subquery.network/sq/agoric-labs/agoric-mainnet-v2',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query:
          'query { vaults(filter: {state: {equalTo: "active"}}) {totalCount} }',
      }),
    },
  );

  const { data } = await res.json();

  return data.vaults.totalCount as number;
};
