@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ============================================================
REM Phase 7 - BUILD APK ONLY (NO GIT PUSH / NO RELEASE UPLOAD)
REM Writes full log to build_apk.log
REM ============================================================

set "PHASE7DATA=C:\GitRepos\Phase7Data"
set "ANDROIDPROJ=C:\AndroidProjects\Phase7Residents"
set "ASSETS=%ANDROIDPROJ%\app\src\main\assets"
set "APK_REPO=%PHASE7DATA%\Phase7Residents.apk"
set "GITHUB_RELEASE_TAG=v1.0.0"

set "LOG=%PHASE7DATA%\build_apk.log"

call :LOG_INIT

call :BANNER "Sanity checks"
call :SANITY
if errorlevel 1 goto :FAIL

call :BANNER "Backup index.html"
call :BACKUP_INDEX
if errorlevel 1 goto :FAIL

call :BANNER "Generate merged lots"
call :GEN_LOTS
if errorlevel 1 goto :FAIL

call :BANNER "Write apk_info.js"
call :WRITE_APK_INFO
if errorlevel 1 goto :FAIL

call :BANNER "Copy assets"
call :COPY_ASSETS
if errorlevel 1 goto :FAIL

call :BANNER "Gradle assembleDebug"
call :BUILD_APK
if errorlevel 1 goto :FAIL

call :BANNER "Copy APK to repo"
call :COPY_APK
if errorlevel 1 goto :FAIL

goto :OK


:OK
echo.
echo ============================================================
echo DONE (RC=0)
echo Log: "%LOG%"
echo ============================================================
echo.
pause
exit /b 0

:FAIL
set "RC=%ERRORLEVEL%"
if "%RC%"=="" set "RC=1"
echo.
echo ============================================================
echo DONE (RC=%RC%). See log:
echo   "%LOG%"
echo ============================================================
echo.
pause
exit /b %RC%


REM =========================
REM Functions
REM =========================

:LOG_INIT
> "%LOG%" (
  echo ============================================================
  echo Logging started: %DATE% %TIME%
  echo ============================================================
  echo Repo   : %PHASE7DATA%
  echo Project: %ANDROIDPROJ%
  echo Assets : %ASSETS%
  echo Tag    : %GITHUB_RELEASE_TAG%
  echo ============================================================
)
echo ============================================================
echo Phase 7 - BUILD APK ONLY (NO GIT PUSH / NO RELEASE UPLOAD)
echo Repo:    %PHASE7DATA%
echo Project: %ANDROIDPROJ%
echo Assets:  %ASSETS%
echo Tag:     %GITHUB_RELEASE_TAG%
echo ============================================================
echo.
exit /b 0

:BANNER
REM Usage: call :BANNER "Step name"
echo [*] %~1
echo [*] %~1 >> "%LOG%"
exit /b 0


:SANITY
REM --- Sanity checks ---
if not exist "%PHASE7DATA%\" (
  echo *** ERROR: Repo folder not found: %PHASE7DATA%
  echo *** ERROR: Repo folder not found: %PHASE7DATA% >> "%LOG%"
  exit /b 1
)

if not exist "%ANDROIDPROJ%\" (
  echo *** ERROR: Android project folder not found: %ANDROIDPROJ%
  echo *** ERROR: Android project folder not found: %ANDROIDPROJ% >> "%LOG%"
  exit /b 1
)

if not exist "%ASSETS%\" (
  echo *** ERROR: Android assets folder not found: %ASSETS%
  echo *** ERROR: Android assets folder not found: %ASSETS% >> "%LOG%"
  exit /b 1
)

if not exist "%PHASE7DATA%\index.html" (
  echo *** ERROR: Missing "%PHASE7DATA%\index.html"
  echo *** ERROR: Missing "%PHASE7DATA%\index.html" >> "%LOG%"
  exit /b 1
)

exit /b 0


:BACKUP_INDEX
set "BK=%PHASE7DATA%\_backups"
if not exist "%BK%" mkdir "%BK%" >> "%LOG%" 2>&1

REM Timestamp: YYYYMMDD_HHMMSS (best-effort; depends on locale)
set "TS=%DATE:~-4%%DATE:~4,2%%DATE:~7,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%"
set "TS=%TS: =0%"

copy /Y "%PHASE7DATA%\index.html" "%BK%\index_%TS%.html" >> "%LOG%" 2>&1
exit /b %ERRORLEVEL%

:GEN_LOTS
pushd "%PHASE7DATA%" >> "%LOG%" 2>&1
python "%PHASE7DATA%\generate_phase7_merged_lots.py" >> "%LOG%" 2>&1
set "RC=%ERRORLEVEL%"
popd >> "%LOG%" 2>&1
exit /b %RC%

