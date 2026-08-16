@echo off
setlocal

rem このバッチと同じフォルダの index.html を Chrome で開きます。
rem %~dp0 は「このファイルが置いてある場所」なので、
rem フォルダごと移動しても動きます。
rem
rem このファイルは Shift-JIS(CP932) で保存してください。
rem UTF-8 で保存すると、日本語の行で cmd が止まります。

set "HTML=%~dp0index.html"

set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"

if not exist "%HTML%" goto nohtml
if not exist "%CHROME%" goto nochrome

rem --new-window を付けないと、すでに開いている Chrome の
rem 裏側にタブが増えるだけで、開いたことに気づけない。
start "" "%CHROME%" --new-window "%HTML%"
exit /b 0

:nohtml
echo index.html が見つかりません。
echo このバッチは index.html と同じフォルダに置いてください。
pause
exit /b 1

:nochrome
echo Chrome が見つかりませんでした。
echo index.html を右クリックして「プログラムから開く」から Chrome を選んでください。
pause
exit /b 1
