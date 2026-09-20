# Convert any Pandoc-supported input → intermediate Markdown → full .rdoc polyglot.
#
# Usage:
#   .\pandoc\pandoc-rdoc.ps1 article.md -o article.rdoc.html
#   .\pandoc\pandoc-rdoc.ps1 paper.tex -o paper.rdoc.html
#   .\pandoc\pandoc-rdoc.ps1 paper.tex -o paper.rdoc.html -Title "My Paper" -Author "Ada"
#   .\pandoc\pandoc-rdoc.ps1 paper.tex -o paper.rdoc.html -PandocArgs @('-f','latex')
#
# Requires: pandoc, node, and dist/cli.js (run npm run build first).

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$InputPath,

  [Alias('o')]
  [string]$Output = 'output.rdoc.html',

  [Alias('t')]
  [string]$Title,

  [Alias('a')]
  [string]$Author,

  [Alias('l')]
  [string]$Lang,

  [Alias('d')]
  [string]$Description,

  # Extra arguments forwarded to pandoc (after fixed -t gfm -L …)
  [string[]]$PandocArgs = @()
)

$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..')
$Filter = Join-Path $Root 'pandoc\rdoc.lua'
$Cli = Join-Path $Root 'dist\cli.js'

if (-not (Get-Command pandoc -ErrorAction SilentlyContinue)) {
  throw 'pandoc not found in PATH'
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'node not found in PATH'
}
if (-not (Test-Path $Cli)) {
  throw "Build CLI first: npm run build ($Cli missing)"
}
if (-not (Test-Path $Filter)) {
  throw "Missing filter: $Filter"
}
if (-not (Test-Path $InputPath)) {
  throw "Input not found: $InputPath"
}

$tmp = [System.IO.Path]::GetTempFileName() + '.md'
try {
  # Step a: pandoc → intermediate GFM Markdown
  $pandocCmd = @(
    $InputPath
    '-t', 'gfm'
    '-L', $Filter
    '-o', $tmp
  ) + $PandocArgs
  & pandoc @pandocCmd
  if ($LASTEXITCODE -ne 0) { throw "pandoc failed with exit $LASTEXITCODE" }

  # Step b: rdoc build → final polyglot
  $rdocArgs = @('build', $tmp, '-o', $Output)
  if ($Title) { $rdocArgs += @('--title', $Title) }
  if ($Author) { $rdocArgs += @('--author', $Author) }
  if ($Lang) { $rdocArgs += @('--lang', $Lang) }
  if ($Description) { $rdocArgs += @('--description', $Description) }

  & node $Cli @rdocArgs
  if ($LASTEXITCODE -ne 0) { throw "rdoc build failed with exit $LASTEXITCODE" }
}
finally {
  if (Test-Path $tmp) { Remove-Item -Force $tmp }
}
]]
