@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Сайт - локальный сервер
where node >nul 2>nul
if errorlevel 1 goto nonode
if not exist node_modules (
  echo Первый запуск: устанавливаю компоненты, это займёт около минуты...
  call npm install
)
if not exist .env copy .env.example .env >nul
echo.
echo   Сайт:     http://localhost:3000
echo   Админка:  http://localhost:3000/admin
echo   Пароль админки задаётся в файле .env - строка ADMIN_PASSWORD
echo.
echo   Не закрывайте это окно, пока смотрите сайт.
echo.
start "" cmd /c "timeout /t 2 >nul & start http://localhost:3000"
node server.js
pause
exit /b
:nonode
echo Не найден Node.js - программа, на которой работает сайт.
echo Сейчас откроется страница загрузки: скачайте версию LTS, установите и снова запустите этот файл.
start "" https://nodejs.org/ru/download
pause
