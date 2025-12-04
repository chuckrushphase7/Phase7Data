@echo off
setlocal
cd /d C:\GitRepos\Phase7Data

set "TAG=v1.0.0"

apk_info.js echo const apkInfo = {

apk_info.js echo buildDate: "%DATE% %TIME%",
apk_info.js echo tag: "%TAG%"
apk_info.js echo };

git add apk_info.js
git commit -m "Update apk_info timestamp"
git push origin main

gh release upload %TAG% Phase7Residents.apk --clobber

echo DONE
pause