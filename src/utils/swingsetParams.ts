import { QueryClient, createProtobufRpcClient } from '@cosmjs/stargate';
import { agoric } from '@agoric/cosmic-proto';
import { HttpClient, Tendermint34Client } from '@cosmjs/tendermint-rpc';

/**
 * Query swingset params.
 */
export const querySwingsetParams = async (endpoint: string) => {
  const http = new HttpClient(endpoint);
  const trpc = await Tendermint34Client.create(http);
  const base = QueryClient.withExtensions(trpc);
  const rpc = createProtobufRpcClient(base);
  const queryService = new agoric.swingset.QueryClientImpl(rpc);

  return queryService.params({});
};
