<# 
.SYNOPSIS
  Initialize repository with HumanLayer .opencode workflow structure (PowerShell).

.DESCRIPTION
  Downloads the .opencode workflow structure from the humanlayer-opencode repository.
  If OpenCode CLI is installed, optionally prompts for primary/subagent model selection.

.PARAMETER Branch
  Git branch to fetch from (default: master).

.PARAMETER DestDir
  Destination directory (default: .opencode).

.EXAMPLE
  pwsh -NoProfile -ExecutionPolicy Bypass -File .\init-hl-repo.ps1

.EXAMPLE
  pwsh -NoProfile -ExecutionPolicy Bypass -File .\init-hl-repo.ps1 -Branch main -DestDir .opencode

.EXAMPLE
  iwr -useb https://raw.githubusercontent.com/DrBushyTop/humanlayer-opencode/master/init-hl-repo.ps1 -OutFile init-hl-repo.ps1
  pwsh -NoProfile -ExecutionPolicy Bypass -File .\init-hl-repo.ps1 -Branch main
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory = $false)]
  [string]$Branch = "master",

  [Parameter(Mandatory = $false)]
  [string]$DestDir = ".opencode"
)

$ErrorActionPreference = "Stop"

$Repo = "DrBushyTop/humanlayer-opencode"
$ExcludePatterns = @(
  "node_modules/",
  "bun.lock",
  "package.json"
)

$ModelPrimaryPlaceholder = "{{MODEL_PRIMARY}}"
$ModelSubagentPlaceholder = "{{MODEL_SUBAGENT}}"

function Write-Info([string]$Message) {
  Write-Host $Message
}

function Test-ExcludedPath([string]$Path) {
  foreach ($pattern in $ExcludePatterns) {
    if ($Path -like "*$pattern*") { return $true }
  }
  return $false
}

function Get-AvailableModels {
  $cmd = Get-Command opencode -ErrorAction SilentlyContinue
  if (-not $cmd) { return @() }
  try {
    $out = & opencode models 2>$null
    if (-not $out) { return @() }
    return ($out -split "`r?`n") | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
  }
  catch {
    return @()
  }
}

function Test-InteractiveSession {
  try {
    if ($Host.Name -ne "ConsoleHost") { return $false }
    if ([Console]::IsInputRedirected) { return $false }
    return $true
  }
  catch {
    return $false
  }
}

function Select-Model([string]$Prompt, [string[]]$Models) {
  $menu = @()
  $menu += $Models
  $menu += "[Skip - remove model field from agents]"

  Write-Host ""
  Write-Host $Prompt
  Write-Host ""

  for ($i = 0; $i -lt $menu.Count; $i++) {
    Write-Host ("  {0}) {1}" -f ($i + 1), $menu[$i])
  }
  Write-Host ""

  while ($true) {
    $selection = Read-Host ("Enter number (1-{0})" -f $menu.Count)
    $n = 0
    if ([int]::TryParse($selection, [ref]$n) -and $n -ge 1 -and $n -le $menu.Count) {
      $choice = $menu[$n - 1]
      if ($choice -eq "[Skip - remove model field from agents]") {
        Write-Host "  → Skipping model selection"
        return ""
      }
      Write-Host ("  → Selected: {0}" -f $choice)
      return $choice
    }

    Write-Host ("  Invalid selection. Please enter a number between 1 and {0}." -f $menu.Count)
  }
}

function Update-ModelPlaceholders {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Lines,

    [Parameter(Mandatory = $true)]
    [string]$Placeholder,

    [Parameter(Mandatory = $false)]
    [string]$SelectedModel
  )

  if ($SelectedModel) {
    return $Lines | ForEach-Object { $_.Replace($Placeholder, $SelectedModel) }
  }

  $pattern = "^\s*model:\s*{0}\s*$" -f [Regex]::Escape($Placeholder)
  return $Lines | Where-Object { $_ -notmatch $pattern }
}

