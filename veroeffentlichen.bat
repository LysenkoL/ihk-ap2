@echo off
rem ==========================================================================
rem  veroeffentlichen.bat — AP2-тренажёр: проверить → закоммитить → отправить на GitHub
rem  Запуск: двойной щелчок. Папки privat\, raw\, _tmp\ НЕ загружаются (.gitignore).
rem ==========================================================================
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo === 1/4  Проверки (node tests\alle.js) ===
node tests\alle.js
if errorlevel 1 (
  echo.
  echo Проверки не прошли — ничего не отправлено. Напиши Claude, что вывелось выше.
  pause
  exit /b 1
)

echo.
echo === 2/4  Пакет экзаменов готов? ===
if not exist "privat\ap2-paket.js" (
  echo ОСТАНОВКА: privat\ap2-paket.js не найден. Сначала собери пакет.
  pause
  exit /b 1
)
echo Пакет экзаменов готов к отправке (privat\ap2-paket.js).


echo.
echo === 3/4  Что изменилось ===
git status --short
echo.
set "MSG="
set /p MSG=Коротко, что изменилось (Enter = "AP2 Update"): 
if "%MSG%"=="" set "MSG=AP2 Update"
set "OK="
set /p OK=Закоммитить и отправить на GitHub? (j = да, n = нет): 
if /i not "%OK%"=="j" (
  echo Отменено, ничего не отправлено.
  pause
  exit /b 0
)

echo.
echo === 4/4  Commit и push ===
git add -A
git commit -m "%MSG%"
git push
if errorlevel 1 (
  echo.
  echo Push не удался: проверь интернет или вход в GitHub. Коммит сохранён локально.
  pause
  exit /b 1
)
echo.
echo Готово. GitHub Pages обновится через 1–2 минуты.
echo На телефоне: открыть приложение и согласиться на новую версию.
echo Если менялись экзамены (privat\ap2-paket.js) — загрузить файл через «Paket laden».
pause
