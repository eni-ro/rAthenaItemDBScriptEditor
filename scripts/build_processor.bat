@echo off
REM build_processor.bat
cd /d "%~dp0"
echo Building db_processor.exe...
uv run --with pyinstaller --with ruamel.yaml pyinstaller --noconfirm db_processor.spec
if %ERRORLEVEL% neq 0 (
    echo PyInstaller build failed.
    exit /b %ERRORLEVEL%
)

set BIN_DIR=..\src-tauri\binaries
if not exist "%BIN_DIR%" mkdir "%BIN_DIR%"

echo Copying to Tauri binaries...
copy /y dist\db_processor.exe "%BIN_DIR%\db_processor.exe"
copy /y dist\db_processor.exe "%BIN_DIR%\db_processor-x86_64-pc-windows-msvc.exe"

echo Done.
