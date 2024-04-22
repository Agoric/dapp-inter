#!/bin/bash
source ./test/e2e/test-scripts/common.sh

if [ "$#" -lt 2 ] || [ "$#" -gt 3 ]; then
    echo "Usage: $0 <wantMinted> <giveCollateral> [userType]"
    exit 1
fi

wantMinted=$1
giveCollateral=$2
userType=${3:-user1}

if [ "$userType" = "user1" ]; then
    accountAddress="$user1Address"
else
    accountAddress="$gov1AccountAddress"
fi

echo "Creating Vault..."
agops vaults open --wantMinted "$wantMinted" --giveCollateral "$giveCollateral" > /tmp/want-ist.json

echo "Broadcasting..."
agops perf satisfaction --executeOffer /tmp/want-ist.json --from "$accountAddress" --keyring-backend=test 2>&1
wait
