#!/bin/sh
set -e

export HOMEBREW_NO_AUTO_UPDATE=1
export HOMEBREW_NO_INSTALL_CLEANUP=1
export NONINTERACTIVE=1

# Add Homebrew to PATH (both Intel and Apple Silicon)
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/local/sbin:$PATH"

# Install Node.js if not available
if ! command -v node > /dev/null 2>&1; then
    brew install node
fi

echo "Node: $(node --version)"
echo "npm: $(npm --version)"

# Install npm dependencies from project root
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm install
