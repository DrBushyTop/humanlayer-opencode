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
# Features:
#   - Downloads .opencode workflow structure from the repository
#   - Interactive model selection for agents (if opencode CLI is available)
#   - Supports primary agents (research, plan) and subagents separately
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
    sed -n '2,31p' "$0" | sed 's/^# //' | sed 's/^#//'
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

# Model placeholders in agent files
MODEL_PRIMARY_PLACEHOLDER="{{MODEL_PRIMARY}}"
MODEL_SUBAGENT_PLACEHOLDER="{{MODEL_SUBAGENT}}"

# Default models (used when opencode is not available or user skips selection)
DEFAULT_MODEL_PRIMARY=""
DEFAULT_MODEL_SUBAGENT=""

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

# Get available models from opencode
get_available_models() {
    if command -v opencode &>/dev/null; then
        opencode models 2>/dev/null | grep -v "^$"
    else
        echo ""
    fi
}

# Check if we can run interactively (either stdin is tty, or /dev/tty exists)
can_interact() {
    [[ -t 0 ]] || [[ -e /dev/tty ]]
}

# Interactive model selection using select
# Args: $1 = prompt, $2 = models (newline separated), $3 = variable name to set
# Note: Uses /dev/tty for input to work even when script is piped via curl
select_model() {
    local prompt="$1"
    local models="$2"
    local varname="$3"
    
    echo ""
    echo "$prompt"
    echo ""
    
    # Convert models to array
    local model_array=()
    while IFS= read -r model; do
        [[ -n "$model" ]] && model_array+=("$model")
    done <<< "$models"
    
    # Add skip option
    model_array+=("[Skip - remove model field from agents]")
    
    # Display numbered menu
    local i=1
    for item in "${model_array[@]}"; do
        echo "  $i) $item"
        ((i++))
    done
    echo ""
    
    # Read selection from /dev/tty to work with curl | bash
    while true; do
        printf "Enter number (1-${#model_array[@]}): "
        local selection
        read selection </dev/tty
        
        if [[ "$selection" =~ ^[0-9]+$ ]] && (( selection >= 1 && selection <= ${#model_array[@]} )); then
            local choice="${model_array[$((selection-1))]}"
            if [[ "$choice" == "[Skip - remove model field from agents]" ]]; then
                eval "$varname=''"
                echo "  → Skipping model selection"
            else
                eval "$varname='$choice'"
                echo "  → Selected: $choice"
            fi
            break
        else
            echo "  Invalid selection. Please enter a number between 1 and ${#model_array[@]}."
        fi
    done
}

# Replace model placeholders in agent files
configure_agent_models() {
    local dest_dir="$1"
    local model_primary="$2"
    local model_subagent="$3"
    
    echo ""
    echo "Configuring agent models..."
    
    # Find all agent markdown files
    local agent_files
    agent_files=$(find "$dest_dir/agent" -name "*.md" 2>/dev/null)
    
    for file in $agent_files; do
        if [[ -f "$file" ]]; then
            local filename=$(basename "$file")
            
            if [[ -n "$model_primary" ]] && grep -q "$MODEL_PRIMARY_PLACEHOLDER" "$file" 2>/dev/null; then
                # Replace primary model placeholder
                if [[ "$(uname)" == "Darwin" ]]; then
                    sed -i '' "s|$MODEL_PRIMARY_PLACEHOLDER|$model_primary|g" "$file"
                else
                    sed -i "s|$MODEL_PRIMARY_PLACEHOLDER|$model_primary|g" "$file"
                fi
                echo "  - $filename: primary model → $model_primary"
            elif [[ -z "$model_primary" ]] && grep -q "$MODEL_PRIMARY_PLACEHOLDER" "$file" 2>/dev/null; then
                # Remove the model line entirely if no model selected
                if [[ "$(uname)" == "Darwin" ]]; then
                    sed -i '' "/model: $MODEL_PRIMARY_PLACEHOLDER/d" "$file"
                else
                    sed -i "/model: $MODEL_PRIMARY_PLACEHOLDER/d" "$file"
                fi
                echo "  - $filename: removed model field"
            fi
            
            if [[ -n "$model_subagent" ]] && grep -q "$MODEL_SUBAGENT_PLACEHOLDER" "$file" 2>/dev/null; then
                # Replace subagent model placeholder
                if [[ "$(uname)" == "Darwin" ]]; then
                    sed -i '' "s|$MODEL_SUBAGENT_PLACEHOLDER|$model_subagent|g" "$file"
                else
                    sed -i "s|$MODEL_SUBAGENT_PLACEHOLDER|$model_subagent|g" "$file"
                fi
                echo "  - $filename: subagent model → $model_subagent"
            elif [[ -z "$model_subagent" ]] && grep -q "$MODEL_SUBAGENT_PLACEHOLDER" "$file" 2>/dev/null; then
                # Remove the model line entirely if no model selected
                if [[ "$(uname)" == "Darwin" ]]; then
                    sed -i '' "/model: $MODEL_SUBAGENT_PLACEHOLDER/d" "$file"
                else
                    sed -i "/model: $MODEL_SUBAGENT_PLACEHOLDER/d" "$file"
                fi
                echo "  - $filename: removed model field"
            fi
        fi
    done
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

# ============================================
# Step 1: Get available models BEFORE downloading files
# (downloading files with placeholders would break opencode)
# ============================================
SELECTED_MODEL_PRIMARY=""
SELECTED_MODEL_SUBAGENT=""
AVAILABLE_MODELS=""

if can_interact; then
    AVAILABLE_MODELS=$(get_available_models)
    
    if [[ -n "$AVAILABLE_MODELS" ]]; then
        echo ""
        echo "============================================"
        echo "Model Selection"
        echo "============================================"
        echo ""
        echo "OpenCode detected. Available models:"
        echo "$AVAILABLE_MODELS" | sed 's/^/  /'
        
        # Select primary agent model
        select_model "Select model for PRIMARY agents (research, plan):" "$AVAILABLE_MODELS" SELECTED_MODEL_PRIMARY
        
        # Ask if user wants same model for subagents
        echo ""
        if [[ -n "$SELECTED_MODEL_PRIMARY" ]]; then
            printf "Use same model for SUBAGENTS? [Y/n]: "
            read same_model </dev/tty
            if [[ "$same_model" =~ ^[Nn] ]]; then
                select_model "Select model for SUBAGENTS (analyzers, locators, pattern-finder):" "$AVAILABLE_MODELS" SELECTED_MODEL_SUBAGENT
            else
                SELECTED_MODEL_SUBAGENT="$SELECTED_MODEL_PRIMARY"
                echo "  → Using same model for subagents: $SELECTED_MODEL_SUBAGENT"
            fi
        else
            printf "Select a model for SUBAGENTS anyway? [y/N]: "
            read select_subagent </dev/tty
            if [[ "$select_subagent" =~ ^[Yy] ]]; then
                select_model "Select model for SUBAGENTS (analyzers, locators, pattern-finder):" "$AVAILABLE_MODELS" SELECTED_MODEL_SUBAGENT
            fi
        fi
        echo ""
    else
        echo ""
        echo "Note: OpenCode not found or no models available."
        echo "Agent files will use default model configuration."
        echo "You can manually set models in ${DEST_DIR}/agent/*.md files after installation."
        echo ""
    fi
else
    # Non-interactive mode (no tty available at all)
    echo ""
    echo "Non-interactive mode detected."
    echo "Agent model placeholders will be removed. You can configure models manually"
    echo "in ${DEST_DIR}/agent/*.md files after installation."
    echo ""
fi

# ============================================
# Step 2: Fetch repository tree and download files
# ============================================

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

# ============================================
# Step 3: Configure agent models with selected values
# ============================================
configure_agent_models "$DEST_DIR" "$SELECTED_MODEL_PRIMARY" "$SELECTED_MODEL_SUBAGENT"

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
if [[ -n "$SELECTED_MODEL_PRIMARY" ]] || [[ -n "$SELECTED_MODEL_SUBAGENT" ]]; then
    echo "Models configured:"
    if [[ -n "$SELECTED_MODEL_PRIMARY" ]]; then
        echo "  Primary agents: ${SELECTED_MODEL_PRIMARY}"
    fi
    if [[ -n "$SELECTED_MODEL_SUBAGENT" ]]; then
        echo "  Subagents:      ${SELECTED_MODEL_SUBAGENT}"
    fi
    echo ""
fi
echo "Next steps:"
echo "  1. Restart OpenCode to load the new commands and agents"
echo "  2. Try /research [topic] to explore your codebase"
echo "  3. Use /plan [feature] to plan your first implementation"
if [[ -z "$SELECTED_MODEL_PRIMARY" ]] && [[ -z "$SELECTED_MODEL_SUBAGENT" ]]; then
    echo "  4. (Optional) Configure agent models in ${DEST_DIR}/agent/*.md"
fi
echo ""
echo "For more information, see: https://github.com/${REPO}"
