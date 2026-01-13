@echo off
echo ========================================
echo BoneBuddy App - Setup Verification
echo ========================================
echo.

echo Checking Flutter installation...
flutter --version
if %errorlevel% neq 0 (
    echo [ERROR] Flutter is not installed or not in PATH
    echo Please install Flutter from: https://docs.flutter.dev/get-started/install/windows
    pause
    exit /b 1
) else (
    echo [OK] Flutter is installed
)
echo.

echo Checking Java installation...
java -version
if %errorlevel% neq 0 (
    echo [WARNING] Java is not installed or not in PATH
    echo Android development requires JDK 11 or higher
) else (
    echo [OK] Java is installed
)
echo.

echo Running Flutter Doctor...
echo This will check your Flutter environment...
echo.
flutter doctor
echo.

echo ========================================
echo Checking for connected devices...
echo ========================================
flutter devices
echo.

echo ========================================
echo Setup Check Complete!
echo ========================================
echo.
echo Next Steps:
echo ✅ Website URL already configured: https://bonebuddy.cloud
echo 1. Run: flutter pub get
echo 2. Run: flutter run (to test)
echo 3. Run: build_apk.bat (to create installable APK)
echo.
pause

