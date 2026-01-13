@echo off
echo ========================================
echo BoneBuddy App - Flutter Installation
echo ========================================
echo.

echo Step 1: Download Flutter SDK
echo ==============================
echo.
echo Please download Flutter from one of these links:
echo.
echo Option 1 (Recommended): 
echo https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.24.5-stable.zip
echo.
echo Option 2 (Official page):
echo https://docs.flutter.dev/get-started/install/windows
echo.
echo File size: ~1.5GB
echo.
pause

echo.
echo Step 2: Extract Flutter
echo =======================
echo.
echo 1. After download completes, extract the ZIP file
echo 2. Extract to: C:\flutter (recommended)
echo 3. You should have: C:\flutter\bin\flutter.bat
echo.
echo IMPORTANT: Do NOT extract to folders with spaces!
echo ✅ Good: C:\flutter
echo ❌ Bad: C:\Program Files\flutter
echo.
pause

echo.
echo Step 3: Add Flutter to PATH
echo ===========================
echo.
echo 1. Press Win + X (or search "Environment Variables")
echo 2. Click "Edit the system environment variables"
echo 3. Click "Environment Variables..." button
echo 4. Under "User variables", find "Path" and click "Edit..."
echo 5. Click "New"
echo 6. Add: C:\flutter\bin
echo 7. Click "OK" on all windows
echo.
pause

echo.
echo Step 4: Restart Command Prompt
echo ==============================
echo.
echo IMPORTANT: Close this window and open a NEW Command Prompt
echo Then run: flutter --version
echo.
echo If you see Flutter version info, installation was successful!
echo.
pause

echo.
echo Step 5: Install Android Studio (Optional but Recommended)
echo ========================================================
echo.
echo Download from: https://developer.android.com/studio
echo This provides Android SDK and emulator for testing.
echo.
echo After installing everything, come back and run:
echo   setup_check.bat
echo.
pause

echo.
echo ========================================
echo Installation Guide Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Download Flutter (link above)
echo 2. Extract to C:\flutter
echo 3. Add C:\flutter\bin to PATH
echo 4. Restart Command Prompt
echo 5. Run: flutter --version
echo 6. Run: setup_check.bat
echo.
echo Need help? Check: ANDROID_APP_GUIDE.md
echo.
pause
