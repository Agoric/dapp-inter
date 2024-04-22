#!/bin/bash

# Common variables
export mnemonicGov1="such field health riot cost kitten silly tube flash wrap festival portion imitate this make question host bitter puppy wait area glide soldier knee"
export mnemonicGov2="physical immune cargo feel crawl style fox require inhale law local glory cheese bring swear royal spy buyer diesel field when task spin alley"
export mnemonicUser1="tackle hen gap lady bike explain erode midnight marriage wide upset culture model select dial trial swim wood step scan intact what card symptom"
export gov1AccountAddress=agoric1ee9hr0jyrxhy999y755mp862ljgycmwyp4pl7q
export gov2AccountAddress=agoric1wrfh296eu2z34p6pah7q04jjuyj3mxu9v98277
export user1Address=agoric1ydzxwh6f893jvpaslmaz6l8j2ulup9a7x8qvvq

checkFieldValue() {
  fieldValue=$(echo "$output" | jq -r ".$1")
  if [ -z "$fieldValue" ]; then
    echo "Error: $1 field is missing or empty"
    exit 1
  fi
  
  expectedValue="$2"
  if [ "$fieldValue" != "$expectedValue" ]; then
    echo "Error: $1 field does not match the expected value"
    echo "Expected: $expectedValue"
    echo "Actual: $fieldValue"
    exit 1
  fi
}

addKeys() {
  commandToExecute="agd keys add $1 --recover --keyring-backend=test"
  mnemonicPrompt="Enter your bip39 mnemonic"

  output=$(expect -c "
      spawn $commandToExecute
      expect {
          \"override\" {
              send \"y\r\"
              exp_continue
          }
          \"$mnemonicPrompt\" {
              send \"$2\r\"
              exp_continue
          }
      }
      expect eof
  ")

  echo "$output"
}

addKeyAndCheck() {
    keyName="$1"
    mnemonic="$2"
    expectedAddress="$3"

    result=$(addKeys "$keyName" "$mnemonic")
    if [[ $result == *"$expectedAddress"* ]]; then
        echo "Keys for $keyName added successfully"
    else
        echo "Error: $result" >&2
        exit 1
    fi
}