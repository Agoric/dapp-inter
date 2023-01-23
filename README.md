# Inter Protocol UI

User application for Agoric Inter Protocol--Vaults, BLD Boost, Liquidations, etc.


## Development

1. Download and build the latest copy of `agoric-sdk`.
```
cd agoric-sdk
yarn && yarn build
```

2. Build the local chain if necessary.
```
cd packages/cosmic-swingset && make scenario2-setup
```

3. (One-time) Create a private key for local development.
```
agd keys add YOUR_ACCOUNT_KEY --keyring-backend=test // Your test account. You can name this whatever you want.
agd keys add oracle2 --keyring-backend=test // This will be used by scripts later on.
```
You can save the seed phrase somewhere, or even create a keplr account with it for testing. You can use `agd keys list --keyring-backend=test` to check which keys you've created.

4. Start a local chain with psm, vaults, etc. 
```
cd packages/inter-protocol && scripts/start-local-chain.sh YOUR_ACCOUNT_KEY
```
(May need to `chmod +x start-local-chain.sh` first).

5. Set up the price feeds needed by the vault contracts and UI
```
cd packages/agoric-cli
AGORIC_NET=local test/agops-oracle-smoketest.sh YOUR_ACCOUNT_KEY
```
If it hangs on `agoric follow`, you can just cancel it as it's made it far enough to create a price feed. If you want, you can manually run the remaining steps in your terminal.

6. Start a local [wallet](https://github.com/Agoric/wallet-app) client server:

```
cd wallet-app
yarn start
```

Go to settings and select localhost for your network 

<img width="410" alt="Screen Shot 2023-01-23 at 11 57 16 AM" src="https://user-images.githubusercontent.com/8848650/214137346-b42942db-3b93-413a-991e-c77e2a30d6f1.png">

If you created a Keplr account with the seed from YOUR_ACCOUNT_KEY, you should already have a smart wallet provisioned.

7. Then `yarn && yarn dev` in this directory to start the local HMR server. To connect to your local wallet UI, use http://127.0.0.1:5173/?wallet=local.

## Deployment

(TODO)
