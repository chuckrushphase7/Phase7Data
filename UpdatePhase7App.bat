@echo off
echo Phase 7 App - Build Data and Debug APK
echo ================================================

REM --- Set common paths ---
set "PHASE7DATA=C:\Users\chuck_6\OneDrive\Phase7Data"
set "ANDROIDPROJ=C:\AndroidProjects\Phase7Residents"

echo.
echo [1/4] Running build_phase7_js.py ...
cd /d "%PHASE7DATA%"
python "%PHASE7DATA%\build_phase7_js.py"
if errorlevel 1 (
    echo !!!
    echo !!! ERROR: build_phase7_js.py failed.
    echo !!!
    pause
    exit /b 1
)

echo.
echo [2/4] Copying web assets to Android project ...
copy /Y "%PHASE7DATA%\phase7_merged_lots.js" "%ANDROIDPROJ%\app\src\main\assets\phase7_merged_lots.js"
copy /Y "%PHASE7DATA%\index.html"              "%ANDROIDPROJ%\app\src\main\assets\index.html"
copy /Y "%PHASE7DATA%\Phase7Org.png"           "%ANDROIDPROJ%\app\src\main\assets\Phase7Org.png"
copy /Y "%PHASE7DATA%\season_name.txt"         "%ANDROIDPROJ%\app\src\main\assets\season_name.txt"
copy /Y "%PHASE7DATA%\phase7_password.txt"     "%ANDROIDPROJ%\app\src\main\assets\phase7_password.txt"
copy /Y "%PHASE7DATA%\mapped_sites.js"         "%ANDROIDPROJ%\app\src\main\assets\mapped_sites.js"
if errorlevel 1 (
    echo !!!
    echo !!! ERROR: Copy to assets failed.
    echo !!!
    pause
    exit /b 1
)

echo.
echo [3/4] Running Gradle assembleDebug ...
cd /d "%ANDROIDPROJ%"
call gradlew.bat assembleDebug
if errorlevel 1 (
    echo !!!
    echo !!! ERROR: Gradle build failed. See messages above.
    echo !!!
    pause
    exit /b 1
)

echo.
echo [4/4] Copying APK to Phase7Data and writing apk_info.js ...

set "APKPATH=%ANDROIDPROJ%\app\build\outputs\apk\debug\app-debug.apk"
if exist "%APKPATH%" (
    copy /Y "%APKPATH%" "%PHASE7DATA%\Phase7Residents.apk"
    echo Copied APK to %PHASE7DATA%\Phase7Residents.apk

    REM Write/overwrite apk_info.js with today's date
    echo const APK_LAST_UPDATED = "%DATE%";>"%PHASE7DATA%\apk_info.js"
    echo Wrote apk_info.js with build date %DATE%
) else (
    echo !!!
    echo !!! WARNING: app-debug.apk not found; APK not copied.
    echo !!!
)

echo.
echo Build complete.
echo   Android APK: %PHASE7DATA%\Phase7Residents.apk
echo   APK info   : %PHASE7DATA%\apk_info.js
echo.
pause
