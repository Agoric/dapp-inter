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

# E2E Testing

End-to-end (E2E) tests have been written to test the dapp and perform automated testing on emerynet/devnet during upgrades.

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

## Running Tests on Local Machine

To run end-to-end tests locally, it's best to avoid running multiple processes or programs on your computer, as this can cause the tests to become flaky and produce unreliable results. Let's see the steps to run these tests:

### 1. Exporting Environment Variables

When testing liquidation scenarios, make sure to export the following environment variables:

- `CYPRESS_BIDDER_MNEMONIC`: Mnemonic for the bidder. This wallet is responsible for placing bids.
- `CYPRESS_BIDDER_ADDRESS`: Wallet address for the bidder.
- `CYPRESS_GOV1_MNEMONIC`: Mnemonic for the `gov1` account. This wallet, along with `gov2`, is responsible for changing the price of ATOM during testing.
- `CYPRESS_GOV1_ADDRESS`: Wallet address for the `gov1` account.
- `CYPRESS_GOV2_MNEMONIC`: Mnemonic for the `gov2` account.
- `CYPRESS_GOV2_ADDRESS`: Wallet address for the `gov2` account.

Make sure these environment variables are correctly set in your environment before running the tests. If you are testing with `a3p` chain, setting these environment variables is not required.

### 2. Start the development server

To run tests on your local machine, first start your local development server, use the following command:

```bash
yarn dev --host
```

Be sure to include the `--host` flag if you're using a Mac, as this ensures that `localhost` works correctly with Cypress.

### 3. Ensure Keys are in Local Keyring

You need to ensure that certain keys `(gov1, gov2, and user1)` are present in your local keyring. To find the mnemonics for these keys, open the file `test/e2e/test.utils.js` and look for the `mnemonics` object in the file.

**Note:** The test cases for adding keys using `agd` from the CLI might fail. This is expected behavior and is fine when testing on your local machine.

### 4. Adjust agops Path in Code

Adjust the file path for `agops` in code to match your local machine’s directory structure. Open the file located at `test/e2e/support.js`. Go to `line number 15` and locate the path configuration for `agops`. Modify this path to match the actual location of agops on your computer.

### 5. Running the a3p chain(optional)

If you plan to run tests with `CYPRESS_AGORIC_NET=local`, you must start the `a3p` chain beforehand. To do this, use the following command:

```bash
docker run -d -p 26657:26657 -p 1317:1317 -p 9090:9090 ghcr.io/agoric/agoric-3-proposals:latest
```

Alternatively, you can create an `a3p` chain from a specific branch in your `agoric-sdk` repository. To do this, navigate to the `a3p-integration` directory in your `agoric-sdk` repository. Install all necessary dependencies and build the project with:

```bash
yarn && yarn build
```

Once the build is complete, locate the Docker image you just created by running:

```bash
docker images
```

Find the hash of your new image and start the container using the hash:

```bash
docker run -p 26657:26657 -p 1317:1317 -p 9090:9090 {hash}
```

### 6. Run the tests

Next, run the tests using the following command:

```bash
CYPRESS_AGORIC_NET=<network> yarn test:e2e --spec=<pathToTestFile>
```

where `<network>` can be: `local`,`emerynet`,`devnet`, `xnet` or `ollinet`.

Replace `<pathToTestFile>` with the specific path to the test file you want to run. We have the following test files in the repo:

- `test/e2e/specs/test.spec.js` – Tests related to vaults.
- `test/e2e/specs/liquidation.spec.js` – Tests related to the liquidation happy path scenario.
- `test/e2e/specs/liquidation-reconstitution.spec.js` – Tests related to the liquidation reconstitution scenario.

**Note:** The tests use chrome browser by default so they require it to be installed.
