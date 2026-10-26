@echo off
rem ==========================================================================
rem  holen.bat — забрать с GitHub то, что сделало облако (после Merge в PR),
rem  и проверить. Ничего не отправляет. Запускать перед работой здесь
rem  (Codex, Claude в Cowork) и после каждого Merge.
rem ==========================================================================
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo === 1/2  Забираю изменения с GitHub ===
git pull --ff-only
if errorlevel 1 (
  echo.
  echo Не получилось. Здесь ничего не сломано.
  echo Чаще всего: те же файлы изменены и здесь, и на GitHub. Напиши Claude, что вывелось выше.
  pause
  exit /b 1
)

echo.
echo === 2/2  Проверки (node tests\alle.js) ===
node tests\alle.js
if errorlevel 1 (
  echo.
  echo Проверки не прошли. Напиши Claude, что вывелось выше.
  pause
  exit /b 1
)
echo.
echo Готово: папка совпадает с GitHub, проверки прошли.
pause
