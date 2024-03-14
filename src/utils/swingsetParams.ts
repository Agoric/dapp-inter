import { QueryClient, createProtobufRpcClient } from '@cosmjs/stargate';
import {
  QueryClientImpl,
  QueryParamsResponse,
} from '@agoric/cosmic-proto/swingset/query.js';
import { HttpClient, Tendermint34Client } from '@cosmjs/tendermint-rpc';

/**
 * Query swingset params.
 */
export const querySwingsetParams = async (
  endpoint: string,
): Promise<typeof QueryParamsResponse> => {
  const http = new HttpClient(endpoint);
  const trpc = await Tendermint34Client.create(http);
  const base = QueryClient.withExtensions(trpc);
  const rpc = createProtobufRpcClient(base);
  const queryService = new QueryClientImpl(rpc);

  return queryService.Params({});
};
