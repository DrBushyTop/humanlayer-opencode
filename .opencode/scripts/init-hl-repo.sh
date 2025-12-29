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

# Get repository URL from git remote, convert to raw GitHub URL
get_raw_base_url() {
    local origin_url
    origin_url=$(git remote get-url origin 2>/dev/null) || {
        echo "Error: Not a git repository or no origin remote found" >&2
        exit 1
    }
    
    # Convert git URL to raw GitHub URL
    # Handle both SSH and HTTPS formats
    local repo_path
    if [[ "$origin_url" == git@github.com:* ]]; then
        repo_path="${origin_url#git@github.com:}"
    elif [[ "$origin_url" == https://github.com/* ]]; then
        repo_path="${origin_url#https://github.com/}"
    else
        echo "Error: Only GitHub repositories are supported" >&2
        exit 1
    fi
    
    # Remove .git suffix if present
    repo_path="${repo_path%.git}"
    
    echo "https://raw.githubusercontent.com/${repo_path}/${BRANCH}"
}

# Fetch a file from the repository
fetch_file() {
    local remote_path="$1"
    local local_path="$2"
    local url="${BASE_URL}/${remote_path}"
    
    mkdir -p "$(dirname "$local_path")"
    
    if command -v curl &>/dev/null; then
        curl -fsSL "$url" -o "$local_path" 2>/dev/null && return 0
    elif command -v pwsh &>/dev/null; then
        pwsh -Command "Invoke-WebRequest -Uri '$url' -OutFile '$local_path'" 2>/dev/null && return 0
    elif command -v wget &>/dev/null; then
        wget -q "$url" -O "$local_path" 2>/dev/null && return 0
    else
        echo "Error: No suitable download tool found (curl, pwsh, or wget required)" >&2
        exit 1
    fi
    
    return 1
}

# Main script
echo "Initializing HumanLayer .opencode workflow structure..."

# Check if we're using the humanlayer-opencode repo or need to specify it
if git remote get-url origin 2>/dev/null | grep -q "humanlayer-opencode"; then
    BASE_URL=$(get_raw_base_url)
    SOURCE_PREFIX=".opencode"
else
    # Default to the humanlayer-opencode repository
    BASE_URL="https://raw.githubusercontent.com/DrBushyTop/humanlayer-opencode/${BRANCH}"
    SOURCE_PREFIX=".opencode"
fi

echo "Fetching from: ${BASE_URL}/${SOURCE_PREFIX}"

# Create directory structure
echo "Creating directory structure..."
mkdir -p "${DEST_DIR}/agent/subagents/research"
mkdir -p "${DEST_DIR}/agent/subagents/thoughts"
mkdir -p "${DEST_DIR}/command"
mkdir -p "${DEST_DIR}/scripts"
mkdir -p "${DEST_DIR}/thoughts/research"
mkdir -p "${DEST_DIR}/thoughts/plans"
mkdir -p "${DEST_DIR}/thoughts/shared/handoffs/general"

# Files to fetch
AGENT_RESEARCH_FILES=(
    "codebase-locator.md"
    "codebase-analyzer.md"
    "pattern-finder.md"
)

AGENT_THOUGHTS_FILES=(
    "thoughts-locator.md"
    "thoughts-analyzer.md"
)

COMMAND_FILES=(
    "research.md"
    "plan.md"
    "implement.md"
    "iterate.md"
    "validate.md"
    "handoff.md"
    "resume.md"
)

SCRIPT_FILES=(
    "spec_metadata.sh"
)

ROOT_FILES=(
    "README.md"
    ".gitignore"
)

# Fetch agent files
echo "Fetching agent files..."
for file in "${AGENT_RESEARCH_FILES[@]}"; do
    echo "  - agent/subagents/research/${file}"
    fetch_file "${SOURCE_PREFIX}/agent/subagents/research/${file}" "${DEST_DIR}/agent/subagents/research/${file}" || \
        echo "    Warning: Could not fetch ${file}"
done

for file in "${AGENT_THOUGHTS_FILES[@]}"; do
    echo "  - agent/subagents/thoughts/${file}"
    fetch_file "${SOURCE_PREFIX}/agent/subagents/thoughts/${file}" "${DEST_DIR}/agent/subagents/thoughts/${file}" || \
        echo "    Warning: Could not fetch ${file}"
done

# Fetch command files
echo "Fetching command files..."
for file in "${COMMAND_FILES[@]}"; do
    echo "  - command/${file}"
    fetch_file "${SOURCE_PREFIX}/command/${file}" "${DEST_DIR}/command/${file}" || \
        echo "    Warning: Could not fetch ${file}"
done

# Fetch script files
echo "Fetching script files..."
for file in "${SCRIPT_FILES[@]}"; do
    echo "  - scripts/${file}"
    fetch_file "${SOURCE_PREFIX}/scripts/${file}" "${DEST_DIR}/scripts/${file}" || \
        echo "    Warning: Could not fetch ${file}"
done

# Make scripts executable
chmod +x "${DEST_DIR}/scripts/"*.sh 2>/dev/null || true

# Fetch root files
echo "Fetching root files..."
for file in "${ROOT_FILES[@]}"; do
    echo "  - ${file}"
    fetch_file "${SOURCE_PREFIX}/${file}" "${DEST_DIR}/${file}" || \
        echo "    Warning: Could not fetch ${file}"
done

# Create .gitkeep files for empty directories
echo "Creating .gitkeep files..."
touch "${DEST_DIR}/thoughts/research/.gitkeep"
touch "${DEST_DIR}/thoughts/plans/.gitkeep"
touch "${DEST_DIR}/thoughts/shared/handoffs/.gitkeep"
touch "${DEST_DIR}/thoughts/shared/handoffs/general/.gitkeep"

echo ""
echo "HumanLayer .opencode workflow initialized successfully!"
echo ""
echo "Structure created:"
echo "  ${DEST_DIR}/"
echo "  ├── agent/subagents/"
echo "  │   ├── research/    # Research subagents"
echo "  │   └── thoughts/    # Thoughts management subagents"
echo "  ├── command/         # Slash commands"
echo "  ├── scripts/         # Utility scripts"
echo "  └── thoughts/        # Persistent artifacts"
echo ""
echo "Next steps:"
echo "  1. Review ${DEST_DIR}/README.md for usage guide"
echo "  2. Try /research [topic] to explore your codebase"
echo "  3. Use /plan [feature] to plan your first implementation"
