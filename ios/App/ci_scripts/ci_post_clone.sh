#!/bin/sh
set -e

# Install Homebrew if missing
if ! command -v brew &>/dev/null; then
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Install Node.js if missing
if ! command -v node &>/dev/null; then
  brew install node
fi

# Go to repo root (3 levels up from ios/App/ci_scripts)
cd "$CI_PRIMARY_REPOSITORY_PATH"

# Install dependencies and sync Capacitor iOS
npm install
npx cap sync ios
