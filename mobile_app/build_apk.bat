@echo off
echo ========================================
echo BoneBuddy App - Build Release APK
echo ========================================
echo.

echo This will create a release APK that you can install on any Android device.
echo.
pause

echo Cleaning previous builds...
call flutter clean
echo.

echo Getting dependencies...
call flutter pub get
echo.

echo Building APK (this may take a few minutes)...
call flutter build apk --release
echo.

if %errorlevel% equ 0 (
    echo ========================================
    echo Build Successful!
    echo ========================================
    echo.
    echo APK Location:
    echo %cd%\build\app\outputs\flutter-apk\app-release.apk
    echo.
    echo You can now transfer this APK to any Android device and install it.
    echo.
) else (
    echo ========================================
    echo Build Failed!
    echo ========================================
    echo Please check the error messages above.
    echo.
)

pause

