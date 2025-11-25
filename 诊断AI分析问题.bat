@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   AI 分析功能 - 故障诊断工具
echo ========================================
echo.

REM 检查 Node.js
echo 【检查1】Node.js 环境
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装或不在 PATH 中
    echo 解决方案：https://nodejs.org/
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js 版本: !NODE_VERSION!
)

REM 检查 npm
echo.
echo 【检查2】npm 包管理器
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm 未安装
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✅ npm 版本: !NPM_VERSION!
)

REM 检查依赖
echo.
echo 【检查3】项目依赖
if exist "node_modules" (
    echo ✅ node_modules 目录存在
    if exist "node_modules\express" (
        echo ✅ express 已安装
    ) else (
        echo ❌ express 未安装，运行: npm install
    )
    if exist "node_modules\cors" (
        echo ✅ cors 已安装
    ) else (
        echo ❌ cors 未安装，运行: npm install
    )
) else (
    echo ❌ node_modules 目录不存在
    echo 解决方案：运行 npm install
)

REM 检查环境变量
echo.
echo 【检查4】环境变量配置
if exist ".env.local" (
    echo ✅ .env.local 文件存在
    findstr /i "DEEPSEEK_API_KEY" .env.local >nul
    if errorlevel 1 (
        echo ⚠️  DEEPSEEK_API_KEY 未配置
        echo 解决方案：编辑 .env.local，添加你的 API Key
    ) else (
        echo ✅ DEEPSEEK_API_KEY 已配置
    )
) else (
    echo ⚠️  .env.local 文件不存在
    if exist ".env.example" (
        echo 解决方案：复制 .env.example 为 .env.local
        echo 命令：copy .env.example .env.local
    )
)

REM 检查后端文件
echo.
echo 【检查5】后端文件
if exist "server\index.js" (
    echo ✅ server/index.js 存在
) else (
    echo ❌ server/index.js 不存在
)
if exist "server\ai-analysis.js" (
    echo ✅ server/ai-analysis.js 存在
) else (
    echo ❌ server/ai-analysis.js 不存在
)

REM 检查前端文件
echo.
echo 【检查6】前端文件
if exist "src\pages\OverviewPage.jsx" (
    echo ✅ src/pages/OverviewPage.jsx 存在
) else (
    echo ❌ src/pages/OverviewPage.jsx 不存在
)

REM 检查端口占用
echo.
echo 【检查7】端口占用情况
echo 检查端口 3000 (前端)...
netstat -ano | findstr ":3000" >nul
if errorlevel 1 (
    echo ✅ 端口 3000 未被占用
) else (
    echo ⚠️  端口 3000 已被占用
    echo 解决方案：关闭占用该端口的程序或修改前端端口
)

echo 检查端口 3001 (后端)...
netstat -ano | findstr ":3001" >nul
if errorlevel 1 (
    echo ✅ 端口 3001 未被占用
) else (
    echo ⚠️  端口 3001 已被占用
    echo 解决方案：关闭占用该端口的程序或修改后端端口
)

REM 测试后端连接
echo.
echo 【检查8】后端服务连接
echo 尝试连接 http://localhost:3001/health...
curl -s http://localhost:3001/health >nul 2>&1
if errorlevel 1 (
    echo ⚠️  后端服务未运行或无法连接
    echo 解决方案：运行 npm run dev:server
) else (
    echo ✅ 后端服务正常运行
)

echo.
echo ========================================
echo   诊断完成
echo ========================================
echo.
echo 常见问题解决方案：
echo.
echo 1. "API 请求失败"
echo    - 确保后端服务正在运行 (npm run dev:server)
echo    - 检查端口 3001 是否被占用
echo    - 查看浏览器控制台错误信息
echo.
echo 2. "DeepSeek API Error"
echo    - 检查 DEEPSEEK_API_KEY 是否正确
echo    - 验证 API Key 是否已过期
echo    - 确认账户余额充足
echo.
echo 3. "分析文本不完整"
echo    - 检查网络连接
echo    - 尝试重新生成分析
echo    - 查看浏览器控制台日志
echo.
echo 4. "前端无法加载"
echo    - 确保前端服务正在运行 (npm run dev)
echo    - 检查端口 3000 是否被占用
echo    - 清除浏览器缓存
echo.
echo 需要更多帮助？查看 AI_ANALYSIS_SETUP.md
echo.
pause
