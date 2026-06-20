@echo off
cd /d "%~dp0"
set PORT=5500

if not exist ".env" (
    copy /Y ".env.example" ".env" >nul
    echo Da tao file .env.
    echo Hay mo file .env, thay YOUR_API_KEY_HERE bang khoa Gemini that, roi chay lai file nay.
    pause
    exit /b 1
)

findstr /C:"YOUR_API_KEY_HERE" ".env" >nul
if not errorlevel 1 (
    echo Chua co khoa Gemini that trong file .env.
    echo Hay thay YOUR_API_KEY_HERE bang khoa lay tu https://aistudio.google.com/app/apikey
    pause
    exit /b 1
)

start "" "http://localhost:%PORT%"
node server.js
pause
