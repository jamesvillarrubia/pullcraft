#!/bin/bash

if [ -z "$1" ]; then
    echo "Error: Binary name not provided"
    exit 1
fi

if [ -z "$2" ]; then
    echo "Error: Version not provided"
    exit 1
fi

BINARY_NAME=$1
VERSION=$2
PLATFORM=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)


if [[ "$PLATFORM" == "darwin" ]]; then
    NODE_PATH=$(which node)
    OUTPUT_NAME="${BINARY_NAME}-${VERSION}-macos-${ARCH}"
    SEA_CONFIG="./build/sea-config.json"
elif [[ "$PLATFORM" == "linux" ]]; then
    NODE_PATH=$(which node)
    OUTPUT_NAME="${BINARY_NAME}-${VERSION}-linux-${ARCH}"
    SEA_CONFIG="./build/sea-config.json"
else
    NODE_PATH=$(which node.exe)
    OUTPUT_NAME="${BINARY_NAME}-${VERSION}-win-${ARCH}.exe"
    SEA_CONFIG="./build/sea-config.json"
fi

echo "Creating package for $PLATFORM on $ARCH"

node --experimental-sea-config "$SEA_CONFIG" --experimental-default-type=module

cp "$NODE_PATH" "build/assets/$OUTPUT_NAME"

npx postject "build/assets/$OUTPUT_NAME" NODE_SEA_BLOB build/prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 --macho-segment-name NODE_SEA

echo "Package created: build/assets/$OUTPUT_NAME"