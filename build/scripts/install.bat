@echo off
setlocal enabledelayedexpansion

set "INSTALL_DIR=%ProgramFiles%"

:: Read repository information from package.json
for /f "tokens=*" %%i in ('node -p "require('./package.json').repository.url.match(/github.com\/(.+?)(?:\.git)?$/)[1]"') do set REPO=%%i

if "%REPO%"=="" (
    echo Error: Unable to determine repository from package.json
    exit /b 1
)

:: Read binary name from package.json
for /f "tokens=*" %%i in ('node -p "Object.keys(require('./package.json').bin)[0]"') do set BIN_NAME=%%i

if "%BIN_NAME%"=="" (
    echo Error: Unable to determine binary name from package.json
    exit /b 1
)

:: Determine architecture
if "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
    set "ARCH=x64"
) else if "%PROCESSOR_ARCHITECTURE%"=="ARM64" (
    set "ARCH=arm64"
) else (
    echo Unsupported architecture: %PROCESSOR_ARCHITECTURE%
    exit /b 1
)

:: Get the latest release version
for /f "tokens=*" %%i in ('powershell -Command "(Invoke-RestMethod https://api.github.com/repos/%REPO%/releases/latest).tag_name"') do set LATEST_VERSION=%%i

if "%LATEST_VERSION%"=="" (
    echo Failed to fetch the latest version. Please check your internet connection and try again.
    exit /b 1
)

echo Latest version: %LATEST_VERSION%
echo Detected Architecture: %ARCH%
echo Binary name: %BIN_NAME%

:: Download the latest release
set "BINARY_NAME=%BIN_NAME%-win-%ARCH%.exe"
set "DOWNLOAD_URL=https://github.com/%REPO%/releases/download/%LATEST_VERSION%/%BINARY_NAME%"
echo Downloading %BIN_NAME% from %DOWNLOAD_URL%...

powershell -Command "Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile '%BIN_NAME%.exe'"

if %ERRORLEVEL% neq 0 (
    echo Failed to download %BIN_NAME%. Please check your internet connection and try again.
    exit /b 1
)

:: Move the binary to the installation directory
move /Y "%BIN_NAME%.exe" "%INSTALL_DIR%\%BIN_NAME%.exe"

if %ERRORLEVEL% neq 0 (
    echo Failed to move %BIN_NAME% to %INSTALL_DIR%. Please run this script as administrator and try again.
    exit /b 1
)

echo %BIN_NAME% has been installed successfully in %INSTALL_DIR%
echo You can now use the '%BIN_NAME%' command to run the application.

:: Add the installation directory to PATH if it's not already there
for /f "tokens=*" %%i in ('powershell -Command "[Environment]::GetEnvironmentVariable('PATH', 'Machine').Contains('%INSTALL_DIR%')"') do set PATH_CHECK=%%i

if "%PATH_CHECK%"=="False" (
    powershell -Command "[Environment]::SetEnvironmentVariable('PATH', [Environment]::GetEnvironmentVariable('PATH', 'Machine') + ';%INSTALL_DIR%', 'Machine')"
    echo Added %INSTALL_DIR% to the system PATH.
    echo Please restart your command prompt for the changes to take effect.
)

:: Verify the installation
%BIN_NAME% --version

endlocal