@echo off
setlocal

rem ============================================================
rem  譜面メーカーを、このフォルダ（公開用）に取り込みます。
rem
rem  公開しているのは **コピー** です。
rem  もとは 1つ上の ..\yatai-hayashi-score などにあります。
rem  もとを直したら、このバッチをダブルクリックして取り込み直し、
rem  そのあと git で push してください。取り込まないと
rem  公開ページだけ古いままになります。
rem
rem  このファイルは Shift-JIS(CP932) で保存してください。
rem  UTF-8 で保存すると、日本語の行で cmd が止まります。
rem ============================================================

set "SRC=%~dp0.."
set "DST=%~dp0"

call :copyone yatai-hayashi-score      yatai
call :copyone kamakura-shichoume-score kamakura
rem 新囃子はまだ公開しません。公開するときは次の行の rem を外してください。
rem call :copyone shin-hayashi-score    shin

echo.
echo 取り込みが終わりました。
echo このあと git add / commit / push で公開されます。
pause
exit /b 0

:copyone
rem %1 = もとのフォルダ名 / %2 = 公開するフォルダ名
if not exist "%SRC%\%1\index.html" (
  echo [とばしました] %SRC%\%1 が見つかりません。
  exit /b 0
)
echo === %1 --^> %2 ===
if not exist "%DST%%2" mkdir "%DST%%2"
rem 公開に要るのは index.html と css と js だけ。
rem CLAUDE.md / README.md / Chromeで開く.bat は手元用なので持ってきません。
copy /y "%SRC%\%1\index.html" "%DST%%2\index.html" >nul
robocopy "%SRC%\%1\css" "%DST%%2\css" /MIR /NJH /NJS /NDL /NP >nul
robocopy "%SRC%\%1\js"  "%DST%%2\js"  /MIR /NJH /NJS /NDL /NP >nul
echo   取り込みました。
exit /b 0