function Set-AgentModels([string]$DestDir, [string]$ModelPrimary, [string]$ModelSubagent) {
  Write-Host ""
  Write-Host "Configuring agent models..."

  $agentDir = Join-Path $DestDir "agent"
  if (-not (Test-Path -LiteralPath $agentDir)) { return }

  $files = Get-ChildItem -LiteralPath $agentDir -Recurse -Filter "*.md" -File -ErrorAction SilentlyContinue
  foreach ($file in $files) {
    $lines = Get-Content -LiteralPath $file.FullName -ErrorAction SilentlyContinue
    if (-not $lines) { continue }

    $original = $lines
    $updated = $lines

    if ($updated -join "`n" -like "*$ModelPrimaryPlaceholder*") {
      $updated = Update-ModelPlaceholders -Lines $updated -Placeholder $ModelPrimaryPlaceholder -SelectedModel $ModelPrimary
    }
    if ($updated -join "`n" -like "*$ModelSubagentPlaceholder*") {
      $updated = Update-ModelPlaceholders -Lines $updated -Placeholder $ModelSubagentPlaceholder -SelectedModel $ModelSubagent
    }

    $changed = ($updated.Count -ne $original.Count) -or ((Compare-Object -ReferenceObject $original -DifferenceObject $updated -SyncWindow 0).Count -gt 0)
    if ($changed) {
      Set-Content -LiteralPath $file.FullName -Value $updated -Encoding UTF8

      if ($ModelPrimary -and ($original -join "`n" -like "*$ModelPrimaryPlaceholder*")) {
        Write-Host ("  - {0}: primary model → {1}" -f $file.Name, $ModelPrimary)
      }
      elseif (-not $ModelPrimary -and ($original -join "`n" -like "*$ModelPrimaryPlaceholder*")) {
        Write-Host ("  - {0}: removed model field" -f $file.Name)
      }

      if ($ModelSubagent -and ($original -join "`n" -like "*$ModelSubagentPlaceholder*")) {
        Write-Host ("  - {0}: subagent model → {1}" -f $file.Name, $ModelSubagent)
      }
      elseif (-not $ModelSubagent -and ($original -join "`n" -like "*$ModelSubagentPlaceholder*")) {
        Write-Host ("  - {0}: removed model field" -f $file.Name)
      }
    }
  }
}

function Invoke-GitHubJson([string]$Uri) {
  $headers = @{
    "User-Agent" = "humanlayer-opencode-init"
    "Accept"     = "application/vnd.github+json"
  }
  return Invoke-RestMethod -Method Get -Uri $Uri -Headers $headers
}

function Invoke-DownloadFile([string]$Uri, [string]$LocalPath) {
  $headers = @{
    "User-Agent" = "humanlayer-opencode-init"
  }

  $parent = Split-Path -Parent $LocalPath
  if ($parent -and -not (Test-Path -LiteralPath $parent)) {
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
  }

  Invoke-WebRequest -Uri $Uri -OutFile $LocalPath -Headers $headers -UseBasicParsing | Out-Null
}

Write-Info "Initializing HumanLayer .opencode workflow structure..."
Write-Info ("Fetching from: github.com/{0} (branch: {1})" -f $Repo, $Branch)

# ============================================
# Step 1: Get available models BEFORE downloading files
# ============================================
$SelectedModelPrimary = ""
$SelectedModelSubagent = ""

if (Test-InteractiveSession) {
  $availableModels = Get-AvailableModels
  if ($availableModels.Count -gt 0) {
    Write-Host ""
    Write-Host "============================================"
    Write-Host "Model Selection"
    Write-Host "============================================"
    Write-Host ""
    Write-Host "OpenCode detected. Available models:"
    $availableModels | ForEach-Object { Write-Host ("  {0}" -f $_) }

    $SelectedModelPrimary = Select-Model -Prompt "Select model for PRIMARY agents (research, plan, complex tasks...):" -Models $availableModels

    Write-Host ""
    if ($SelectedModelPrimary) {
      $sameModel = Read-Host "Use same model for SUBAGENTS? [Y/n]"
      if ($sameModel -match "^[Nn]") {
        $SelectedModelSubagent = Select-Model -Prompt "Select model for SUBAGENTS (analyzers, locators, pattern-finder, simple tasks...):" -Models $availableModels
      }
      else {
        $SelectedModelSubagent = $SelectedModelPrimary
        Write-Host ("  → Using same model for subagents: {0}" -f $SelectedModelSubagent)
      }
    }
    else {
      $selectSubagent = Read-Host "Select a model for SUBAGENTS anyway? [y/N]"
      if ($selectSubagent -match "^[Yy]") {
        $SelectedModelSubagent = Select-Model -Prompt "Select model for SUBAGENTS (analyzers, locators, pattern-finder):" -Models $availableModels
      }
    }
    Write-Host ""
  }
  else {
    Write-Host ""
    Write-Host "Note: OpenCode not found or no models available."
    Write-Host "Agent files will use default model configuration."
    Write-Host ("You can manually set models in {0}\agent\*.md files after installation." -f $DestDir)
    Write-Host ""
  }
}
else {
  Write-Host ""
  Write-Host "Non-interactive mode detected."
  Write-Host "Agent model placeholders will be removed. You can configure models manually"
  Write-Host ("in {0}\agent\*.md files after installation." -f $DestDir)
  Write-Host ""
}

