:: web-ext run -t firefox-android --adb-device emulator-5554 --firefox-apk org.mozilla.firefox
@echo off
title Web Crawler
set globalCounter = 0
:loop
echo Starting Crawl...
echo %globalCounter% times failed
cmd /c "web-ext run -t firefox-android --adb-device emulator-5554 --firefox-apk org.mozilla.firefox --adb-remove-old-artifacts"
echo Crawl failed, restarting ...
set /a globalCounter=globalCounter+1
timeout 5
goto loop
pause

