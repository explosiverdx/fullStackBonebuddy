@echo off
echo ========================================
echo BoneBuddy App - Quick Run Script
echo ========================================
echo.

echo Installing dependencies...
call flutter pub get
if %errorlevel% neq 0 (
    echo [ERROR] Failed to get dependencies
    pause
    exit /b 1
)
echo.

echo Checking for connected devices...
call flutter devices
echo.

echo Starting the app...
echo ✅ Website URL: https://bonebuddy.cloud
echo Press Ctrl+C to stop the app
echo.
call flutter run
pause

