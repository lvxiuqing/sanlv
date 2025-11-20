import { supabase } from './supabase'

// 获取所有数据
export const getAllData = async () => {
  try {
    // 获取成绩记录
    const { data: records, error: recordsError } = await supabase
      .from('score_records')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (recordsError) throw recordsError
    
    // 获取学科配置
    const { data: subjectConfigs, error: subjectsError } = await supabase
      .from('subject_configs')
      .select('*')
    
    if (subjectsError) throw subjectsError
    
    // 转换学科配置为对象格式
    const subjects = {}
    subjectConfigs?.forEach(config => {
      subjects[config.grade_class] = config.subjects
    })
    
    return {
      records: records || [],
      subjects: subjects
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    return { records: [], subjects: {} }
  }
}

// 保存数据记录
export const saveRecord = async (record) => {
  try {
    // 生成唯一ID
    record.timestamp = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('score_records')
      .insert([{
        grade: record.grade,
        class: record.class,
        subjects: record.subjects,
        students: record.students,
        created_at: record.timestamp
      }])
      .select()
    
    if (error) throw error
    
    return data[0]
  } catch (error) {
    console.error('保存记录失败:', error)
    throw error
  }
}

// 保存学科配置
export const saveSubjects = async (grade, classNum, subjects) => {
  try {
    const gradeClass = `${grade}_${classNum}`
    
    const { data, error } = await supabase
      .from('subject_configs')
      .upsert([{
        grade_class: gradeClass,
        subjects: subjects
      }], {
        onConflict: 'grade_class'
      })
      .select()
    
    if (error) throw error
    
    return subjects
  } catch (error) {
    console.error('保存学科配置失败:', error)
    throw error
  }
}

// 获取学科配置
export const getSubjects = async (grade, classNum) => {
  try {
    const gradeClass = `${grade}_${classNum}`
    
    const { data, error } = await supabase
      .from('subject_configs')
      .select('*')
      .eq('grade_class', gradeClass)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // 没有找到记录
        return null
      }
      throw error
    }
    
    return data?.subjects || null
  } catch (error) {
    console.error('获取学科配置失败:', error)
    return null
  }
}

// 获取指定年级和班级的记录
export const getRecordsByGradeClass = async (grade, classNum = null) => {
  try {
    let query = supabase
      .from('score_records')
      .select('*')
      .eq('grade', grade)
      .order('created_at', { ascending: false })
    
    if (classNum !== null) {
      query = query.eq('class', classNum)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return data || []
  } catch (error) {
    console.error('获取记录失败:', error)
    return []
  }
}

// 获取最新的记录
export const getLatestRecord = async (grade, classNum) => {
  try {
    const records = await getRecordsByGradeClass(grade, classNum)
    if (records.length === 0) return null
    return records[0] // 已经按时间降序排列
  } catch (error) {
    console.error('获取最新记录失败:', error)
    return null
  }
}

// 清除所有数据
export const clearAllData = async () => {
  try {
    // 先获取所有记录ID，确保全部删除
    const { data: allRecords } = await supabase
      .from('score_records')
      .select('id')
    
    const { data: allConfigs } = await supabase
      .from('subject_configs')
      .select('id')
    
    // 删除所有成绩记录（包括历史成绩明细）
    if (allRecords && allRecords.length > 0) {
      const { error: recordsError } = await supabase
        .from('score_records')
        .delete()
        .in('id', allRecords.map(r => r.id))
      
      if (recordsError) throw recordsError
    }
    
    // 删除所有学科配置
    if (allConfigs && allConfigs.length > 0) {
      const { error: subjectsError } = await supabase
        .from('subject_configs')
        .delete()
        .in('id', allConfigs.map(c => c.id))
      
      if (subjectsError) throw subjectsError
    }
    
    console.log(`已清除 ${allRecords?.length || 0} 条成绩记录（含历史记录）`)
    console.log(`已清除 ${allConfigs?.length || 0} 条学科配置`)
    
    return {
      deletedRecords: allRecords?.length || 0,
      deletedConfigs: allConfigs?.length || 0
    }
  } catch (error) {
    console.error('清除数据失败:', error)
    throw error
  }
}

// 获取所有年级列表
export const getAllGrades = async () => {
  try {
    const { data, error } = await supabase
      .from('score_records')
      .select('grade')
    
    if (error) throw error
    
    const grades = new Set(data.map(r => r.grade))
    return Array.from(grades).sort()
  } catch (error) {
    console.error('获取年级列表失败:', error)
    return []
  }
}

// 获取指定年级的所有班级
export const getClassesByGrade = async (grade) => {
  try {
    const { data, error } = await supabase
      .from('score_records')
      .select('class')
      .eq('grade', grade)
    
    if (error) throw error
    
    const classes = new Set(data.map(r => r.class))
    return Array.from(classes).sort((a, b) => a - b)
  } catch (error) {
    console.error('获取班级列表失败:', error)
    return []
  }
}

// 清除指定班级的所有旧数据
export const clearClassData = async (grade, classNum) => {
  try {
    // 获取该班级的所有记录
    const { data: classRecords, error: selectError } = await supabase
      .from('score_records')
      .select('id')
      .eq('grade', grade)
      .eq('class', classNum)
    
    if (selectError) throw selectError
    
    if (!classRecords || classRecords.length === 0) {
      return {
        deletedRecords: 0,
        message: '该班级没有旧数据'
      }
    }
    
    // 删除该班级的所有记录
    const { error: deleteError } = await supabase
      .from('score_records')
      .delete()
      .in('id', classRecords.map(r => r.id))
    
    if (deleteError) throw deleteError
    
    console.log(`已清除 ${grade} 年级 ${classNum} 班的 ${classRecords.length} 条成绩记录`)
    
    return {
      deletedRecords: classRecords.length,
      message: `已清除 ${classRecords.length} 条旧成绩记录`
    }
  } catch (error) {
    console.error('清除班级数据失败:', error)
    throw error
  }
}
