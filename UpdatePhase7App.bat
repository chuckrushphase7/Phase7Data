@echo off
echo Phase 7 App - FULL AUTO BUILD + PUBLISH
echo ================================================

REM === PATHS YOU ACTUALLY CARE ABOUT ==========================

REM Canonical repo (drives web + data)
set "PHASE7DATA=C:\GitRepos\Phase7Data"

REM Android Studio project
set "ANDROIDPROJ=C:\AndroidProjects\Phase7Residents"

REM Mirror directories on D: drive
set "MIRROR_PHASE7DATA=D:\Phase7Data"
set "MIRROR_ANDROIDPROJ=D:\AndroidProjects\Phase7Residents"

REM Git / GitHub settings
set "GIT_BRANCH=main"
set "GITHUB_OWNER=chuckrushphase7"
set "GITHUB_REPO=Phase7Data"
set "GITHUB_RELEASE_TAG=v1.0.0"

echo.
echo [0/8] Ensuring mirror folders exist ...
if not exist "%MIRROR_PHASE7DATA%" (
    echo Creating %MIRROR_PHASE7DATA%
    mkdir "%MIRROR_PHASE7DATA%"
)

if not exist "%MIRROR_ANDROIDPROJ%" (
    echo Creating %MIRROR_ANDROIDPROJ%
    mkdir "%MIRROR_ANDROIDPROJ%"
)

echo.
echo [1/8] Regenerating phase7_merged_lots.js from CSV ...
pushd "%PHASE7DATA%"
python "%PHASE7DATA%\generate_phase7_merged_lots.py"
if errorlevel 1 (
    echo *** ERROR: Failed to generate phase7_merged_lots.js
    pause
    popd
    goto :EOF
)
popd

echo.
echo [2/8] Copying web assets to Android project ...

set "ASSETS=%ANDROIDPROJ%\app\src\main\assets"

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

REM Optional snow effect
if exist "%PHASE7DATA%\snow.js" (
    copy /Y "%PHASE7DATA%\snow.js" "%ASSETS%\snow.js"
)

echo.
echo [3/8] Building Android debug APK ...
pushd "%ANDROIDPROJ%"
call gradlew.bat assembleDebug
popd

echo.
echo [4/8] Copying APKs and updating apk_info.js ...

set "APK_SOURCE=%ANDROIDPROJ%\app\build\outputs\apk\debug\app-debug.apk"
set "APK_REPO=%PHASE7DATA%\Phase7Residents.apk"

copy /Y "%APK_SOURCE%" "%APK_REPO%"

if exist "%MIRROR_ANDROIDPROJ%" (
    copy /Y "%APK_SOURCE%" "%MIRROR_ANDROIDPROJ%\Phase7Residents.apk"
)

REM Write apk_info.js (simple version)
echo const apkInfo = { > "%PHASE7DATA%\apk_info.js"
echo   buildDate: "%DATE% %TIME%", >> "%PHASE7DATA%\apk_info.js"
echo   tag: "%GITHUB_RELEASE_TAG%" >> "%PHASE7DATA%\apk_info.js"
echo }; >> "%PHASE7DATA%\apk_info.js"

echo.
echo [5/8] Mirroring Phase7Data and AndroidProjects to D: ...
robocopy "%PHASE7DATA%" "%MIRROR_PHASE7DATA%" /MIR >nul
robocopy "%ANDROIDPROJ%" "%MIRROR_ANDROIDPROJ%" /MIR >nul
echo Mirrors updated.

echo.
echo [6/8] Auto-committing and pushing changes to GitHub ...

pushd "%PHASE7DATA%"
git add .
git commit -m "Auto-build: %DATE% %TIME%"
git push origin %GIT_BRANCH%
popd

echo.
echo [7/8] Uploading APK to GitHub Release (tag %GITHUB_RELEASE_TAG%) ...

if exist "%APK_REPO%" (
   echo Uploading "%APK_REPO%" to release %GITHUB_RELEASE_TAG% ...    gh release upload "%GITHUB_RELEASE_TAG%" "%APK_REPO%" --clobber
 ) else (
   echo *** WARNING: APK not found at "%APK_REPO%". Skipping upload.
)

echo.
echo [8/8] ALL DONE!
pause


Rem Old Statements
rem pushd "%PHASE7DATA%"
rem git add .
rem git commit -m "Auto-build: %DATE% %TIME%"
git push origin %GIT_BRANCH%
rem popd

echo.
echo [7/8] Uploading APK to GitHub Release (tag %GITHUB_RELEASE_TAG%) ...

rem if exist "%APK_REPO%" (
rem    echo Uploading "%APK_REPO%" to release %GITHUB_RELEASE_TAG% ...
rem    gh release upload "%GITHUB_RELEASE_TAG%" "%APK_REPO%" --clobber
rem ) else (
rem    echo *** WARNING: APK not found at "%APK_REPO%". Skipping upload.
)