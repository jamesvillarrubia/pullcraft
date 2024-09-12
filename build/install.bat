@echo off
setlocal enabledelayedexpansion

set INSTALL_DIR=%USERPROFILE%\AppData\Local\Programs\pullcraft
set REPO=jamesvillarrubia/pullcraft

echo Fetching latest version...
for /f "tokens=*" %%g in ('powershell -Command "(Invoke-WebRequest -Uri https://api.github.com/repos/%REPO%/releases/latest).Content | ConvertFrom-Json | Select -ExpandProperty tag_name"') do (set LATEST_VERSION=%%g)

if "%LATEST_VERSION%"=="" (
    echo Failed to fetch the latest version. Please check your internet connection and try again.
    exit /b 1
)

echo Latest version: %LATEST_VERSION%

echo Downloading PullCraft...
powershell -Command "Invoke-WebRequest -Uri https://github.com/%REPO%/releases/download/%LATEST_VERSION%/pullcraft.exe -OutFile pullcraft.exe"

if not exist pullcraft.exe (
    echo Failed to download PullCraft. Please check your internet connection and try again.
    exit /b 1
)

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

move pullcraft.exe "%INSTALL_DIR%\pullcraft.exe"

echo Adding %INSTALL_DIR% to PATH...
setx PATH "%PATH%;%INSTALL_DIR%"

echo PullCraft has been installed in %INSTALL_DIR%
echo You can now use the 'pullcraft' command to run the application.
echo Please restart your command prompt for the PATH changes to take effect.

echo Verifying installation...
"%INSTALL_DIR%\pullcraft.exe" --version

endlocal