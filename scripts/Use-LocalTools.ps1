# Carregue neste terminal com: . .\scripts\Use-LocalTools.ps1
$projectRoot = Split-Path -Parent $PSScriptRoot
$nodeDirectory = Join-Path $projectRoot '.tools/node-v22.23.0-win-x64'
$localBinDirectory = Join-Path $projectRoot '.tools/bin'
if (-not [IO.File]::Exists((Join-Path $nodeDirectory 'node.exe'))) {
    throw 'Node portátil ausente. Instale Node 22 e pnpm 10.18.3.'
}
$gitDirectory = Join-Path $projectRoot '.tools/git/cmd'
$env:PATH = "$nodeDirectory;$localBinDirectory;$gitDirectory;$env:PATH"