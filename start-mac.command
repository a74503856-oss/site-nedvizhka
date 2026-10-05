#!/bin/bash
# Запуск сайта на Mac / Linux двойным щелчком
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Не найден Node.js — программа, на которой работает сайт."
  echo "Скачайте версию LTS с https://nodejs.org, установите и снова запустите этот файл."
  open https://nodejs.org/ru/download 2>/dev/null || xdg-open https://nodejs.org/ru/download 2>/dev/null
  read -n 1 -s -r -p "Нажмите любую клавишу..."
  exit 1
fi
[ -d node_modules ] || { echo "Первый запуск: устанавливаю компоненты..."; npm install; }
[ -f .env ] || cp .env.example .env
echo
echo "  Сайт:     http://localhost:3000"
echo "  Админка:  http://localhost:3000/admin"
echo "  Пароль админки задаётся в файле .env — строка ADMIN_PASSWORD"
echo "  Не закрывайте это окно, пока смотрите сайт."
echo
(sleep 2; open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null) &
node server.js
