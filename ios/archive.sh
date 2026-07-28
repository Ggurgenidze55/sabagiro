#!/bin/bash
# Build App Store archive without opening the Xcode UI (avoids WalletSupportUI crash).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
ARCHIVE="$HOME/Desktop/Sabagiro.xcarchive"

killall Xcode 2>/dev/null || true
qlmanage -r cache >/dev/null 2>&1 || true
killall quicklookd 2>/dev/null || true

cd "$ROOT"
xcodebuild -scheme Sabagiro -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE" \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM=R85UAY2KY6 \
  archive

echo ""
echo "Archive OK: $ARCHIVE"
echo "Upload: open -a Xcode && Window → Organizer → Archives → Distribute App"
