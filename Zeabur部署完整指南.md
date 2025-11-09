# 🚀 Zeabur 部署完整指南（含密码管理功能）

## 📋 部署前准备

### ✅ 已完成的准备工作
- ✅ 代码已推送到 GitHub（https://github.com/lvxiuqing/sanlv）
- ✅ Supabase 数据库已配置
- ✅ 密码管理功能已实现
- ✅ zbpack.json 配置文件已就绪

---

## 🎯 部署步骤（10分钟完成）

### 第一步：登录 Zeabur

1. **访问 Zeabur**
   - 打开浏览器：https://zeabur.com
   - 点击右上角 **"Sign in"**

2. **使用 GitHub 登录**
   - 选择 **"Continue with GitHub"**
   - 授权 Zeabur 访问您的 GitHub 账号
   - 首次登录会要求授权，点击 **"Authorize"**

---

### 第二步：创建项目

1. **新建项目**
   - 登录后，点击 **"Create Project"** 或 **"新建项目"**
   - 项目名称：`sanlv-score-system`（或您喜欢的名称）
   - 点击 **"Create"** 创建

2. **项目创建成功**
   - 会自动进入项目页面
   - 显示空白的项目面板

---

### 第三步：部署服务

1. **添加服务**
   - 在项目页面，点击 **"Add Service"** 或 **"添加服务"**
   - 选择 **"Git"**

2. **连接 GitHub 仓库**
   - 如果是首次使用，需要授权 Zeabur 访问 GitHub
   - 点击 **"Configure GitHub"** 或 **"配置 GitHub"**
   - 选择要授权的仓库：**lvxiuqing/sanlv**
   - 点击 **"Install & Authorize"**

3. **选择仓库**
   - 在仓库列表中找到 **lvxiuqing/sanlv**
   - 点击选择该仓库
   - 分支选择：**main**

4. **自动识别**
   - Zeabur 会自动识别为 **Vite** 项目
   - 自动读取 `zbpack.json` 配置
   - 显示构建命令：`npm install && npm run build`

5. **开始部署**
   - 点击 **"Deploy"** 或 **"部署"**
   - 开始自动构建和部署

---

### 第四步：等待部署完成

1. **查看构建日志**
   - 自动显示实时构建日志
   - 可以看到：
     ```
     Installing dependencies...
     Building project...
     Build completed!
     ```

2. **部署时间**
   - 首次部署约需 **2-3 分钟**
   - 后续更新约需 **1-2 分钟**

3. **部署成功标志**
   - 状态变为 **"Running"** 或 **"运行中"**
   - 显示绿色的运行图标 ✅

---

### 第五步：配置域名

1. **生成域名**
   - 点击服务卡片进入详情
   - 找到 **"Domains"** 或 **"域名"** 部分
   - 点击 **"Generate Domain"** 或 **"生成域名"**

2. **获取访问地址**
   - Zeabur 自动分配域名，例如：
     ```
     https://sanlv-xxxx.zeabur.app
     ```
   - 复制这个域名

3. **首次访问**
   - 点击域名或在浏览器中打开
   - 应该能看到成绩分析系统登录页面 🎉

---

### 第六步：配置数据库（重要！）

#### 在 Supabase 中创建教师表

1. **登录 Supabase**
   - 访问：https://supabase.com
   - 登录您的账号
   - 选择项目

2. **打开 SQL 编辑器**
   - 点击左侧菜单 **"SQL Editor"**
   - 点击 **"New Query"** 新建查询

3. **执行 SQL**
   - 复制以下 SQL 语句：
   ```sql
   -- 创建教师表
   CREATE TABLE IF NOT EXISTS teachers (
     id BIGSERIAL PRIMARY KEY,
     grade_class TEXT UNIQUE NOT NULL,
     grade TEXT NOT NULL,
     class INTEGER NOT NULL,
     password_hash TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- 创建索引
   CREATE INDEX IF NOT EXISTS idx_teachers_grade_class ON teachers(grade_class);
   CREATE INDEX IF NOT EXISTS idx_teachers_grade ON teachers(grade);
   CREATE INDEX IF NOT EXISTS idx_teachers_class ON teachers(class);
   ```

