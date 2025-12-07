@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ============================================================
REM Phase 7 App - UPDATE (Build + prep only - NO git push)
REM ============================================================

REM === PATHS (EDIT IF NEEDED) ===
set "PHASE7DATA=C:\GitRepos\Phase7Data"
set "ANDROIDPROJ=C:\AndroidProjects\Phase7Residents"
set "ASSETS=%ANDROIDPROJ%\app\src\main\assets"
set "GITHUB_RELEASE_TAG=v1.0.0"
set "APK_REPO=%PHASE7DATA%\Phase7Residents.apk"

REM === LOGGING ===
set "LOG=%PHASE7DATA%\update_phase7.log"
> "%LOG%" echo ============================================================
>>"%LOG%" echo Logging started: %DATE% %TIME%
>>"%LOG%" echo Script: %~f0
>>"%LOG%" echo ============================================================

call :log "Phase 7 App - UPDATE starting..."
echo Phase 7 App - UPDATE (Build APK prep only - NO git push)
echo =========================================================
echo.
echo Script: %~f0
echo Log   : "%LOG%"
echo.

REM ============================================================
REM [*] Sanity checks
REM ============================================================
echo [*] Sanity checks
call :log "[*] Sanity checks"

if not exist "%PHASE7DATA%\" call :die 1 "Repo folder not found: %PHASE7DATA%"
if not exist "%ANDROIDPROJ%\" call :die 1 "Android project folder not found: %ANDROIDPROJ%"
if not exist "%ASSETS%\" call :die 1 "Android assets folder not found: %ASSETS%"

if not exist "%PHASE7DATA%\index.html" call :die 1 "Missing %PHASE7DATA%\index.html"
if not exist "%PHASE7DATA%\generate_phase7_merged_lots.py" call :die 1 "Missing generate_phase7_merged_lots.py"
if not exist "%PHASE7DATA%\write_apk_info.ps1" call :die 1 "Missing write_apk_info.ps1"

echo Paths OK.
echo Repo   : %PHASE7DATA%
echo Project: %ANDROIDPROJ%
echo Assets : %ASSETS%
echo Tag    : %GITHUB_RELEASE_TAG%
echo.
call :log "Paths OK: Repo=%PHASE7DATA% Project=%ANDROIDPROJ% Assets=%ASSETS% Tag=%GITHUB_RELEASE_TAG%"

REM ============================================================
REM Pick Python (avoid 9009)
REM ============================================================
call :log "[*] Resolving Python..."
set "PY="

for /f "delims=" %%P in ('where python 2^>nul') do (
  set "PY=%%P"
  goto :HAVE_PY
)

:HAVE_PY
if not defined PY call :die 9009 "python not found in PATH (where python failed)"

call :log "Python candidate: %PY%"
echo Using Python: %PY%

REM Make sure it actually runs
call :run "Python smoke test" "%PY%" -c "import sys; print(sys.executable)"

REM ============================================================
REM [*] Backup index.html
REM ============================================================
echo [*] Backup index.html
call :log "[*] Backup index.html"

if not exist "%PHASE7DATA%\_backups" mkdir "%PHASE7DATA%\_backups" >nul 2>&1
for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set "TS=%%I"

copy /Y "%PHASE7DATA%\index.html" "%PHASE7DATA%\_backups\index_%TS%.html" >nul
if errorlevel 1 call :die 1 "Backup copy failed"
call :log "Backed up index.html to _backups\index_%TS%.html"

REM ============================================================
REM [1/5] Regenerate merged lots JS
REM ============================================================
echo [1/5] Regenerating phase7_merged_lots.js from CSV ...
pushd "%PHASE7DATA%" || call :die 3 "pushd to %PHASE7DATA% failed"
call :run "[1/5] generate_phase7_merged_lots.py" "%PY%" "%PHASE7DATA%\generate_phase7_merged_lots.py"
popd
echo.

REM ============================================================
REM [2/5] Write apk_info.js BEFORE build
REM ============================================================
echo [2/5] Writing apk_info.js with current timestamp ...
call :run "[2/5] write_apk_info.ps1" powershell -NoProfile -ExecutionPolicy Bypass -File "%PHASE7DATA%\write_apk_info.ps1" -Phase7Data "%PHASE7DATA%" -Tag "%GITHUB_RELEASE_TAG%"
if not exist "%PHASE7DATA%\apk_info.js" call :die 3 "apk_info.js missing after write"
echo Wrote: %PHASE7DATA%\apk_info.js
echo.

REM ============================================================
REM [3/5] Copy assets (COPY ONLY)
REM ============================================================
echo [3/5] Copying web assets to Android project assets ...

