#!/bin/bash
# Build signed .aab for Google Play (requires keystore.properties).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="$HOME/Desktop/sabagiro-play.aab"

if [[ ! -f "$ROOT/keystore.properties" ]]; then
  echo "Missing keystore.properties — copy keystore.properties.example and fill in passwords."
  exit 1
fi

if [[ -z "${JAVA_HOME:-}" ]]; then
  for candidate in \
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
    "/Applications/Android Studio.app/Contents/jre/Contents/Home"; do
    if [[ -x "$candidate/bin/java" ]]; then
      export JAVA_HOME="$candidate"
      break
    fi
  done
fi

if [[ -z "${JAVA_HOME:-}" ]] || [[ ! -x "${JAVA_HOME}/bin/java" ]]; then
  echo "Java not found. Open Android Studio → Build → Generate Signed Bundle/APK instead."
  exit 1
fi

cd "$ROOT"
./gradlew bundleRelease
cp app/build/outputs/bundle/release/app-release.aab "$OUT"
echo ""
echo "Play Store bundle: $OUT"
echo "Upload: https://play.google.com/console → Sabagiro → Production → Create release"
