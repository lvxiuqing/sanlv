# ⚡ 快速部署到 Zeabur（5分钟）

## 🎯 一、登录 Zeabur

1. 访问：**https://zeabur.com**
2. 点击 **"Sign in"** → **"Continue with GitHub"**
3. 授权 Zeabur

---

## 📦 二、创建项目并部署

### 1. 创建项目
- 点击 **"Create Project"**
- 项目名：`sanlv-score-system`
- 点击 **"Create"**

### 2. 添加服务
- 点击 **"Add Service"** → **"Git"**
- 选择仓库：**lvxiuqing/sanlv**
- 分支：**main**
- 点击 **"Deploy"**

### 3. 等待部署
- 等待 2-3 分钟
- 状态变为 **"Running"** ✅

### 4. 生成域名
- 点击服务卡片
- **"Domains"** → **"Generate Domain"**
- 复制域名：`https://xxxx.zeabur.app`

---

## 🗄️ 三、配置数据库

### 在 Supabase 创建教师表

1. **登录 Supabase**：https://supabase.com
2. **打开 SQL 编辑器**：左侧菜单 → SQL Editor → New Query
3. **复制并执行以下 SQL**：

```sql
CREATE TABLE IF NOT EXISTS teachers (
  id BIGSERIAL PRIMARY KEY,
  grade_class TEXT UNIQUE NOT NULL,
  grade TEXT NOT NULL,
  class INTEGER NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teachers_grade_class ON teachers(grade_class);
CREATE INDEX IF NOT EXISTS idx_teachers_grade ON teachers(grade);
CREATE INDEX IF NOT EXISTS idx_teachers_class ON teachers(class);
```

4. **点击 Run** 执行
5. **验证**：Table Editor 中查看 `teachers` 表

---

## ✅ 四、测试访问

1. **打开域名**：访问 Zeabur 分配的域名
2. **首次登录**：
   - 选择年级：一
   - 班级：1
   - 输入任意密码
   - 设置新密码（至少6位）
3. **正常登录**：使用设置的密码登录
4. **测试功能**：上传成绩、查看数据

---

## 🎉 完成！

现在可以：
- ✅ 分享域名给其他老师
- ✅ 每位老师设置自己的密码
- ✅ 随时随地访问系统

---

## 📞 遇到问题？

查看详细指南：`Zeabur部署完整指南.md`

---

**部署时间：** 约 5-10 分钟  
**费用：** 完全免费 💰
