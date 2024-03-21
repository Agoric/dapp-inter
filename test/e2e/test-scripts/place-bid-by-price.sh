#!/bin/bash

# Define the mnemonic
network=https://emerynet.rpc.agoric.net:443
accountName="rabi-dev"
mnemonic="silk praise pulse affair trigger mosquito stand action weapon next bottom peanut wish utility fork laugh grief journey unaware also canvas seminar merry suit"
export AGORIC_NET=emerynet
echo "Adding Account.."

commandToExecute="agd keys add $accountName --recover"
mnemonicPrompt="Enter your bip39 mnemonic"

expect -c "
    spawn $commandToExecute
    expect {
        \"override\" {
            send \"y\r\"
            exp_continue
        }
        \"$mnemonicPrompt\" {
            send \"$mnemonic\r\"
            exp_continue
        }
    }
"

# Place a bid
echo "Placing Bid..."
agops inter bid by-price --price 15 --give 9IST --maxBuy 1000ATOM --generate-only --from $accountName >spend-action.json
echo "y" | agd --node=$network tx swingset wallet-action --allow-spend "$(cat spend-action.json)" --chain-id=agoric-emerynet-8 --fees=5000ubld --from $accountName