4. **运行 SQL**
   - 粘贴到编辑器
   - 点击 **"Run"** 或按 **Ctrl+Enter**
   - 看到 **"Success"** 提示

5. **验证表创建**
   - 点击左侧 **"Table Editor"**
   - 应该能看到 `teachers` 表
   - 确认表结构正确

---

## ✅ 部署成功！测试功能

### 1. 访问网站
- 打开 Zeabur 分配的域名
- 应该看到登录页面

### 2. 测试首次登录
1. 选择年级：**一年级**
2. 输入班级：**1**
3. 输入任意密码（触发设置）
4. 弹出密码设置窗口
5. 设置新密码（至少6位）
6. 确认密码
7. 提示"密码设置成功"

### 3. 测试正常登录
1. 使用刚才设置的密码登录
2. 应该能成功进入系统
3. 看到左侧菜单有"修改密码"选项

### 4. 测试密码修改
1. 点击"修改密码"
2. 输入原密码和新密码
3. 确认修改
4. 退出登录
5. 使用新密码登录

### 5. 测试管理员登录
1. 年级：任意
2. 班级：任意
3. 密码：`admin123`
4. 应该能以管理员身份登录

---

## 🌐 分享给其他老师

### 分享访问地址
将 Zeabur 域名发给同事：
```
https://你的项目名.zeabur.app
```

### 使用说明
1. **首次登录**
   - 选择自己的年级和班级
   - 输入任意密码触发设置
   - 设置自己的专属密码

2. **日常使用**
   - 使用自己设置的密码登录
   - 可随时修改密码

3. **数据同步**
   - 所有老师共享同一个数据库
   - 数据实时同步

---

## 🔄 代码更新流程

以后如果需要更新代码：

### 方法一：本地修改推送
```bash
# 1. 修改代码
# 2. 提交更改
git add .
git commit -m "更新说明"

# 3. 推送到 GitHub
git push origin main
```

### 方法二：GitHub 网页编辑
1. 在 GitHub 上直接编辑文件
2. 提交更改
3. Zeabur 自动检测并重新部署

### 自动部署
- Zeabur 会自动检测 GitHub 仓库的更新
- 自动触发重新构建和部署
- 约 1-2 分钟后更新生效

---

## 🎨 自定义域名（可选）

如果您有自己的域名：

### 添加自定义域名
1. 在 Zeabur 服务页面点击 **"Domains"**
2. 点击 **"Add Custom Domain"**
3. 输入域名：`score.yourdomain.com`

### 配置 DNS
在您的域名服务商（如阿里云、腾讯云）：
1. 添加 CNAME 记录
   - 类型：CNAME
   - 主机记录：score
   - 记录值：Zeabur 提供的 CNAME 值
2. 保存设置
3. 等待 DNS 生效（5-30分钟）

### 自动 HTTPS
- Zeabur 自动配置 SSL 证书
- 域名自动启用 HTTPS
- 无需额外配置

---

## 📊 监控和日志

### 查看访问日志
1. 进入 Zeabur 项目
2. 点击服务卡片
3. 选择 **"Logs"** 标签
4. 查看实时日志

### 监控服务状态
- **Running**：正常运行 ✅
- **Building**：正在构建 🔨
- **Error**：出现错误 ❌

### 重启服务
如果需要重启：
1. 点击服务设置
2. 选择 **"Restart"**
3. 等待重启完成

---

## ❓ 常见问题

### Q1: 部署失败怎么办？

**查看构建日志：**
1. 点击服务卡片
2. 查看 **"Logs"** 标签
3. 找到错误信息

**常见原因：**
- 依赖安装失败 → 重新部署
- 构建命令错误 → 检查 `zbpack.json`
- 内存不足 → 升级套餐（通常不会）

**解决方法：**
1. 点击 **"Redeploy"** 重新部署
2. 如果仍然失败，检查 GitHub 代码

