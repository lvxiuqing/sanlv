@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   小学成绩分析系统 - AI 分析功能启动
echo ========================================
echo.

REM 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：未检测到 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js 已安装

REM 检查 node_modules
if not exist "node_modules" (
    echo.
    echo 📦 正在安装依赖包...
    call npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

echo ✅ 依赖已就绪

REM 检查环境变量
if not exist ".env.local" (
    echo.
    echo ⚠️  未找到 .env.local 文件
    echo 正在从 .env.example 创建...
    if exist ".env.example" (
        copy .env.example .env.local >nul
        echo ✅ .env.local 已创建，请编辑并填入 DEEPSEEK_API_KEY
    )
)

echo.
echo ========================================
echo   启动配置
echo ========================================
echo.
echo 前端服务: http://localhost:3000
echo 后端服务: http://localhost:3001
echo.
echo 请确保已配置 DEEPSEEK_API_KEY 环境变量
echo.
echo ========================================
echo.

REM 启动前后端
echo 🚀 启动前端服务 (Vite)...
start "前端服务" cmd /k "npm run dev"

timeout /t 3 /nobreak

echo 🚀 启动后端服务 (Express)...
start "后端服务" cmd /k "npm run dev:server"

echo.
echo ✅ 服务已启动！
echo.
echo 📝 使用说明：
echo 1. 前端会自动打开浏览器 (http://localhost:3000)
echo 2. 使用管理员账号登录
echo 3. 进入"成绩总览"页面
echo 4. 点击"生成AI智能分析报告"按钮
echo.
echo 💡 提示：
echo - 如果 AI 分析失败，检查后端服务是否正常运行
echo - 查看浏览器控制台（F12）的错误信息
echo - 确认 DEEPSEEK_API_KEY 已正确配置
echo.
echo 按任意键关闭此窗口...
pause >nul
