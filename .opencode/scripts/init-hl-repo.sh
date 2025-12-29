#!/bin/bash
# Initialize repository with HumanLayer .opencode workflow structure
# Fetches the .opencode folder from the humanlayer-opencode repository
#
# Usage:
#   ./init-hl-repo.sh [branch] [dest-dir]
#
# Arguments:
#   branch    - Git branch to fetch from (default: master)
#   dest-dir  - Destination directory (default: .opencode)
#
# Examples:
#   # Initialize with defaults (master branch, .opencode directory)
#   ./init-hl-repo.sh
#
#   # Use a specific branch
#   ./init-hl-repo.sh main
#
#   # Use specific branch and custom directory
#   ./init-hl-repo.sh main my-opencode
#
#   # One-liner installation (curl)
#   curl -fsSL https://raw.githubusercontent.com/DrBushyTop/humanlayer-opencode/master/.opencode/scripts/init-hl-repo.sh | bash
#
#   # One-liner with specific branch
#   curl -fsSL https://raw.githubusercontent.com/DrBushyTop/humanlayer-opencode/master/.opencode/scripts/init-hl-repo.sh | bash -s -- main

set -e

# Show help if requested
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    sed -n '2,27p' "$0" | sed 's/^# //' | sed 's/^#//'
    exit 0
fi

BRANCH="${1:-master}"
DEST_DIR="${2:-.opencode}"
REPO="DrBushyTop/humanlayer-opencode"
SOURCE_PREFIX=".opencode"

# Patterns to exclude from download
EXCLUDE_PATTERNS=(
    "node_modules/"
    "bun.lock"
    "package.json"
)

# Check if a path should be excluded
should_exclude() {
    local path="$1"
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        if [[ "$path" == *"$pattern"* ]]; then
            return 0
        fi
    done
    return 1
}

# Fetch a file using available tools
fetch_url() {
    local url="$1"
    if command -v curl &>/dev/null; then
        curl -fsSL "$url" 2>/dev/null
    elif command -v wget &>/dev/null; then
        wget -qO- "$url" 2>/dev/null
    elif command -v pwsh &>/dev/null; then
        pwsh -Command "(Invoke-WebRequest -Uri '$url').Content" 2>/dev/null
    else
        echo "Error: No suitable download tool found (curl, wget, or pwsh required)" >&2
        exit 1
    fi
}

# Download a file to local path
download_file() {
    local url="$1"
    local local_path="$2"
    
    mkdir -p "$(dirname "$local_path")"
    
    if command -v curl &>/dev/null; then
        curl -fsSL "$url" -o "$local_path" 2>/dev/null && return 0
    elif command -v wget &>/dev/null; then
        wget -q "$url" -O "$local_path" 2>/dev/null && return 0
    elif command -v pwsh &>/dev/null; then
        pwsh -Command "Invoke-WebRequest -Uri '$url' -OutFile '$local_path'" 2>/dev/null && return 0
    fi
    
    return 1
}

# Parse JSON to extract file paths (simple grep-based parser for portability)
# Works with GitHub's tree API response - only extracts blobs (files), not trees (directories)
parse_tree_paths() {
    local json="$1"
    # Extract entries that are blobs (files) from .opencode directory
    # The API returns: {"path": "...", "mode": "...", "type": "blob", ...}
    # We need to match lines that have type "blob" and extract their paths
    echo "$json" | tr ',' '\n' | grep -B5 '"type"[[:space:]]*:[[:space:]]*"blob"' | \
        grep '"path"' | grep -oE '"path"[[:space:]]*:[[:space:]]*"[^"]*"' | \
        sed 's/"path"[[:space:]]*:[[:space:]]*"//;s/"$//' | \
        while read -r path; do
            # Only include files from .opencode directory
            if [[ "$path" == .opencode/* ]]; then
                echo "$path"
            fi
        done
}

# Main script
echo "Initializing HumanLayer .opencode workflow structure..."
echo "Fetching from: github.com/${REPO} (branch: ${BRANCH})"

# Get the tree SHA for the branch
echo "Getting repository tree..."
TREE_URL="https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1"
TREE_JSON=$(fetch_url "$TREE_URL")

if [[ -z "$TREE_JSON" ]] || [[ "$TREE_JSON" == *"Not Found"* ]]; then
    echo "Error: Could not fetch repository tree. Check branch name and repository access." >&2
    exit 1
fi

# Extract file paths from the tree
echo "Parsing file list..."
FILES=$(parse_tree_paths "$TREE_JSON")

if [[ -z "$FILES" ]]; then
    echo "Error: No files found in .opencode directory" >&2
    exit 1
fi

# Count files (excluding filtered ones)
TOTAL_FILES=0
while IFS= read -r file; do
    if ! should_exclude "$file"; then
        ((TOTAL_FILES++)) || true
    fi
done <<< "$FILES"

echo "Found ${TOTAL_FILES} files to download"
echo ""

# Download each file
DOWNLOADED=0
FAILED=0
RAW_BASE="https://raw.githubusercontent.com/${REPO}/${BRANCH}"

while IFS= read -r file; do
    # Skip excluded patterns
    if should_exclude "$file"; then
        continue
    fi
    
    # Calculate local path (replace .opencode with destination dir)
    local_path="${file/#.opencode/$DEST_DIR}"
    
    echo "  - ${file#.opencode/}"
    
    if download_file "${RAW_BASE}/${file}" "$local_path"; then
        ((DOWNLOADED++)) || true
    else
        echo "    Warning: Failed to download"
        ((FAILED++)) || true
    fi
done <<< "$FILES"

# Make scripts executable
chmod +x "${DEST_DIR}/scripts/"*.sh 2>/dev/null || true

# Create .gitkeep files for empty directories
echo ""
echo "Creating .gitkeep files for thoughts directories..."
mkdir -p "${DEST_DIR}/thoughts/research"
mkdir -p "${DEST_DIR}/thoughts/plans"
mkdir -p "${DEST_DIR}/thoughts/shared/handoffs/general"
touch "${DEST_DIR}/thoughts/research/.gitkeep"
touch "${DEST_DIR}/thoughts/plans/.gitkeep"
touch "${DEST_DIR}/thoughts/shared/handoffs/.gitkeep"
touch "${DEST_DIR}/thoughts/shared/handoffs/general/.gitkeep"

echo ""
echo "============================================"
echo "HumanLayer .opencode workflow initialized!"
echo "============================================"
echo ""
echo "Downloaded: ${DOWNLOADED} files"
if [[ $FAILED -gt 0 ]]; then
    echo "Failed: ${FAILED} files"
fi
echo ""
echo "Structure created in: ${DEST_DIR}/"
echo ""
echo "Next steps:"
echo "  1. Restart OpenCode to load the new commands and agents"
echo "  2. Try /research [topic] to explore your codebase"
echo "  3. Use /plan [feature] to plan your first implementation"
echo ""
echo "For more information, see: https://github.com/${REPO}"
