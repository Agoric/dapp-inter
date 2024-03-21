# Inter Protocol UI

User application for Agoric Inter Protocol--Vaults, BLD Boost, Liquidations, etc.

## Development

### Requirements

- [Node 14.15.0 or higher](https://docs.agoric.com/guides/getting-started/)
- [Go 1.17 or higher](https://github.com/Agoric/agoric-sdk/tree/master/packages/cosmic-swingset#build-from-source)

### Setup

1. Download and build the latest copy of `agoric-sdk`, including Agoric's Cosmic SwingSet.

   ```sh
   cd agoric-sdk
   yarn && yarn build
   yarn link-cli ~/bin/agoric # or use any local dir in $PATH (e.g. ~/.local/bin/agoric)
   ```

   Test that `agoric` works with:

   `agoric --version`

   For Cosmic SwingSet (in `agoric-sdk`):

   ```sh
   cd packages/cosmic-swingset
   make
   ```

   Test that Cosmic SwingSet tools work with:

   `agd --help`

2. (One-time) Define keys expected by the startup scripts\*

   ```sh
   agd keys add gov1 --keyring-backend=test
   agd keys add gov2 --keyring-backend=test
   ```

   Note: If you have the mnemonic phrases, use `--interactive` to import them. Otherwise, new keys will be created. Remember to save the seed phrase securely. You can also use it to set up a Keplr account for testing purposes. To see the keys you've created, run `agd keys list --keyring-backend=test`.

3. Run the agoric local chain

   ```sh
   docker run -d -p 26657:26657 -p 1317:1317 -p 9090:9090 ghcr.io/agoric/agoric-3-proposals:main
   ```

4. Run `yarn && yarn dev` to start the local server with Hot Module Replacement (which automatically refreshes the UI as you change source files). To connect to your local wallet UI, use http://127.0.0.1:5173/?wallet=local.

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
