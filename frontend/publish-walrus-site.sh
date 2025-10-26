#!/bin/bash

# Walrus Site On-Chain Publication
# Creates a Walrus Site object on Sui blockchain

set -e

RESOURCE_ID="0x0e6a0b6c308c4bb19542517843db2a6c502eba1a07509f2bb51ba419ca3fdc8"
PACKAGE_ID="0xf99aee9f21493e1590e7e5a9aea6f343a1f381031a04a732724871fc294be799"

echo "🔗 Creating Walrus Site object on Sui..."
echo "Resource ID: $RESOURCE_ID"
echo "Package: $PACKAGE_ID"

# Call the publish function on Walrus Sites package
sui client call \
  --package $PACKAGE_ID \
  --module site \
  --function new_site \
  --args $RESOURCE_ID \
  --gas-budget 100000000

echo ""
echo "✅ Site object created!"
echo "Copy the 'Created Objects' -> 'ObjectID' from above output"
echo "That's your Walrus Site Object ID for SuiNS"
