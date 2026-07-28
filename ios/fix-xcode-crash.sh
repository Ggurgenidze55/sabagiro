#!/bin/bash
# Fix Xcode 26 crash in IDEIntelligenceChat / ChatModelService on launch.
# Crash happens when Apple Intelligence is unavailable (e.g. system en vs Siri en-GB).
set -euo pipefail

killall Xcode 2>/dev/null || true

ROOT="$(cd "$(dirname "$0")" && pwd)"

rm -rf ~/Library/Saved\ Application\ State/com.apple.dt.Xcode.savedState
rm -f ~/Library/Developer/Xcode/UserData/IDEEditorInteractivityHistory
rm -f "$ROOT/Sabagiro.xcodeproj/project.xcworkspace/xcuserdata/"*/UserInterfaceState.xcuserstate
rm -rf "$ROOT/Sabagiro.xcodeproj/xcuserdata"

# Disable Xcode Coding Assistant / Chat panel so workspace restore does not load it.
defaults write com.apple.dt.Xcode IDEChatIsBuiltInChatGPTEnabled -bool false
defaults write com.apple.dt.Xcode DVTTextEnablePredictiveCompletion -bool false
defaults write com.apple.dt.Xcode IDE_CA_Daily_LanguageModel -string disabled
defaults delete com.apple.dt.Xcode IDEChatUserSelectedDefaultChatModelDefinitionIdentifier 2>/dev/null || true
defaults delete com.apple.dt.Xcode IDECodingIntelligenceUseHistory 2>/dev/null || true

qlmanage -r cache >/dev/null 2>&1 || true
killall quicklookd 2>/dev/null || true
rm -rf ~/Library/Developer/Xcode/DerivedData

echo "Xcode Intelligence/Chat disabled. You can open the project now."
