#!/bin/bash

source ./test/e2e/test-scripts/common.sh

fieldName="$1"
expectedValue="$2"

output=$(agops inter auction status)
checkFieldValue "$fieldName" "$expectedValue"
echo "Field is present and expected value is matched"