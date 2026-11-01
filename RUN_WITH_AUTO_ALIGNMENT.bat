@echo off
setlocal
cd /d "%~dp0"
echo.
echo CEYVIORA Wedding Invitation - Step 12
 echo Starting local preview for accurate PNG alignment...
echo.
where py >nul 2>nul
if %errorlevel%==0 (
  start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8000"
  py -m http.server 8000
  goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8000"
  python -m http.server 8000
  goto :eof
)
echo Python not found. You can still open index.html directly,
echo but some browsers might use the CSS fallback image positions.
echo To use automatic transparent-image calibration, install Python.
pause
