@echo off
echo Phase 7 App - Build Data and Debug APK
echo ================================================

echo.
echo [1/3] Running build_phase7_js.py ...
cd /d "C:\Users\chuck_6\OneDrive\Phase7Data"
python "C:\Users\chuck_6\OneDrive\Phase7Data\build_phase7_js.py"
if errorlevel 1 (
    echo !!!
    echo !!! ERROR: build_phase7_js.py failed.
    echo !!!
    pause
    exit /b 1
)

echo.
echo [2/3] Copying web assets to Android project ...
copy /Y "C:\Users\chuck_6\OneDrive\Phase7Data\phase7_merged_lots.js" "C:\AndroidProjects\Phase7Residents\app\src\main\assets\phase7_merged_lots.js"
copy /Y "C:\Users\chuck_6\OneDrive\Phase7Data\index.html" "C:\AndroidProjects\Phase7Residents\app\src\main\assets\index.html"
copy /Y "C:\Users\chuck_6\OneDrive\Phase7Data\Phase7Org.png" "C:\AndroidProjects\Phase7Residents\app\src\main\assets\Phase7Org.png"
copy /Y "C:\Users\chuck_6\OneDrive\Phase7Data\season_name.txt" "C:\AndroidProjects\Phase7Residents\app\src\main\assets\season_name.txt"
copy /Y "C:\Users\chuck_6\OneDrive\Phase7Data\phase7_password.txt" "C:\AndroidProjects\Phase7Residents\app\src\main\assets\phase7_password.txt"
copy /Y "C:\Users\chuck_6\OneDrive\Phase7Data\mapped_sites.json" "C:\AndroidProjects\Phase7Residents\app\src\main\assets\mapped_sites.json"

if errorlevel 1 (
    echo !!!
    echo !!! ERROR: Copy to assets failed.
    echo !!!
    pause
    exit /b 1
)

echo.
echo [3/3] Running Gradle assembleDebug ...
cd /d "C:\AndroidProjects\Phase7Residents"
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
