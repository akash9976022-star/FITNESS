@echo off
setlocal
echo ========================================================
echo        FitMaintenance AI - Android APK Builder (D: Drive)
echo ========================================================
echo.
cd /d "%~dp0"

REM 1. Configure Node.js path
if exist "%LOCALAPPDATA%\Programs\nodejs" (
    set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
)

REM 2. Strictly configure D: Drive Java 21
if exist "D:\Java\jdk-21" (
    set "JAVA_HOME=D:\Java\jdk-21"
) else if exist "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot" (
    set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"
)
if defined JAVA_HOME set "PATH=%JAVA_HOME%\bin;%PATH%"

REM 3. Strictly configure D: Drive Android SDK
if exist "D:\Android\Sdk" (
    set "ANDROID_HOME=D:\Android\Sdk"
) else if exist "%LOCALAPPDATA%\Android\Sdk" (
    set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
)

REM 4. Redirect Gradle User Home to D: Drive to keep C: clean
if not exist "D:\.gradle" mkdir "D:\.gradle"
set "GRADLE_USER_HOME=D:\.gradle"

echo [Environment Configured on D: Drive]
echo - Java Home:    %JAVA_HOME%
echo - Android SDK:  %ANDROID_HOME%
echo - Gradle Home:  %GRADLE_USER_HOME%
echo.

echo [1/3] Building Web Production Assets...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Error: Web build failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Syncing to Capacitor Android...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo Error: Capacitor sync failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Compiling Android APK via Gradle...
cd android
call gradlew.bat assembleDebug
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   BUILD SUCCESSFUL!
    echo   Your APK file is located at:
    echo   android\app\build\outputs\apk\debug\app-debug.apk
    echo ========================================================
    echo.
    echo Opening folder in Windows Explorer...
    explorer "%~dp0android\app\build\outputs\apk\debug"
) else (
    echo.
    echo ========================================================
    echo   Notice: Gradle build encountered an error.
    echo ========================================================
)
pause
