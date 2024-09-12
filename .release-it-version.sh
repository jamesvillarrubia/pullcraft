#!/bin/bash

version=$1

# Update version in bin/pullcraft.ts
sed -i.bak "s/__VERSION__/$version/g" bin/pullcraft.ts

# Remove backup file
rm bin/pullcraft.ts.bak

echo "Updated version to $version in bin/pullcraft.ts"