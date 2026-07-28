#!/bin/bash
# Open Sabagiro iOS project without wallet pass preview crashes.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"

killall Xcode 2>/dev/null || true
qlmanage -r cache >/dev/null 2>&1 || true
killall quicklookd 2>/dev/null || true
rm -rf ~/Library/Saved\ Application\ State/com.apple.dt.Xcode.savedState 2>/dev/null || true
rm -f ~/Library/Developer/Xcode/UserData/IDEEditorInteractivityHistory.plist 2>/dev/null || true
defaults delete com.apple.dt.Xcode NSRecentDocumentRecords 2>/dev/null || true
# Avoid IDEIntelligenceChat crash when Apple Intelligence is unavailable on this Mac.
defaults write com.apple.dt.Xcode IDEChatIsBuiltInChatGPTEnabled -bool false 2>/dev/null || true
defaults write com.apple.dt.Xcode DVTTextEnablePredictiveCompletion -bool false 2>/dev/null || true
defaults write com.apple.dt.Xcode IDE_CA_Daily_LanguageModel -string disabled 2>/dev/null || true
# Drop stale Spotlight entries for old .pass / .pkpass paths inside the repo.
touch "$REPO/wallet/apple/.metadata_never_index" 2>/dev/null || true
mdimport -d2 "$REPO" >/dev/null 2>&1 || true

# -ApplePersistenceIgnoreState YES skips restoring the Intelligence Chat panel layout.
open -a Xcode --args -ApplePersistenceIgnoreState YES "$ROOT/Sabagiro.xcodeproj"
