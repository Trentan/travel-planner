@echo off
echo Starting TeleCodex in Travel Planner workspace...

:: Make codex CLI findable
set PATH=%APPDATA%\npm;%PATH%

:: Clear stale context (remove this line after first successful run)
if exist C:\Apps\Projects\telecodex\.telecodex\contexts.json (
    del C:\Apps\Projects\telecodex\.telecodex\contexts.json
)

cd C:\Apps\Projects\travel-planner

C:\Apps\Projects\telecodex\node_modules\.bin\tsx --env-file=C:\Apps\Projects\telecodex\.env C:\Apps\Projects\telecodex\src\index.ts


:: Update this file by adding shell:true to run from windows (in the telecodex repo, after installing + setting up env) then run this bat when you want to talk via telegram)
::    execFile(
::         CODEX_CLI,
::         args,
::         {
::           timeout: COMMAND_TIMEOUT_MS,
::           env: { ...process.env },
::           maxBuffer: 1024 * 1024,
::           shell: true,
::         },