:WRITE_APK_INFO
powershell -NoProfile -ExecutionPolicy Bypass -File "%PHASE7DATA%\write_apk_info.ps1" -Phase7Data "%PHASE7DATA%" -Tag "%GITHUB_RELEASE_TAG%" >> "%LOG%" 2>&1
exit /b %ERRORLEVEL%

:COPY_ASSETS
copy /Y "%PHASE7DATA%\phase7_merged_lots.js" "%ASSETS%\phase7_merged_lots.js" >> "%LOG%" 2>&1
copy /Y "%PHASE7DATA%\index.html"           "%ASSETS%\index.html"           >> "%LOG%" 2>&1
copy /Y "%PHASE7DATA%\Phase7Org.png"        "%ASSETS%\Phase7Org.png"        >> "%LOG%" 2>&1
copy /Y "%PHASE7DATA%\mapped_sites.js"      "%ASSETS%\mapped_sites.js"      >> "%LOG%" 2>&1
copy /Y "%PHASE7DATA%\events.js"            "%ASSETS%\events.js"            >> "%LOG%" 2>&1
copy /Y "%PHASE7DATA%\event_engine.js"      "%ASSETS%\event_engine.js"      >> "%LOG%" 2>&1
copy /Y "%PHASE7DATA%\map_core.js"          "%ASSETS%\map_core.js"          >> "%LOG%" 2>&1
copy /Y "%PHASE7DATA%\draw_lots.js"         "%ASSETS%\draw_lots.js"         >> "%LOG%" 2>&1
copy /Y "%PHASE7DATA%\draw_sites.js"        "%ASSETS%\draw_sites.js"        >> "%LOG%" 2>&1
copy /Y "%PHASE7DATA%\apk_info.js"          "%ASSETS%\apk_info.js"          >> "%LOG%" 2>&1
copy /Y "%PHASE7DATA%\season_name.txt"      "%ASSETS%\season_name.txt"      >> "%LOG%" 2>&1
copy /Y "%PHASE7DATA%\phase7_password.txt"  "%ASSETS%\phase7_password.txt"  >> "%LOG%" 2>&1

if exist "%PHASE7DATA%\snow_scene.js"    copy /Y "%PHASE7DATA%\snow_scene.js"    "%ASSETS%\snow_scene.js"    >> "%LOG%" 2>&1
if exist "%PHASE7DATA%\snow.js"          copy /Y "%PHASE7DATA%\snow.js"          "%ASSETS%\snow.js"          >> "%LOG%" 2>&1
if exist "%PHASE7DATA%\santa_sleigh.png" copy /Y "%PHASE7DATA%\santa_sleigh.png" "%ASSETS%\santa_sleigh.png" >> "%LOG%" 2>&1

exit /b %ERRORLEVEL%

:BUILD_APK
pushd "%ANDROIDPROJ%" >> "%LOG%" 2>&1
call gradlew.bat assembleDebug >> "%LOG%" 2>&1
set "RC=%ERRORLEVEL%"
popd >> "%LOG%" 2>&1

>> "%LOG%" echo.
>> "%LOG%" echo --- APK outputs (debug) ---
dir "%ANDROIDPROJ%\app\build\outputs\apk\debug\*.apk" >> "%LOG%" 2>&1
>> "%LOG%" echo --- APK outputs (all) ---
dir /s /b "%ANDROIDPROJ%\app\build\outputs\apk\*.apk" >> "%LOG%" 2>&1

exit /b %RC%

:COPY_APK
set "APK_SOURCE="

for /f "delims=" %%F in ('dir /b /a:-d /o:-d "%ANDROIDPROJ%\app\build\outputs\apk\debug\*.apk" 2^>nul') do (
  set "APK_SOURCE=%ANDROIDPROJ%\app\build\outputs\apk\debug\%%F"
  goto :GOTAPK
)

for /f "delims=" %%F in ('dir /s /b /a:-d /o:-d "%ANDROIDPROJ%\app\build\outputs\apk\*.apk" 2^>nul') do (
  set "APK_SOURCE=%%F"
  goto :GOTAPK
)

:GOTAPK
if not defined APK_SOURCE (
  echo *** ERROR: No APK produced under outputs\apk
  >> "%LOG%" echo *** ERROR: No APK produced under outputs\apk
  exit /b 1
)

echo     Using: "%APK_SOURCE%"
>> "%LOG%" echo Using APK: "%APK_SOURCE%"

copy /Y "%APK_SOURCE%" "%APK_REPO%" >> "%LOG%" 2>&1
exit /b %ERRORLEVEL%
