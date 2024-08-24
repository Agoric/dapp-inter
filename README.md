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

   \*If you have access to the mnemonics, use `--interactive` to get a prompt to import them. Without that it will create new keys. You can save the seed phrase somewhere, or even create a keplr account with it for testing. You can use `agd keys list --keyring-backend=test` to check which keys you've created.

3. Start a local chain with psm, vaults, etc.

   ```
   cd packages/inter-protocol && scripts/start-local-chain.sh
   ```

4. Go the the [wallet](https://github.com/Agoric/wallet-app) repository and start a local client server:

   ```sh
   cd wallet-app && yarn install
   cd wallet && yarn start
   ```

5. Open the [wallet UI](http://localhost:3000/wallet/) and adjust Settings to use the localhost network.

   <img width="410" alt="Screen Shot 2023-01-23 at 11 57 16 AM" src="https://user-images.githubusercontent.com/8848650/214137346-b42942db-3b93-413a-991e-c77e2a30d6f1.png">

   If you created a Keplr account with the seed from YOUR_ACCOUNT_KEY, you should already have a smart wallet provisioned.

6. Return to this repository and `yarn && yarn dev` to start the local server with Hot Module Replacement (which automatically refreshes the UI as you change source files). To connect to your local wallet UI, use http://127.0.0.1:5173/?wallet=local.

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

# Testing

End-to-end (E2E) tests have been written to test the dapp and perform automated testing on emerynet/devnet during upgrades.

## Running Tests on Local Machine

To run tests on your local machine, start by opening your terminal and starting the development server:

```bash
yarn dev
```

Once the server is running, you can start the tests with the following command:

```bash
CYPRESS_AGORIC_NET=<network> yarn test:e2e --spec=<pathToTestFile>
```

Replace `<network>` with one of the following options: `local`, `emerynet`, or `devnet`, and `<pathToTestFile>` with the path to the specific test file you want to run. We have the following test files in the repo:

- `test/e2e/specs/test.spec.js` – Tests related to vaults.
- `test/e2e/specs/liquidation.spec.js` – Tests related to the liquidation happy path scenario.
- `test/e2e/specs/liquidation-reconstitution.spec.js` – Tests related to the liquidation reconstitution scenario.

If you are running the tests on a local network, you'll need to start a local a3p network first. Use this command:

```bash
docker compose -f tests/e2e/docker-compose.yml up -d agd
```

When testing liquidation scenarios, make sure to export the following environment variables:

- `CYPRESS_USER1_MNEMONIC`: Mnemonic for the `user1`. This wallet is responsible for creating vaults during tests.
- `CYPRESS_USER1_ADDRESS`: Wallet address for the `user1`.
- `CYPRESS_BIDDER_MNEMONIC`: Mnemonic for the bidder. This wallet is responsible for placing bids.
- `CYPRESS_BIDDER_ADDRESS`: Wallet address for the bidder.
- `CYPRESS_GOV1_MNEMONIC`: Mnemonic for the `gov1` account. This wallet, along with `gov2`, is responsible for changing the price of ATOM during testing.
- `CYPRESS_GOV1_ADDRESS`: Wallet address for the `gov1` account.
- `CYPRESS_GOV2_MNEMONIC`: Mnemonic for the `gov2` account.
- `CYPRESS_GOV2_ADDRESS`: Wallet address for the `gov2` account.

Make sure these environment variables are correctly set in your environment before running the tests. If you are testing with a local chain, setting these environment variables is not required.

Also ensure you have Chrome installed on your machine, as the tests run using the Chrome browser by default.

## Running Tests on GitHub

To run these tests on GitHub, you can manually trigger the workflows and provide wallet mnemonics and addresses to use specific wallets for testing.

1. **Navigate to the Actions Tab**  
   Go to the repository on GitHub and click on the **Actions** tab.

2. **Trigger the Vaults E2E Tests**  
   To run the tests for vaults:

   - Find the `Vaults E2E tests` workflow.
   - Click on it and select **Run workflow**.
   - Choose the network where you want to run the tests (e.g., `local`, `emerynet`, `devnet`).
   - Input the mnemonic and address of the wallet you want to use for testing.

3. **Run Liquidation Tests**  
   To run tests for the liquidation scenarios:
   - For the Liquidation happy path scenario, click on the `Liquidation E2E tests` workflow.
   - For the Liquidation reconstitution scenario, click on the `Liquidation reconstitution E2E tests` workflow.
   - Select **Run workflow** for either test.
   - Input the following details:
     - **Network**: Specify the network to run the tests.
     - **Wallet Details**:
       - `user1` mnemonic and address (for creating vaults)
       - `bidder` mnemonic and address (for placing bids)
       - `gov1` and `gov2` mnemonics and addresses (for governance tasks)
     - **Agoric-SDK Image Tag**: Specify the image tag to use for testing.

These workflows allow you to input all the parameters that you would normally set as environment variables when testing locally.
