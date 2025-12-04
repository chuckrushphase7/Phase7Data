@echo off
setlocal enableextensions enabledelayedexpansion

echo Phase 7 App - BUILD APK (NO GIT PUSH)
echo =====================================
echo.

REM === PATHS ===
set "PHASE7DATA=C:\GitRepos\Phase7Data"
set "ANDROIDPROJ=C:\AndroidProjects\Phase7Residents"
set "ASSETS=%ANDROIDPROJ%\app\src\main\assets"

REM APK locations
set "APK_SOURCE=%ANDROIDPROJ%\app\build\outputs\apk\debug\app-debug.apk"
set "APK_REPO=%PHASE7DATA%\Phase7Residents.apk"

REM Release tag (shown in apk_info.js)
set "GITHUB_RELEASE_TAG=v1.0.0"

REM --- Sanity checks ---
if not exist "%PHASE7DATA%\" (
  echo ERROR: Repo folder not found: %PHASE7DATA%
  pause
  exit /b 1
)
if not exist "%ANDROIDPROJ%\" (
  echo ERROR: Android project folder not found: %ANDROIDPROJ%
  pause
  exit /b 1
)
if not exist "%ASSETS%\" (
  echo ERROR: Android assets folder not found: %ASSETS%
  pause
  exit /b 1
)
echo Paths OK.
echo.

echo [1/5] Regenerating phase7_merged_lots.js from CSV ...
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

echo [2/5] Copying web assets to Android project assets ...
copy /Y "%PHASE7DATA%\phase7_merged_lots.js" "%ASSETS%\phase7_merged_lots.js" >nul
copy /Y "%PHASE7DATA%\index.html"           "%ASSETS%\index.html"           >nul
copy /Y "%PHASE7DATA%\Phase7Org.png"        "%ASSETS%\Phase7Org.png"        >nul
copy /Y "%PHASE7DATA%\mapped_sites.js"      "%ASSETS%\mapped_sites.js"      >nul
copy /Y "%PHASE7DATA%\events.js"            "%ASSETS%\events.js"            >nul
copy /Y "%PHASE7DATA%\event_engine.js"      "%ASSETS%\event_engine.js"      >nul
copy /Y "%PHASE7DATA%\map_core.js"          "%ASSETS%\map_core.js"          >nul
copy /Y "%PHASE7DATA%\draw_lots.js"         "%ASSETS%\draw_lots.js"         >nul
copy /Y "%PHASE7DATA%\draw_sites.js"        "%ASSETS%\draw_sites.js"        >nul
copy /Y "%PHASE7DATA%\season_name.txt"      "%ASSETS%\season_name.txt"      >nul
copy /Y "%PHASE7DATA%\phase7_password.txt"  "%ASSETS%\phase7_password.txt"  >nul

if exist "%PHASE7DATA%\snow.js" (
  copy /Y "%PHASE7DATA%\snow.js" "%ASSETS%\snow.js" >nul
)

echo Assets copied.
echo.

echo [3/5] Building Android debug APK ...
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

echo [4/5] Copying APK to repo ...
if not exist "%APK_SOURCE%" (
  echo *** ERROR: APK not found at:
  echo %APK_SOURCE%
  pause
  exit /b 1
)
copy /Y "%APK_SOURCE%" "%APK_REPO%" >nul

echo APK copied to: %APK_REPO%
echo.

echo [5/5] Writing apk_info.js with current timestamp (robust) ...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$tag='%GITHUB_RELEASE_TAG%'; $dt=(Get-Date).ToString('yyyy-MM-dd HH:mm:ss');" ^
  "'const apkInfo = {' | Set-Content -Encoding UTF8 '%PHASE7DATA%\apk_info.js';" ^
  "('  buildDate: \"{0}\",' -f $dt) | Add-Content -Encoding UTF8 '%PHASE7DATA%\apk_info.js';" ^
  "('  tag: \"{0}\"' -f $tag) | Add-Content -Encoding UTF8 '%PHASE7DATA%\apk_info.js';" ^
  "'};' | Add-Content -Encoding UTF8 '%PHASE7DATA%\apk_info.js'"

echo Wrote: %PHASE7DATA%\apk_info.js
echo.

echo DONE: Build complete (NO git commit/push, NO release upload).
pause
endlocal