call :copyReq "%PHASE7DATA%\phase7_merged_lots.js" "%ASSETS%\phase7_merged_lots.js"
call :copyReq "%PHASE7DATA%\index.html"           "%ASSETS%\index.html"
call :copyReq "%PHASE7DATA%\Phase7Org.png"        "%ASSETS%\Phase7Org.png"
call :copyReq "%PHASE7DATA%\mapped_sites.js"      "%ASSETS%\mapped_sites.js"
call :copyReq "%PHASE7DATA%\events.js"            "%ASSETS%\events.js"
call :copyReq "%PHASE7DATA%\event_engine.js"      "%ASSETS%\event_engine.js"
call :copyReq "%PHASE7DATA%\map_core.js"          "%ASSETS%\map_core.js"
call :copyReq "%PHASE7DATA%\draw_lots.js"         "%ASSETS%\draw_lots.js"
call :copyReq "%PHASE7DATA%\draw_sites.js"        "%ASSETS%\draw_sites.js"
call :copyReq "%PHASE7DATA%\apk_info.js"          "%ASSETS%\apk_info.js"
call :copyReq "%PHASE7DATA%\season_name.txt"      "%ASSETS%\season_name.txt"
call :copyReq "%PHASE7DATA%\phase7_password.txt"  "%ASSETS%\phase7_password.txt"

if exist "%PHASE7DATA%\snow_scene.js" call :copyReq "%PHASE7DATA%\snow_scene.js" "%ASSETS%\snow_scene.js"
if exist "%PHASE7DATA%\snow.js" call :copyReq "%PHASE7DATA%\snow.js" "%ASSETS%\snow.js"
if exist "%PHASE7DATA%\santa_sleigh.png" call :copyReq "%PHASE7DATA%\santa_sleigh.png" "%ASSETS%\santa_sleigh.png"

echo Assets copied.
echo.

REM ============================================================
REM [4/5] Build Debug APK
REM ============================================================
echo [4/5] Building Android DEBUG APK ...
pushd "%ANDROIDPROJ%" || call :die 3 "pushd to %ANDROIDPROJ% failed"
if not exist "gradlew.bat" (
  popd
  call :die 3 "gradlew.bat missing in %ANDROIDPROJ%"
)
call :run "[4/5] gradlew assembleDebug" gradlew.bat assembleDebug
popd
echo.

REM ============================================================
REM [5/5] Copy newest APK back to repo
REM ============================================================
echo [5/5] Copying APK to repo ...

set "APK_SOURCE="
for /f "delims=" %%F in ('dir /b /a:-d /o:-d "%ANDROIDPROJ%\app\build\outputs\apk\debug\*.apk" 2^>nul') do (
  set "APK_SOURCE=%ANDROIDPROJ%\app\build\outputs\apk\debug\%%F"
  goto :FOUNDAPK
)
for /f "delims=" %%F in ('dir /s /b /a:-d "%ANDROIDPROJ%\app\build\outputs\apk\debug\*.apk" 2^>nul ^| sort /r') do (
  set "APK_SOURCE=%%F"
  goto :FOUNDAPK
)

:FOUNDAPK
if not defined APK_SOURCE call :die 3 "No APK found after build"

call :log "Using APK_SOURCE=%APK_SOURCE%"
copy /Y "%APK_SOURCE%" "%APK_REPO%" >nul
if errorlevel 1 call :die 3 "Failed to copy APK to %APK_REPO%"

echo DONE - APK built and copied:
echo   %APK_REPO%
echo.
call :log "DONE OK: %APK_REPO%"
pause
exit /b 0


REM ===================== Helpers =====================

:copyReq
set "SRC=%~1"
set "DST=%~2"
if not exist "%SRC%" call :die 3 "Missing required file: %SRC%"
copy /Y "%SRC%" "%DST%" >nul
if errorlevel 1 call :die 3 "Copy failed: %SRC%"
call :log "[COPY] %SRC% -> %DST%"
exit /b 0

:log
echo %*
>>"%LOG%" echo %*
exit /b 0


:run
REM Usage: call :run "Label text" command arg1 arg2 ...
set "LBL=%~1"
shift /1

call :log [RUN] %LBL%
call :log [CMD] %*

REM Run the command, append all output to log
>>"%LOG%" 2>&1 %*

set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" (
  call :log [FAIL] %LBL% (RC=%RC%)
  exit /b %RC%
)
call :log [OK] %LBL%
exit /b 0

:die
set "RC=%~1"
shift
set "MSG=%~1"
call :log "[FATAL] %MSG% (RC=%RC%)"
echo.
echo ============================================================
echo FAILED: %MSG% (RC=%RC%)
echo See log:
echo   "%LOG%"
echo ============================================================
echo.
pause
exit /b %RC%
