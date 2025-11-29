@echo on
echo Phase 7 App - Build Data and Debug APK
echo ================================================

REM --- Set common paths ---
set "PHASE7DATA=C:\Users\chuck_6\OneDrive\Phase7Data"
set "ANDROIDPROJ=C:\AndroidProjects\Phase7Residents"

echo.
echo [1/4] Regenerating phase7_merged_lots.js from CSV ...

REM Make sure the Python generator script exists
if not exist "%PHASE7DATA%\generate_phase7_merged_lots.py" (
    echo *** ERROR: generate_phase7_merged_lots.py not found in %PHASE7DATA%
    echo Make sure you saved the Python script into this folder:
    echo   %PHASE7DATA%
    echo and named it exactly: generate_phase7_merged_lots.py
    pause
    goto :EOF
)

pushd "%PHASE7DATA%"
python "%PHASE7DATA%\generate_phase7_merged_lots.py"
if errorlevel 1 (
    echo *** ERROR: Failed to run Python generator.
    echo This usually means:
    echo   - Python is not installed or 'python' is not in PATH, or
    echo   - The script hit an error while reading Phase7Residents_with_coords.csv
    pause
    popd
    goto :EOF
)
popd

echo.
echo [2/4] Copying web assets to Android project ...

copy /Y "%PHASE7DATA%\phase7_merged_lots.js" "%ANDROIDPROJ%\app\src\main\assets\phase7_merged_lots.js"
copy /Y "%PHASE7DATA%\index.html"              "%ANDROIDPROJ%\app\src\main\assets\index.html"
copy /Y "%PHASE7DATA%\Phase7Org.png"           "%ANDROIDPROJ%\app\src\main\assets\Phase7Org.png"
copy /Y "%PHASE7DATA%\mapped_sites.js"         "%ANDROIDPROJ%\app\src\main\assets\mapped_sites.js"
copy /Y "%PHASE7DATA%\events.js"               "%ANDROIDPROJ%\app\src\main\assets\events.js"
copy /Y "%PHASE7DATA%\event_engine.js"         "%ANDROIDPROJ%\app\src\main\assets\event_engine.js"
copy /Y "%PHASE7DATA%\map_core.js"             "%ANDROIDPROJ%\app\src\main\assets\map_core.js"
copy /Y "%PHASE7DATA%\draw_lots.js"            "%ANDROIDPROJ%\app\src\main\assets\draw_lots.js"
copy /Y "%PHASE7DATA%\draw_sites.js"           "%ANDROIDPROJ%\app\src\main\assets\draw_sites.js"
copy /Y "%PHASE7DATA%\season_name.txt"         "%ANDROIDPROJ%\app\src\main\assets\season_name.txt"
copy /Y "%PHASE7DATA%\phase7_password.txt"     "%ANDROIDPROJ%\app\src\main\assets\phase7_password.txt"

echo.
echo [3/4] Building Android debug APK ...

pushd "%ANDROIDPROJ%"
call gradlew.bat assembleDebug
if errorlevel 1 (
    echo *** ERROR: Gradle build failed.
    pause
    popd
    goto :EOF
)
popd

echo.
echo [4/4] Copying APK and updating apk_info.js ...

IF EXIST "%ANDROIDPROJ%\app\build\outputs\apk\debug\app-debug.apk" (
    copy /Y "%ANDROIDPROJ%\app\build\outputs\apk\debug\app-debug.apk" "%PHASE7DATA%\Phase7Residents.apk"

    REM Overwrite apk_info.js with the new build date
    >"%PHASE7DATA%\apk_info.js" echo // AUTO-GENERATED FILE — DO NOT EDIT
    >>"%PHASE7DATA%\apk_info.js" echo // Last build date for Phase7Residents.apk
    >>"%PHASE7DATA%\apk_info.js" echo const APK_LAST_UPDATED = "%DATE%";

    echo Wrote apk_info.js with build date %DATE%
) ELSE (
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
