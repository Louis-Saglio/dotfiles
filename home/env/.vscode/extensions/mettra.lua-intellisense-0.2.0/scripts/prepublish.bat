@echo off
echo "Compiling windows modules"
cd ../native-lua-parse
call node-gyp rebuild --verbose --arch=ia32 --target=1.3.7 --dist-url=https://atom.io/download/atom-shell
if %errorlevel% neq 0 exit /b %errorlevel%
copy ".\build\Release\lua_parser.node" "../server/node_modules/lua_parser/lua_parser_win32_ia32.node"
call node-gyp rebuild --verbose --arch=x64 --target=1.3.7 --dist-url=https://atom.io/download/atom-shell
if %errorlevel% neq 0 exit /b %errorlevel%
copy ".\build\Release\lua_parser.node" "../server/node_modules/lua_parser/lua_parser_win32_x64.node"

echo "Deleting previous share"
rmdir /S /Q "C:\Bridge\lua_native_parse"
mkdir "C:\Bridge\lua_native_parse"
mkdir "C:\Bridge\lua_native_parse\out"
xcopy "../native-lua-parse" "C:\Bridge\lua_native_parse"
xcopy /e /v /s /I "../native-lua-parse/src" "C:\Bridge\lua_native_parse\src"
echo "Compiling linux modules"
VBoxManage guestcontrol LinuxBix --username=wes --password=wes run --exe "/home/wes/compile.sh"
copy "C:\Bridge\lua_native_parse\out\lua_parser_linux_ia32.node" "../server/node_modules/lua_parser/lua_parser_linux_ia32.node"
if %errorlevel% neq 0 exit /b %errorlevel%
copy "C:\Bridge\lua_native_parse\out\lua_parser_linux_x64.node" "../server/node_modules/lua_parser/lua_parser_linux_x64.node"
if %errorlevel% neq 0 exit /b %errorlevel%