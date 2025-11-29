@echo on
echo Phase 7 App - FULL AUTO BUILD + PUBLISH
echo ================================================

REM === PATHS YOU ACTUALLY CARE ABOUT ==========================
REM Canonical repo (drives web + data)
set "PHASE7DATA=C:\GitRepos\Phase7Data"

REM Android Studio project
set "ANDROIDPROJ=C:\AndroidProjects\Phase7Residents"

REM Where you like to grab APKs manually
set "ONEDRIVE_PHASE7=C:\Users\chuck_6\OneDrive\Phase7Data"

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
echo [3/8] Building Android debug APK ...

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
echo [4/8] Copying APKs and updating apk_info.js ...

IF EXIST "%ANDROIDPROJ%\app\build\outputs\apk\debug\app-debug.apk" (
    REM Main copy into Git repo
    copy /Y "%ANDROIDPROJ%\app\build\outputs\apk\debug\app-debug.apk" "%PHASE7DATA%\Phase7Residents.apk"

    REM Extra copies you use manually / as mirrors
    copy /Y "%ANDROIDPROJ%\app\build\outputs\apk\debug\app-debug.apk" "%ONEDRIVE_PHASE7%\Phase7Residents.apk"
    copy /Y "%ANDROIDPROJ%\app\build\outputs\apk\debug\app-debug.apk" "%MIRROR_PHASE7DATA%\Phase7Residents.apk"

    REM Overwrite apk_info.js with the new build date
    >"%PHASE7DATA%\apk_info.js" echo // AUTO-GENERATED FILE — DO NOT EDIT
    >>"%PHASE7DATA%\apk_info.js" echo // Last build date for Phase7Residents.apk
    >>"%PHASE7DATA%\apk_info.js" echo const APK_LAST_UPDATED = "%DATE% %TIME%";

    echo Wrote apk_info.js with build date %DATE% %TIME%
) ELSE (
    echo !!!
    echo !!! WARNING: app-debug.apk not found; APK not copied.
    echo !!!
)

echo.
echo [5/8] Mirroring Phase7Data and AndroidProjects to D: ...

echo Mirroring Phase7Data to %MIRROR_PHASE7DATA%
xcopy "%PHASE7DATA%\*" "%MIRROR_PHASE7DATA%\" /E /Y /D >nul

echo Mirroring AndroidProjects to %MIRROR_ANDROIDPROJ%
xcopy "C:\AndroidProjects\Phase7Residents\*" "%MIRROR_ANDROIDPROJ%\" /E /Y /D >nul

echo Mirrors updated.

echo.
echo [6/8] Auto-committing and pushing changes to GitHub ...

pushd "%PHASE7DATA%"

REM Check if there is anything to commit
set "NEED_COMMIT="
for /f "delims=" %%i in ('git status --porcelain') do set NEED_COMMIT=1

if defined NEED_COMMIT (
    git add .
    git commit -m "Auto-build: %DATE% %TIME%"
    if errorlevel 1 (
        echo *** ERROR: git commit failed.
        popd
        pause
        goto :EOF
    )
    git push origin %GIT_BRANCH%
    if errorlevel 1 (
        echo *** ERROR: git push failed.
        popd
        pause
        goto :EOF
    )
) else (
    echo No git changes to commit.
)

popd

echo.
echo [7/8] Uploading APK to GitHub Release (tag %GITHUB_RELEASE_TAG%) ...

REM Check if GitHub CLI is available
where gh >nul 2>&1
if errorlevel 1 (
    echo !!!
    echo !!! WARNING: GitHub CLI (gh) not found. Skipping release upload.
    echo !!! Install from https://cli.github.com/ and run: gh auth login
    echo !!!
) else (
    pushd "%PHASE7DATA%"
    REM --clobber replaces the existing asset with the same name
    gh release upload "%GITHUB_RELEASE_TAG%" "Phase7Residents.apk" --clobber
    if errorlevel 1 (
        echo *** WARNING: gh release upload failed. Check your auth / tag.
    ) else (
        echo Uploaded Phase7Residents.apk to release %GITHUB_RELEASE_TAG%.
    )
    popd
)

echo.
echo [8/8] ALL DONE
echo   Web data:      %PHASE7DATA%
echo   APK (repo):    %PHASE7DATA%\Phase7Residents.apk
echo   APK (OneDrive):%ONEDRIVE_PHASE7%\Phase7Residents.apk
echo   APK (D:):      %MIRROR_PHASE7DATA%\Phase7Residents.apk
echo.
pause
