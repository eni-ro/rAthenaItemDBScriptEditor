# build_processor.ps1
# プリプロセッサ (db_processor.py) を exe 化して Tauri のバイナリディレクトリに配置するスクリプト

$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot = Split-Path -Parent $PSScriptRoot

$SourcePath = Join-Path $PSScriptRoot "db_processor.py"
$SpecPath = Join-Path $PSScriptRoot "db_processor.spec"
$DistDir = Join-Path $PSScriptRoot "dist"
$TauriBinDir = Join-Path $ProjectRoot "src-tauri" "binaries"

# 1. PyInstaller でビルド
Write-Host "Building db_processor.exe with PyInstaller..." -ForegroundColor Cyan
Set-Location $PSScriptRoot
uv run pyinstaller --noconfirm $SpecPath

if ($LASTEXITCODE -ne 0) {
    Write-Error "PyInstaller build failed."
    exit $LASTEXITCODE
}

# 2. バイナリディレクトリの準備
if (!(Test-Path $TauriBinDir)) {
    New-Item -ItemType Directory -Path $TauriBinDir | Out-Null
}

# 3. ファイルのコピー
$ExeSource = Join-Path $DistDir "db_processor.exe"
$ExeDest = Join-Path $TauriBinDir "db_processor.exe"

Write-Host "Copying $ExeSource to $ExeDest..." -ForegroundColor Cyan
Copy-Item -Path $ExeSource -Destination $ExeDest -Force

# Tauri のサイドカー命名規則 (x86_64-pc-windows-msvc) に合わせたコピーも作成
# (現在の lib.rs では db_processor.exe を直接探しているが、ビルド/バンドル時に必要になる場合がある)
$SidecarDest = Join-Path $TauriBinDir "db_processor-x86_64-pc-windows-msvc.exe"
Write-Host "Creating sidecar naming copy: $SidecarDest" -ForegroundColor Cyan
Copy-Item -Path $ExeSource -Destination $SidecarDest -Force

Write-Host "Build and placement complete!" -ForegroundColor Green
