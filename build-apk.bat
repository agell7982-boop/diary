@echo off
chcp 65001 > nul
echo ========================================================
echo   다이어리 (Diary) 안드로이드 APK 자동 빌드 스크립트
echo ========================================================
echo.

echo [1/3] 웹 자산(HTML/CSS/JS) www 폴더로 동기화 중...
call node copy-www.js
call npx.cmd cap sync android

echo.
echo [2/3] 빌드 환경 설정 (JDK 21)...
set "JAVA_HOME=%~dp0.jdk21\jdk-21.0.13+9"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo.
echo [3/3] APK 컴파일 진행 중 (잠시만 기다려 주세요)...
cd android
call gradlew.bat assembleDebug
cd ..

if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    copy /y "android\app\build\outputs\apk\debug\app-debug.apk" "diary-debug.apk" > nul
    echo.
    echo ========================================================
    echo  [성공] APK 빌드가 완료되었습니다!
    echo  생성 위치: diary-debug.apk
    echo  (또는 android\app\build\outputs\apk\debug\app-debug.apk)
    echo ========================================================
) else (
    echo.
    echo [오류] APK 빌드에 실패했습니다. 로그를 확인해 주세요.
)
pause
