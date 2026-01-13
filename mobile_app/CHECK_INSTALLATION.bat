@echo off
echo ========================================
echo BoneBuddy App - Installation Check
echo ========================================
echo.

echo Checking Flutter installation...
echo.

flutter --version
if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCCESS: Flutter is installed!
    echo.
    echo Running Flutter Doctor to check setup...
    echo.
    flutter doctor
    echo.
    echo ========================================
    echo Next Steps:
    echo ========================================
    echo.
    echo 1. If you see any [✗] marks above, follow the suggestions
    echo 2. For Android development, you need Android Studio
    echo 3. Once ready, run: build_apk.bat
    echo.
    echo Your app is configured for: https://bonebuddy.cloud
    echo.
) else (
    echo.
    echo ❌ Flutter is not installed or not in PATH
    echo.
    echo Please follow these steps:
    echo.
    echo 1. Download Flutter: https://docs.flutter.dev/get-started/install/windows
    echo 2. Extract to C:\flutter
    echo 3. Add C:\flutter\bin to your PATH environment variable
    echo 4. Restart Command Prompt and try again
    echo.
    echo Or run: INSTALL_FLUTTER_NOW.bat for detailed instructions
    echo.
)

pause
