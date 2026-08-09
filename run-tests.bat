@echo off
setlocal
cd /d "%~dp0"
echo Running travel planner test suite...
call npm test
echo.
if errorlevel 1 (
  echo Tests failed.
) else (
  echo Tests passed.
)
echo.
pause
