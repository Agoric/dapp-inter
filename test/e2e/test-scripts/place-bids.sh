#!/bin/bash
source ./test/e2e/test-scripts/common.sh

placeBidByPrice() {
    fromAddress=$1
    giveAmount=$2
    price=$3

    echo "Placing bid by price..."
    output=$(agops inter bid by-price --from  $fromAddress --give $giveAmount --price $price --keyring-backend=test)
    wait

    if echo "$output" | grep -q "Your bid has been accepted"; then
    echo "Bid Placed Successfully"
    echo "" >&2
    else
        echo "Error: $output" >&2
        exit 1
    fi
}

placeBidByDiscount() {
    fromAddress=$1
    giveAmount=$2
    discount=$3

    echo "Placing bid by discount..."
    output=$(agops inter bid by-discount --from  $fromAddress --give $giveAmount --discount $discount --keyring-backend=test)
    wait

    if echo "$output" | grep -q "Your bid has been accepted"; then
    echo "Bid Placed Successfully"
    echo "" >&2
    else
        echo "Error: $output" >&2
        exit 1
    fi
}


placeBidByPrice $gov1AccountAddress 90IST 9
placeBidByDiscount $gov1AccountAddress 80IST 10
placeBidByDiscount $gov1AccountAddress 150IST 15