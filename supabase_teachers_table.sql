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

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_teachers_grade_class ON teachers(grade_class);
CREATE INDEX IF NOT EXISTS idx_teachers_grade ON teachers(grade);
CREATE INDEX IF NOT EXISTS idx_teachers_class ON teachers(class);

-- 添加注释
COMMENT ON TABLE teachers IS '教师账号表';
COMMENT ON COLUMN teachers.grade_class IS '年级班级组合键，格式：一_1';
COMMENT ON COLUMN teachers.grade IS '年级，如：一、二、三';
COMMENT ON COLUMN teachers.class IS '班级号';
COMMENT ON COLUMN teachers.password_hash IS '密码哈希值';
COMMENT ON COLUMN teachers.created_at IS '创建时间';
COMMENT ON COLUMN teachers.updated_at IS '更新时间';
