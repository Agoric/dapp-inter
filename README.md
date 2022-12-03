# Inter Protocol UI

User application for Agoric Inter Protocol--Vaults, BLD Boost, Liquidations, etc.

## Development

`yarn dev` to start a local HMR server.

By default it it will connect to the prod Wallet UI. To connect to a local one, use
http://127.0.0.1:5173/?wallet=local .

## Deployment

(TODO - Add Deployment URL from Cloudflare) serves the latest build of the `beta` branch.

To deploy, push to that branch. e.g. if you've qualified main,

```
git push origin main:beta
```
