#!/bin/bash

# Function to get the next version and update the specified file
update_version() {
    local file_path="$1"

    # Check if file path is provided
    if [ -z "$file_path" ] || [ ! -f "$file_path" ]; then
        echo "Error: Invalid file path" >&2
        exit 1
    fi

    # Get the next version using release-it
    next_version=$(npx release-it --release-version 2>/dev/null)

    # Check if the command was successful
    if [ $? -ne 0 ]; then
        echo "Error getting next version" >&2
        exit 1
    fi

    # Trim whitespace from the version
    next_version=$(echo "$next_version" | tr -d '[:space:]')

    # Update the TypeScript file
    sed -i.bak "s/__VERSION__/$next_version/g" "$file_path"
    rm "${file_path}.bak"

    # Update package.json
    npm version $next_version --no-git-tag-version

    echo "Version updated to $next_version in $file_path and package.json"
}

# Check if an argument is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <file_path>" >&2
    exit 1
fi

# Call the function with the provided file path
update_version "$1"