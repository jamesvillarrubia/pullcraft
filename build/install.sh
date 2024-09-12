#!/bin/bash

INSTALL_DIR="/usr/local/bin"
REPO="jamesvillarrubia/pullcraft"

# Determine OS and architecture
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="ubuntu"
else
    echo "Unsupported operating system: $OSTYPE"
    exit 1
fi

ARCH=$(uname -m)
case $ARCH in
    x86_64)
        ARCH="x64"
        ;;
    arm64|aarch64)
        ARCH="arm64"
        ;;
    *)
        echo "Unsupported architecture: $ARCH"
        exit 1
        ;;
esac

# Get the latest release version
LATEST_VERSION=$(curl -s https://api.github.com/repos/$REPO/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

if [ -z "$LATEST_VERSION" ]; then
    echo "Failed to fetch the latest version. Please check your internet connection and try again."
    exit 1
fi

echo "Latest version: $LATEST_VERSION"
echo "Detected OS: $OS, Architecture: $ARCH"

# Download the latest release
BINARY_NAME="pullcraft-$OS"
DOWNLOAD_URL="https://github.com/$REPO/releases/download/$LATEST_VERSION/$BINARY_NAME"
echo "Downloading PullCraft from $DOWNLOAD_URL..."
curl -L "$DOWNLOAD_URL" -o pullcraft

if [ $? -ne 0 ]; then
    echo "Failed to download PullCraft. Please check your internet connection and try again."
    exit 1
fi

# Make the binary executable
chmod +x pullcraft

# Move the binary to the installation directory
sudo mv pullcraft "$INSTALL_DIR/pullcraft"

if [ $? -ne 0 ]; then
    echo "Failed to move PullCraft to $INSTALL_DIR. Please check your permissions and try again."
    exit 1
fi

echo "PullCraft has been installed successfully in $INSTALL_DIR"
echo "You can now use the 'pullcraft' command to run the application."

# Verify the installation
pullcraft --version