@echo off
echo Phase 7 App - Build Data and Debug APK
echo ================================================

echo.
echo [1/3] Running build_phase7_js.py ...
python "C:\Users\chuck_6\OneDrive\Phase7Data\build_phase7_js.py"
if errorlevel 1 (
    echo !!!
    echo !!! ERROR: build_phase7_js.py failed.
    echo !!!
    pause
    exit /b 1
)

echo.
echo [2/3] Copying phase7_merged_lots.js to Android assets...
copy /Y "C:\Users\chuck_6\OneDrive\Phase7Data\phase7_merged_lots.js" "C:\AndroidProjects\Phase7Residents\app\src\main\assets\phase7_merged_lots.js"
if errorlevel 1 (
    echo !!!
    echo !!! ERROR: Copy to assets failed.
    echo !!!
    pause
    exit /b 1
)

echo.
echo [3/3] Running Gradle assembleDebug ...
cd /d C:\AndroidProjects\Phase7Residents
call gradlew.bat assembleDebug
if errorlevel 1 (
    echo !!!
    echo !!! ERROR: Gradle build failed. See messages above.
    echo !!!
    pause
    exit /b 1
)

echo.
echo Build complete. app-debug.apk should be in:
echo   C:\AndroidProjects\Phase7Residents\app\build\outputs\apk\debug
echo.
pause
