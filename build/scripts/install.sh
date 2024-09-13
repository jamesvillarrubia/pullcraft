#!/bin/bash

INSTALL_DIR="/usr/local/bin"

# Read repository information from package.json
REPO=$(node -p "require('./package.json').repository.url.match(/github.com\/(.+?)(?:\.git)?$/)[1]")

if [ -z "$REPO" ]; then
    echo "Error: Unable to determine repository from package.json"
    exit 1
fi

# Read binary name from package.json
BIN_NAME=$(node -p "Object.keys(require('./package.json').bin)[0]")

if [ -z "$BIN_NAME" ]; then
    echo "Error: Unable to determine binary name from package.json"
    exit 1
fi

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
echo "Binary name: $BIN_NAME"

# Download the latest release
BINARY_NAME="$BIN_NAME-$OS-$ARCH"
DOWNLOAD_URL="https://github.com/$REPO/releases/download/$LATEST_VERSION/$BINARY_NAME"
echo "Downloading $BIN_NAME from $DOWNLOAD_URL..."
curl -L "$DOWNLOAD_URL" -o "$BIN_NAME"

if [ $? -ne 0 ]; then
    echo "Failed to download $BIN_NAME. Please check your internet connection and try again."
    exit 1
fi

# Make the binary executable
chmod +x "$BIN_NAME"

# Move the binary to the installation directory
sudo mv "$BIN_NAME" "$INSTALL_DIR/$BIN_NAME"

if [ $? -ne 0 ]; then
    echo "Failed to move $BIN_NAME to $INSTALL_DIR. Please check your permissions and try again."
    exit 1
fi

echo "$BIN_NAME has been installed successfully in $INSTALL_DIR"
echo "You can now use the '$BIN_NAME' command to run the application."

# Verify the installation
"$BIN_NAME" --version