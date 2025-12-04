@echo off
setlocal EnableExtensions EnableDelayedExpansion

echo Phase 7 - BUILD APK ONLY (NO GIT PUSH / NO RELEASE UPLOAD)
echo ==========================================================
echo.

REM === PATHS YOU ACTUALLY CARE ABOUT ==========================
set "PHASE7DATA=C:\GitRepos\Phase7Data"
set "ANDROIDPROJ=C:\AndroidProjects\Phase7Residents"

REM Optional mirror locations (leave as-is if you use them)
set "MIRROR_ANDROIDPROJ=D:\AndroidProjects\Phase7Residents"

REM === Derived paths ==========================================
set "ASSETS=%ANDROIDPROJ%\app\src\main\assets"
set "APK_SOURCE=%ANDROIDPROJ%\app\build\outputs\apk\debug\app-debug.apk"
set "APK_REPO=%PHASE7DATA%\Phase7Residents.apk"

echo Repo:   %PHASE7DATA%
echo Project:%ANDROIDPROJ%
echo Assets: %ASSETS%
echo Output: %APK_REPO%
echo.

REM --- Sanity checks ---
if not exist "%PHASE7DATA%\" (
  echo *** ERROR: Repo folder not found: %PHASE7DATA%
  pause
  exit /b 1
)

if not exist "%ANDROIDPROJ%\" (
  echo *** ERROR: Android project folder not found: %ANDROIDPROJ%
  pause
  exit /b 1
)

if not exist "%ASSETS%\" (
  echo *** ERROR: Android assets folder not found: %ASSETS%
  pause
  exit /b 1
)

REM [1/4] Regenerate merged lots JS from CSV
echo [1/4] Regenerating phase7_merged_lots.js from CSV ...
pushd "%PHASE7DATA%"
python "%PHASE7DATA%\generate_phase7_merged_lots.py"
if errorlevel 1 (
  echo *** ERROR: Failed to generate phase7_merged_lots.js
  popd
  pause
  exit /b 1
)
popd
echo.

REM [2/4] Copy web assets into Android project
echo [2/4] Copying web assets to Android project assets ...
copy /Y "%PHASE7DATA%\phase7_merged_lots.js" "%ASSETS%\phase7_merged_lots.js"
copy /Y "%PHASE7DATA%\index.html"              "%ASSETS%\index.html"
copy /Y "%PHASE7DATA%\Phase7Org.png"           "%ASSETS%\Phase7Org.png"
copy /Y "%PHASE7DATA%\mapped_sites.js"         "%ASSETS%\mapped_sites.js"
copy /Y "%PHASE7DATA%\events.js"               "%ASSETS%\events.js"
copy /Y "%PHASE7DATA%\event_engine.js"         "%ASSETS%\event_engine.js"
copy /Y "%PHASE7DATA%\map_core.js"             "%ASSETS%\map_core.js"
copy /Y "%PHASE7DATA%\draw_lots.js"            "%ASSETS%\draw_lots.js"
copy /Y "%PHASE7DATA%\draw_sites.js"           "%ASSETS%\draw_sites.js"
copy /Y "%PHASE7DATA%\season_name.txt"         "%ASSETS%\season_name.txt"
copy /Y "%PHASE7DATA%\phase7_password.txt"     "%ASSETS%\phase7_password.txt"

REM Optional
if exist "%PHASE7DATA%\snow.js" (
  copy /Y "%PHASE7DATA%\snow.js" "%ASSETS%\snow.js"
)

echo.

REM [3/4] Build Debug APK
echo [3/4] Building Android DEBUG APK ...
pushd "%ANDROIDPROJ%"
call gradlew.bat assembleDebug
if errorlevel 1 (
  echo *** ERROR: Gradle build failed.
  popd
  pause
  exit /b 1
)
popd
echo.

REM [4/4] Copy APK to repo (and optional mirror)
echo [4/4] Copying APK to repo ...
if not exist "%APK_SOURCE%" (
  echo *** ERROR: APK not found at: %APK_SOURCE%
  pause
  exit /b 1
)

copy /Y "%APK_SOURCE%" "%APK_REPO%"

if exist "%MIRROR_ANDROIDPROJ%\" (
  copy /Y "%APK_SOURCE%" "%MIRROR_ANDROIDPROJ%\Phase7Residents.apk"
)

echo.
echo DONE - APK built and copied:
echo   %APK_REPO%
echo.
pause
endlocal
