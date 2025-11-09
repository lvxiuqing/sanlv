import { supabase } from './supabase'

// 简单的密码哈希函数（使用浏览器内置的 crypto API）
const hashPassword = async (password) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

// 获取教师信息
export const getTeacher = async (grade, classNum) => {
  try {
    const gradeClass = `${grade}_${classNum}`
    
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('grade_class', gradeClass)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // 没有找到记录，返回 null
        return null
      }
      throw error
    }
    
    return data
  } catch (error) {
    console.error('获取教师信息失败:', error)
    return null
  }
}

// 创建教师账号（首次设置密码）
export const createTeacher = async (grade, classNum, password) => {
  try {
    const gradeClass = `${grade}_${classNum}`
    const passwordHash = await hashPassword(password)
    
    const { data, error } = await supabase
      .from('teachers')
      .insert([{
        grade_class: gradeClass,
        grade: grade,
        class: parseInt(classNum),
        password_hash: passwordHash,
        created_at: new Date().toISOString()
      }])
      .select()
    
    if (error) throw error
    
    return data[0]
  } catch (error) {
    console.error('创建教师账号失败:', error)
    throw error
  }
}

// 验证教师密码
export const verifyTeacherPassword = async (grade, classNum, password) => {
  try {
    const teacher = await getTeacher(grade, classNum)
    
    if (!teacher) {
      return { success: false, needSetup: true }
    }
    
    const passwordHash = await hashPassword(password)
    
    if (passwordHash === teacher.password_hash) {
      return { success: true, needSetup: false }
    }
    
    return { success: false, needSetup: false }
  } catch (error) {
    console.error('验证密码失败:', error)
    return { success: false, needSetup: false }
  }
}

// 修改教师密码
export const changeTeacherPassword = async (grade, classNum, oldPassword, newPassword) => {
  try {
    // 先验证旧密码
    const verifyResult = await verifyTeacherPassword(grade, classNum, oldPassword)
    
    if (!verifyResult.success) {
      throw new Error('原密码错误')
    }
    
    const gradeClass = `${grade}_${classNum}`
    const newPasswordHash = await hashPassword(newPassword)
    
    const { data, error } = await supabase
      .from('teachers')
      .update({ 
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('grade_class', gradeClass)
      .select()
    
    if (error) throw error
    
    return data[0]
  } catch (error) {
    console.error('修改密码失败:', error)
    throw error
  }
}

// 重置教师密码（管理员功能）
export const resetTeacherPassword = async (grade, classNum, newPassword) => {
  try {
    const gradeClass = `${grade}_${classNum}`
    const newPasswordHash = await hashPassword(newPassword)
    
    const { data, error } = await supabase
      .from('teachers')
      .update({ 
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('grade_class', gradeClass)
      .select()
    
    if (error) throw error
    
    return data[0]
  } catch (error) {
    console.error('重置密码失败:', error)
    throw error
  }
}

// 获取所有教师列表（管理员功能）
export const getAllTeachers = async () => {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('grade_class, grade, class, created_at, updated_at')
      .order('grade_class', { ascending: true })
    
    if (error) throw error
    
    return data || []
  } catch (error) {
    console.error('获取教师列表失败:', error)
    return []
  }
}