---

### Q2: 域名无法访问？

**检查步骤：**
1. 等待 1-2 分钟（域名生效需要时间）
2. 清除浏览器缓存（Ctrl+Shift+Delete）
3. 使用无痕模式访问
4. 检查服务状态是否为 **"Running"**

**如果仍然无法访问：**
- 检查 Zeabur 服务是否正常运行
- 查看日志是否有错误
- 尝试重新生成域名

---

### Q3: 数据库连接失败？

**检查 Supabase 配置：**
1. 打开 `src/utils/supabase.js`
2. 确认 URL 和 Key 正确
3. 测试 Supabase 是否可访问

**检查教师表：**
1. 登录 Supabase
2. 查看 `teachers` 表是否存在
3. 如果不存在，执行 SQL 创建

---

### Q4: 首次登录无法设置密码？

**可能原因：**
- 教师表未创建
- 数据库连接失败

**解决方法：**
1. 检查 Supabase 中是否有 `teachers` 表
2. 查看浏览器控制台错误（F12）
3. 检查网络连接

---

### Q5: 忘记密码怎么办？

**临时解决方案：**
1. 登录 Supabase
2. 打开 SQL 编辑器
3. 执行删除命令：
   ```sql
   DELETE FROM teachers WHERE grade_class = '一_1';
   ```
4. 教师重新首次登录设置密码

**未来优化：**
- 可添加密码找回功能
- 管理员重置密码功能

---

### Q6: 如何查看已设置密码的班级？

**在 Supabase 中查看：**
1. 登录 Supabase
2. 点击 **"Table Editor"**
3. 选择 `teachers` 表
4. 可以看到所有已设置密码的班级

---

## 💰 费用说明

### Zeabur 免费额度
- ✅ 每月 $5 免费额度
- ✅ 您的项目预计消耗 < $1/月
- ✅ 完全在免费范围内
- ✅ 不需要绑定信用卡

### Supabase 免费额度
- ✅ 500MB 数据库存储
- ✅ 50,000 次/月 API 请求
- ✅ 足够长期使用

### 总费用
- **完全免费！** 🎉

---

## 🎯 部署后的优势

### 随时随地访问
- ✅ 任何设备浏览器访问
- ✅ 不需要安装任何软件
- ✅ 手机、平板、电脑都能用

### 多人协作
- ✅ 多位老师同时使用
- ✅ 数据实时同步
- ✅ 每人独立密码

### 自动更新
- ✅ 推送代码自动部署
- ✅ 无需手动操作
- ✅ 1-2分钟更新生效

### 安全可靠
- ✅ HTTPS 加密传输
- ✅ 密码加密存储
- ✅ 数据云端备份

---

## 📞 需要帮助？

### 遇到问题时
1. **查看日志**
   - Zeabur 构建日志
   - 浏览器控制台（F12）
   - Supabase 日志

2. **检查配置**
   - GitHub 代码是否最新
   - Supabase 表是否创建
   - 域名是否生效

3. **联系支持**
   - 提供具体错误信息
   - 截图错误页面
   - 说明操作步骤

---

## ✅ 部署检查清单

部署完成后，请确认：

- [ ] Zeabur 服务状态为 **"Running"**
- [ ] 域名可以正常访问
- [ ] 登录页面显示正常
- [ ] Supabase `teachers` 表已创建
- [ ] 首次登录可以设置密码
- [ ] 使用密码可以正常登录
- [ ] 修改密码功能正常
- [ ] 管理员登录正常（admin123）
- [ ] 数据上传和查看正常
- [ ] 多个班级密码独立

---

## 🎉 恭喜！

您已成功将成绩分析系统部署到 Zeabur！

现在您可以：
- ✅ 在任何地方访问系统
- ✅ 分享给其他老师使用
- ✅ 每位老师设置自己的密码
- ✅ 享受云端数据同步
- ✅ 自动更新和备份

**祝您使用愉快！** 📚✨

---

**提示：** 建议将 Zeabur 域名添加到浏览器书签，方便快速访问！
