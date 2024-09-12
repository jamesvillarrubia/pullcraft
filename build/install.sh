#!/bin/bash

INSTALL_DIR="/usr/local/bin"

# Copy the binary to the installation directory with the new name
sudo cp "pullcraft" "$INSTALL_DIR/plc"

# Make the binary executable
sudo chmod +x "$INSTALL_DIR/plc"

echo "pullcraft has been installed as 'plc' in $INSTALL_DIR"
echo "You can now use the 'plc' command to run the application."