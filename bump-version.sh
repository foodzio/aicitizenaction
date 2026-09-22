#!/bin/bash
# bump-version.sh - Manual version bumping
# Usage: ./bump-version.sh [major|minor|patch]
# Last modified: 2026-08-02

set -euo pipefail
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/bin:/bin:/usr/sbin:/sbin"

VERSION_FILE=".version.json"

if [ ! -f "$VERSION_FILE" ]; then
    echo "Error: $VERSION_FILE not found"
    exit 1
fi

JQ=$(command -v jq 2>/dev/null || true)
if [ "$JQ" != /opt/homebrew/bin/jq ] || ! "$JQ" --version >/dev/null 2>&1; then
    echo "Error: native jq is required. Run: /opt/homebrew/bin/brew install jq" >&2
    exit 1
fi

BUMP_TYPE="${1:-patch}"

MAJOR=$("$JQ" -er '.major | numbers' "$VERSION_FILE")
MINOR=$("$JQ" -er '.minor | numbers' "$VERSION_FILE")
PATCH=$("$JQ" -er '.patch | numbers' "$VERSION_FILE")
BUILD=$("$JQ" -er '.build | numbers' "$VERSION_FILE")

case "$BUMP_TYPE" in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
    *)
        echo "Usage: $0 [major|minor|patch]"
        exit 1
        ;;
esac

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

"$JQ" --argjson major "$MAJOR" \
   --argjson minor "$MINOR" \
   --argjson patch "$PATCH" \
   --arg version "$NEW_VERSION" \
   --arg timestamp "$TIMESTAMP" \
   '.major = $major | .minor = $minor | .patch = $patch | .version = $version | .lastModified = $timestamp' \
   "$VERSION_FILE" > "${VERSION_FILE}.tmp" && mv "${VERSION_FILE}.tmp" "$VERSION_FILE"

echo "Version bumped to $NEW_VERSION"
