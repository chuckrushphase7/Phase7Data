@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "PHASE7DATA=C:\GitRepos\Phase7Data"
set "GIT_BRANCH=main"
set "GITHUB_RELEASE_TAG=v1.0.0"
set "APK_REPO=%PHASE7DATA%\Phase7Residents.apk"

echo Phase 7 - PUBLISH (commit/push non-APK + upload release APK)
echo ============================================================
echo Repo : %PHASE7DATA%
echo APK  : %APK_REPO%
echo Tag  : %GITHUB_RELEASE_TAG%
echo.

echo SAFETY CHECK:
echo This will PUSH CODE to GitHub and OVERWRITE the Release APK.
echo.
set /p CONFIRM=Type PUBLISH to continue (or anything else to cancel):

if /I "%CONFIRM%" NEQ "PUBLISH" goto :CANCEL

if not exist "%PHASE7DATA%\" goto :ERR_NO_REPO
if not exist "%APK_REPO%" goto :ERR_NO_APK

where gh >nul 2>&1
if errorlevel 1 goto :ERR_NO_GH

where git >nul 2>&1
if errorlevel 1 goto :ERR_NO_GIT

pushd "%PHASE7DATA%"

echo(
echo [Git status (before)]
git status
echo(

echo(
echo [Stage changes (EXCLUDING any *.apk)]
git add -A
git reset -- "*.apk" >nul 2>&1
echo(

echo(
echo [Commit (ok if nothing to commit)]
git commit -m "Publish build: %DATE% %TIME%"
echo(

echo(
echo [Push]
git push origin %GIT_BRANCH%
if errorlevel 1 goto :ERR_PUSH
echo(

echo(
echo [Upload APK to GitHub Release (clobber)]
gh release upload "%GITHUB_RELEASE_TAG%" "%APK_REPO%" --clobber
if errorlevel 1 goto :ERR_UPLOAD

popd
echo.
echo DONE: Pushed repo updates and updated release APK.
pause
exit /b 0

:CANCEL
echo Cancelled.
pause
exit /b 0

:ERR_NO_REPO
echo *** ERROR: Repo folder not found: %PHASE7DATA%
pause
exit /b 1

:ERR_NO_APK
echo *** ERROR: APK not found: %APK_REPO%
pause
exit /b 1

:ERR_NO_GH
echo *** ERROR: GitHub CLI (gh) not found in PATH.
pause
exit /b 1

:ERR_NO_GIT
echo *** ERROR: git not found in PATH.
pause
exit /b 1

:ERR_PUSH
echo *** ERROR: git push failed.
popd
pause
exit /b 1

:ERR_UPLOAD
echo *** ERROR: gh release upload failed.
popd
pause
exit /b 1
