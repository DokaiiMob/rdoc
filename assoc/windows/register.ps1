# Register .rdoc → rdoc open (HKCU, no admin)
$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$Node = (Get-Command node).Source
$Cli = Join-Path $Root 'dist\cli.js'
if (-not (Test-Path $Cli)) { throw "Build CLI first: npm run build ($Cli missing)" }

$Prog = 'rdoc.Document'
$Cmd = "`"$Node`" `"$Cli`" open `"%1`""

New-Item -Path "HKCU:\Software\Classes\.rdoc" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\Software\Classes\.rdoc" -Name '(default)' -Value $Prog
Set-ItemProperty -Path "HKCU:\Software\Classes\.rdoc" -Name 'Content Type' -Value 'application/vnd.rdoc+html'

New-Item -Path "HKCU:\Software\Classes\$Prog" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\Software\Classes\$Prog" -Name '(default)' -Value 'Responsive Document'
New-Item -Path "HKCU:\Software\Classes\$Prog\shell\open\command" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\Software\Classes\$Prog\shell\open\command" -Name '(default)' -Value $Cmd

Write-Host "Registered .rdoc -> $Cmd"
