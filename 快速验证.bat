@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   AI 分析功能 - 快速验证
echo ========================================
echo.

REM 检查后端是否运行
echo 【步骤1】检查后端服务...
timeout /t 1 /nobreak >nul

for /f "tokens=*" %%i in ('curl -s http://localhost:3001/health 2^>nul') do set HEALTH=%%i

if "!HEALTH!"=="" (
    echo ❌ 后端服务未运行
    echo.
    echo 请在新的终端窗口运行：
    echo   npm run dev:server
    echo.
    pause
    exit /b 1
) else (
    echo ✅ 后端服务正常运行
)

REM 检查环境变量
echo.
echo 【步骤2】检查环境变量...
if exist ".env.local" (
    findstr /i "DEEPSEEK_API_KEY" .env.local >nul
    if errorlevel 1 (
        echo ⚠️  DEEPSEEK_API_KEY 未配置
        echo.
        echo 请编辑 .env.local 文件，添加：
        echo   DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxx
        echo.
        pause
        exit /b 1
    ) else (
        echo ✅ DEEPSEEK_API_KEY 已配置
    )
) else (
    echo ⚠️  .env.local 文件不存在
    echo.
    echo 请复制 .env.example 为 .env.local：
    echo   copy .env.example .env.local
    echo.
    pause
    exit /b 1
)

REM 检查前端是否运行
echo.
echo 【步骤3】检查前端服务...
curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    echo ⚠️  前端服务未运行
    echo.
    echo 请在新的终端窗口运行：
    echo   npm run dev
    echo.
) else (
    echo ✅ 前端服务正常运行
)

echo.
echo ========================================
echo   ✅ 所有检查完成！
echo ========================================
echo.
echo 现在可以：
echo 1. 打开浏览器访问 http://localhost:3000
echo 2. 登录系统（管理员账号）
echo 3. 进入"成绩总览"页面
echo 4. 点击"生成AI智能分析报告"按钮
echo.
echo 如果仍有问题，请查看：
echo   - API404错误排查.md
echo   - 诊断AI分析问题.bat
echo   - 测试后端API.js
echo.
pause
