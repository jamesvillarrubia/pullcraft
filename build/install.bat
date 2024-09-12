@echo off

set INSTALL_DIR=%USERPROFILE%\AppData\Local\Programs\pullcraft

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

copy "pullcraft" "%INSTALL_DIR%\pullcraft.exe"

echo Adding %INSTALL_DIR% to PATH...
setx PATH "%PATH%;%INSTALL_DIR%"

echo pullcraft has been installed  in %INSTALL_DIR%
echo You can now use the 'pullcraft' command to run the application.
echo Please restart your command prompt for the PATH changes to take effect.