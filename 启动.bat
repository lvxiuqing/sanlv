@echo off
chcp 65001 >nul
echo ========================================
echo    小学成绩分析系统
echo ========================================
echo.

REM 检查Node.js是否安装
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js！
    echo.
    echo 请先安装 Node.js：
    echo 1. 访问 https://nodejs.org/
    echo 2. 下载并安装 LTS 版本
    echo 3. 安装完成后重启电脑
    echo 4. 再次运行此脚本
    echo.
    pause
    exit /b 1
)

echo [检测] Node.js 已安装
node --version
npm --version
echo.

REM 检查是否已安装依赖
if not exist "node_modules" (
    echo [提示] 首次运行，正在安装依赖...
    echo 这可能需要几分钟时间，请稍候...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [错误] 依赖安装失败！
        echo 请检查网络连接后重试
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [成功] 依赖安装完成！
    echo.
)

echo [启动] 正在启动开发服务器...
echo.
echo 浏览器将自动打开 http://localhost:3000
echo.
echo 按 Ctrl+C 可以停止服务器
echo ========================================
echo.

call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [错误] 启动失败！
    echo.
    pause
    exit /b 1
)