# ============================================
# Step 2: Fetch repository tree and download files
# ============================================
Write-Info "Getting repository tree..."
$treeUrl = "https://api.github.com/repos/{0}/git/trees/{1}?recursive=1" -f $Repo, $Branch

$treeJson = $null
try {
  $treeJson = Invoke-GitHubJson -Uri $treeUrl
}
catch {
  throw "Error: Could not fetch repository tree. Check branch name and repository access."
}

if (-not $treeJson -or -not $treeJson.tree) {
  throw "Error: Could not fetch repository tree. Check branch name and repository access."
}

Write-Info "Parsing file list..."
$files = @(
  $treeJson.tree |
  Where-Object { $_.type -eq "blob" -and $_.path -like ".opencode/*" } |
  Select-Object -ExpandProperty path
)

if (-not $files -or $files.Count -eq 0) {
  throw "Error: No files found in .opencode directory"
}

$totalFiles = 0
foreach ($f in $files) {
  if (-not (Test-ExcludedPath $f)) { $totalFiles++ }
}

Write-Info ("Found {0} files to download" -f $totalFiles)
Write-Host ""

$downloaded = 0
$failed = 0
$rawBase = "https://raw.githubusercontent.com/{0}/{1}" -f $Repo, $Branch

foreach ($f in $files) {
  if (Test-ExcludedPath $f) { continue }

  $relative = $f.Substring(".opencode".Length).TrimStart("/")
  $localPath = Join-Path $DestDir $relative

  Write-Host ("  - {0}" -f $relative)

  try {
    Invoke-DownloadFile -Uri ("{0}/{1}" -f $rawBase, $f) -LocalPath $localPath
    $downloaded++
  }
  catch {
    Write-Host "    Warning: Failed to download"
    $failed++
  }
}

# ============================================
# Step 3: Configure agent models with selected values
# ============================================
Set-AgentModels -DestDir $DestDir -ModelPrimary $SelectedModelPrimary -ModelSubagent $SelectedModelSubagent

# Create .gitkeep files for empty directories
Write-Host ""
Write-Host "Creating .gitkeep files for thoughts directories..."
$dirs = @(
  (Join-Path $DestDir "thoughts/research"),
  (Join-Path $DestDir "thoughts/plans"),
  (Join-Path $DestDir "thoughts/shared/handoffs/general")
)
foreach ($d in $dirs) { New-Item -ItemType Directory -Force -Path $d | Out-Null }

$gitkeeps = @(
  (Join-Path $DestDir "thoughts/research/.gitkeep"),
  (Join-Path $DestDir "thoughts/plans/.gitkeep"),
  (Join-Path $DestDir "thoughts/shared/handoffs/.gitkeep"),
  (Join-Path $DestDir "thoughts/shared/handoffs/general/.gitkeep")
)
foreach ($g in $gitkeeps) { New-Item -ItemType File -Force -Path $g | Out-Null }

Write-Host ""
Write-Host "============================================"
Write-Host "HumanLayer .opencode workflow initialized!"
Write-Host "============================================"
Write-Host ""
Write-Host ("Downloaded: {0}" -f $downloaded)
if ($failed -gt 0) { Write-Host ("Failed: {0}" -f $failed) }
Write-Host ""
Write-Host ("Structure created in: {0}/" -f $DestDir)
Write-Host ""
if ($SelectedModelPrimary -or $SelectedModelSubagent) {
  Write-Host "Models configured:"
  if ($SelectedModelPrimary) { Write-Host ("  Primary agents: {0}" -f $SelectedModelPrimary) }
  if ($SelectedModelSubagent) { Write-Host ("  Subagents:      {0}" -f $SelectedModelSubagent) }
  Write-Host ""
}
Write-Host "Next steps:"
Write-Host "  1. Restart OpenCode to load the new commands and agents"
Write-Host "  2. Try /research [topic] to explore your codebase"
Write-Host "  3. Use /plan [feature] to plan your first implementation"
if (-not $SelectedModelPrimary -and -not $SelectedModelSubagent) {
  Write-Host ("  4. (Optional) Configure agent models in {0}\agent\*.md" -f $DestDir)
}
Write-Host ""
Write-Host ("For more information, see: https://github.com/{0}" -f $Repo)

