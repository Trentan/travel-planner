@echo off
setlocal
cd /d "%~dp0"
echo Running browser tests in visible Chromium...
call npm run test:browser:headed
echo.
if errorlevel 1 (
  echo Browser tests failed.
) else (
  echo Browser tests passed.
)
echo.
pause
