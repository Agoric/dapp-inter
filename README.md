# Inter Protocol UI

User application for Agoric Inter Protocol--Vaults, BLD Boost, Liquidations, etc.

## Development

1. Download and build the latest copy of `agoric-sdk`.

```
cd agoric-sdk
yarn && yarn build
```

2. (One-time) Define keys expected by the startup scripts

```
agd keys add gov1 --keyring-backend=test
agd keys add gov2 --keyring-backend=test
```

If you have access to the mnemonics, use `--interactive` to get a prompt to import them. Without that it will create new keys. You can save the seed phrase somewhere, or even create a keplr account with it for testing. You can use `agd keys list --keyring-backend=test` to check which keys you've created.

3. Start a local chain with psm, vaults, etc.

```
cd packages/inter-protocol && scripts/start-local-chain.sh
```


4. Start a local [wallet](https://github.com/Agoric/wallet-app) client server:

```
cd wallet-app
yarn start
```

Go to settings and select localhost for your network

<img width="410" alt="Screen Shot 2023-01-23 at 11 57 16 AM" src="https://user-images.githubusercontent.com/8848650/214137346-b42942db-3b93-413a-991e-c77e2a30d6f1.png">

If you created a Keplr account with the seed from YOUR_ACCOUNT_KEY, you should already have a smart wallet provisioned.

5. Then `yarn && yarn dev` in this directory to start the local HMR server. To connect to your local wallet UI, use http://127.0.0.1:5173/?wallet=local.

## Deployment

`yarn install && yarn build` will create a bundled SPA in the `dist` folder that can be served from a web server.
You can preview the bundled application by running `yarn preview`.
By default, it will have a network dropdown for choosing between various test networks.

![image](https://user-images.githubusercontent.com/8848650/218278636-d9049a84-d14e-4668-8a13-97754313bde1.png)

For production, it's
recommended that you use the environment variable `VITE_NETWORK_CONFIG_URL` to preset a real network and hide the dropdown:

```
VITE_NETWORK_CONFIG_URL=https://<PRODUCTION-NETWORK>.net/network-config yarn build
```
