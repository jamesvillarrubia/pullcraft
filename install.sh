#!/bin/bash

INSTALL_DIR="/usr/local/bin"
REPO="jamesvillarrubia/pullcraft"

# Determine system architecture
ARCH=$(uname -m)
case $ARCH in
    x86_64)
        BINARY_ARCH="x64"
        ;;
    arm64|aarch64)
        BINARY_ARCH="arm64"
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
echo "System architecture: $ARCH, downloading binary for $BINARY_ARCH"

# Download the latest release
echo "Downloading PullCraft..."
curl -L "https://github.com/$REPO/releases/download/$LATEST_VERSION/pullcraft" -o pullcraft

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

# Update PATH if necessary
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo "export PATH=\"$INSTALL_DIR:\$PATH\"" >> ~/.bashrc
    echo "Please restart your terminal or run 'source ~/.bashrc' to update your PATH."
fi

# Verify the installation
echo "Verifying installation..."
$INSTALL_DIR/pullcraft --version

if [ $? -ne 0 ]; then
    echo "Installation verification failed. Please check if the binary is compatible with your system."
    exit 1
fi