#!/bin/bash

INSTALL_DIR="/usr/local/bin"

# Copy the binary to the installation directory with the new name
sudo cp "pullcraft" "$INSTALL_DIR/pullcraft"

# Make the binary executable
sudo chmod +x "$INSTALL_DIR/pullcraft"

echo "pullcraft has been installed as 'pullcraft' in $INSTALL_DIR"
echo "You can now use the 'plc' command to run the application."