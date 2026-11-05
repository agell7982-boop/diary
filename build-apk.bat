@echo off
setlocal
echo [1/3] Syncing web assets to www...
call node copy-www.js
call npx.cmd cap sync android

echo [2/3] Setting up JDK 21 environment...
set "JAVA_HOME=%~dp0.jdk21\jdk-21.0.13+9"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo [3/3] Compiling Android APK...
cd android
call gradlew.bat assembleDebug
cd ..

if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    copy /y "android\app\build\outputs\apk\debug\app-debug.apk" "diary-debug.apk" > nul
    echo.
    echo ========================================================
    echo   BUILD SUCCESSFUL! APK generated at diary-debug.apk
    echo ========================================================
) else (
    echo.
    echo [ERROR] APK build failed. Please check the logs above.
)
endlocal
