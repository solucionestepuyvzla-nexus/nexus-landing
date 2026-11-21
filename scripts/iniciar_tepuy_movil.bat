@echo off
title Tepuy Condo Nexus - Emulador Movil
color 0B
echo ======================================================================
echo          TEPUY CONDO NEXUS - LANZADOR DEL EMULADOR MOVIL
echo ======================================================================
echo.

set "SDK_DIR=%LOCALAPPDATA%\Android\Sdk"
set "EMULATOR_EXE=%SDK_DIR%\emulator\emulator.exe"
set "ADB_EXE=%SDK_DIR%\platform-tools\adb.exe"
set "AVD_NAME=Medium_Phone_API_37.0"
set "APP_PKG=com.tepuy.tepuy_condo_nexus_mobile"
set "MAIN_ACT=.MainActivity"
set "AVD_USER_INI=%USERPROFILE%\.android\avd\Medium_Phone.avd\emulator-user.ini"
set "AVD_DIR=%USERPROFILE%\.android\avd\Medium_Phone.avd"

echo [1/3] Verificando estado del emulador...
"%ADB_EXE%" devices | findstr /R "emulator-[0-9]*.*device$" >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] El emulador ya esta en ejecucion.
    goto LAUNCH_APP
)

echo [2/3] Configurando escala al 30%% y posicion comoda en pantalla...
:: Eliminar bloqueos residuales si existieran
if exist "%AVD_DIR%\hardware-qemu.ini.lock" rmdir /s /q "%AVD_DIR%\hardware-qemu.ini.lock" >nul 2>&1
if exist "%AVD_DIR%\multiinstance.lock" del /f /q "%AVD_DIR%\multiinstance.lock" >nul 2>&1

:: Forzar escala 30% y posicion Y=140 para que nunca se abra fuera de la pantalla
attrib -r "%AVD_USER_INI%" >nul 2>&1
(
echo window.x = 250
echo window.y = 140
echo window.scale = 0.300000
echo resizable.config.id = -1
echo posture = 0
echo uuid = 1791832893885
echo avd.ini.encoding=UTF-8
) > "%AVD_USER_INI%"

echo Iniciando emulador independiente: %AVD_NAME%...
start "" "%EMULATOR_EXE%" -avd %AVD_NAME% -gpu host

:: Iniciar guardian de reposicionamiento en paralelo
start "" /B powershell -NoProfile -ExecutionPolicy Bypass -File "C:\IA_Proyectos\NEXUSAI\scripts\reposition_emulator.ps1"

echo Esperando inicializacion de Android...
"%ADB_EXE%" wait-for-device

:WAIT_BOOT
ping 127.0.0.1 -n 3 >nul
for /f "tokens=*" %%a in ('"%ADB_EXE%" shell getprop sys.boot_completed 2^>nul') do set BOOT=%%a
if not "%BOOT%"=="1" (
    goto WAIT_BOOT
)
echo [OK] Android ha iniciado correctamente.

:LAUNCH_APP
echo [3/3] Actualizando y desplegando aplicacion Tepuy Resident...
set "APK_PATH=C:\IA_Proyectos\NEXUSAI\mobile-app-flutter\build\app\outputs\flutter-apk\app-debug.apk"
if exist "%APK_PATH%" (
    echo Instalando compilacion mas reciente...
    "%ADB_EXE%" install -r "%APK_PATH%" >nul 2>&1
)
"%ADB_EXE%" shell am start -n %APP_PKG%/%MAIN_ACT% >nul 2>&1
echo.
echo ======================================================================
echo  APLICACION TEPUY NEXUS RESIDENTE DESPLEGADA EXITOSAMENTE
echo ======================================================================
echo.
ping 127.0.0.1 -n 3 >nul
exit
