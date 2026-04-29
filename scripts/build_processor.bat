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

set TARGET_DEBUG=..\src-tauri\target\debug
if exist "%TARGET_DEBUG%" (
    echo Copying to target\debug...
    copy /y dist\db_processor.exe "%TARGET_DEBUG%\db_processor.exe"
)

set TARGET_RELEASE=..\src-tauri\target\release
if exist "%TARGET_RELEASE%" (
    echo Copying to target\release...
    copy /y dist\db_processor.exe "%TARGET_RELEASE%\db_processor.exe"
)

echo Done.
