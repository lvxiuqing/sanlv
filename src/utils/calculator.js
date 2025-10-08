// 成绩计算工具

// 计算学生总分
export const calculateTotalScore = (student, subjects) => {
  let total = 0
  subjects.forEach(subject => {
    const score = parseFloat(student[subject.name]) || 0
    total += score
  })
  return total
}

// 计算年级三率标准分
export const calculateGradeStandards = (allStudents, subjects) => {
  // 第一步：将年级所有学生总分成绩按照从高到低的顺序排列
  const sortedByTotal = [...allStudents]
    .sort((a, b) => b.totalScore - a.totalScore)
  
  // 第二步：参评人数取总人数的90%
  const evaluateCount = Math.floor(sortedByTotal.length * 0.9)
  const evaluateStudents = sortedByTotal.slice(0, evaluateCount)
  
  // 第三步：优秀率标准分 - 取参评人数的第前20%名学生分数
  // 例：90人参评，前20% = 18人，取第18名学生的分数（索引17）
  const excellentIndex = Math.floor(evaluateCount * 0.2) - 1
  const excellentStandard = excellentIndex >= 0 
    ? evaluateStudents[excellentIndex].totalScore 
    : evaluateStudents[0]?.totalScore || 0
  
  // 及格率标准分：取学科总分的60%的分数
  const totalPossibleScore = subjects.reduce((sum, s) => sum + s.totalScore, 0)
  const passStandard = totalPossibleScore * 0.6
  
  // 综合率标准分：取全部参评学生的总分平均分
  const avgScore = evaluateStudents.reduce((sum, s) => sum + s.totalScore, 0) / evaluateCount
  const comprehensiveStandard = avgScore
  
  return {
    excellentStandard,
    passStandard,
    comprehensiveStandard,
    evaluateCount
  }
}

// 计算年级各学科三率标准分
export const calculateSubjectStandards = (allStudents, subjects) => {
  const subjectStandards = {}
  
  // 参评人数取总人数的90%
  const evaluateCount = Math.floor(allStudents.length * 0.9)
  
  subjects.forEach(subject => {
    // 第一步：将年级所有学生的该学科成绩按照从高到低的顺序排列
    const sortedBySubject = [...allStudents]
      .sort((a, b) => (parseFloat(b[subject.name]) || 0) - (parseFloat(a[subject.name]) || 0))
    
    // 第二步：取前90%的学生作为参评学生
    const evaluateStudents = sortedBySubject.slice(0, evaluateCount)
    
    // 第三步：优秀率标准分 - 分别取各个学科参评人数的第前20%名学生分数
    // 例：90人参评，前20% = 18人，取第18名学生的分数（索引17）
    const excellentIndex = Math.floor(evaluateCount * 0.2) - 1
    const excellentStandard = excellentIndex >= 0
      ? (parseFloat(evaluateStudents[excellentIndex][subject.name]) || 0)
      : (parseFloat(evaluateStudents[0]?.[subject.name]) || 0)
    
    // 及格率标准分：分别取各个学科总分的60%的分数
    const passStandard = subject.totalScore * 0.6
    
    // 综合率标准分：分别取全部参评学生的该学科平均分
    const avgScore = evaluateStudents.reduce((sum, s) => 
      sum + (parseFloat(s[subject.name]) || 0), 0) / evaluateCount
    
    subjectStandards[subject.name] = {
      excellentStandard,
      passStandard,
      comprehensiveStandard: avgScore
    }
  })
  
  return subjectStandards
}

// 计算班级总分三率（修正版）
// allStudents: 全年级所有学生
// classStudents: 本班级学生
export const calculateClassRates = (classStudents, standards, allStudents) => {
  if (classStudents.length === 0) {
    return {
      excellentRate: 0,
      passRate: 0,
      comprehensiveRate: 0,
      totalRate: 0,
      evaluateCount: 0,
      evaluateStudents: []
    }
  }
  
  // 第一步：将全年级学生按总分从高到低排序
  const sortedByTotal = [...allStudents].sort((a, b) => b.totalScore - a.totalScore)
  
  // 第二步：取前90%作为参评学生
  const gradeEvaluateCount = Math.floor(sortedByTotal.length * 0.9)
  const gradeEvaluateStudents = sortedByTotal.slice(0, gradeEvaluateCount)
  
  // 第三步：找出本班级在参评范围内的学生
  const gradeEvaluateIds = new Set(gradeEvaluateStudents.map(s => s['姓名']))
  const classEvaluateStudents = classStudents.filter(s => gradeEvaluateIds.has(s['姓名']))
  const evaluateCount = classEvaluateStudents.length
  
  if (evaluateCount === 0) {
    return {
      excellentRate: 0,
      passRate: 0,
      comprehensiveRate: 0,
      totalRate: 0,
      evaluateCount: 0,
      evaluateStudents: []
    }
  }
  
  // 优秀率 = 本班参评学生中总分大于等于优秀率标准分的学生人数 / 本班参评人数 × 100%
  const excellentCount = classEvaluateStudents.filter(s => 
    s.totalScore >= standards.excellentStandard
  ).length
  const excellentRate = (excellentCount / evaluateCount) * 100
  
  // 及格率 = 本班参评学生中总分大于等于及格率标准分的学生人数 / 本班参评人数 × 100%
  const passCount = classEvaluateStudents.filter(s => 
    s.totalScore >= standards.passStandard
  ).length
  const passRate = (passCount / evaluateCount) * 100
  
  // 综合率 = 本班参评学生中总分大于等于综合率标准分的学生人数 / 本班参评人数 × 100%
  const comprehensiveCount = classEvaluateStudents.filter(s => 
    s.totalScore >= standards.comprehensiveStandard
  ).length
  const comprehensiveRate = (comprehensiveCount / evaluateCount) * 100
  
  // 三率之和
  const totalRate = excellentRate + passRate + comprehensiveRate
  
  return {
    excellentRate: excellentRate.toFixed(2),
    passRate: passRate.toFixed(2),
    comprehensiveRate: comprehensiveRate.toFixed(2),
    totalRate: totalRate.toFixed(2),
    evaluateCount,
    evaluateStudents: classEvaluateStudents.map(s => s['姓名'])
  }
}

// 计算班级各学科三率（修正版）
// allStudents: 全年级所有学生
// classStudents: 本班级学生
export const calculateClassSubjectRates = (classStudents, subjectName, subjectStandards, allStudents) => {
  if (classStudents.length === 0) {
    return {
      excellentRate: 0,
      passRate: 0,
      comprehensiveRate: 0,
      totalRate: 0,
      evaluateCount: 0,
      evaluateStudents: []
    }
  }
  
  // 第一步：将全年级学生按该学科分数从高到低排序
  const sortedBySubject = [...allStudents].sort((a, b) => 
    (parseFloat(b[subjectName]) || 0) - (parseFloat(a[subjectName]) || 0)
  )
  
  // 第二步：取前90%作为该学科的参评学生
  const gradeEvaluateCount = Math.floor(sortedBySubject.length * 0.9)
  const gradeEvaluateStudents = sortedBySubject.slice(0, gradeEvaluateCount)
  
  // 第三步：找出本班级在该学科参评范围内的学生
  const gradeEvaluateIds = new Set(gradeEvaluateStudents.map(s => s['姓名']))
  const classEvaluateStudents = classStudents.filter(s => gradeEvaluateIds.has(s['姓名']))
  const evaluateCount = classEvaluateStudents.length
  
  if (evaluateCount === 0) {
    return {
      excellentRate: 0,
      passRate: 0,
      comprehensiveRate: 0,
      totalRate: 0,
      evaluateCount: 0,
      evaluateStudents: []
    }
  }
  
  const standards = subjectStandards[subjectName]
  
  // 优秀率 = 本班该学科参评学生中分数大于等于优秀率标准分的学生人数 / 本班该学科参评人数 × 100%
  const excellentCount = classEvaluateStudents.filter(s => 
    (parseFloat(s[subjectName]) || 0) >= standards.excellentStandard
  ).length
  const excellentRate = (excellentCount / evaluateCount) * 100
  
  // 及格率 = 本班该学科参评学生中分数大于等于及格率标准分的学生人数 / 本班该学科参评人数 × 100%
  const passCount = classEvaluateStudents.filter(s => 
    (parseFloat(s[subjectName]) || 0) >= standards.passStandard
  ).length
  const passRate = (passCount / evaluateCount) * 100
  
  // 综合率 = 本班该学科参评学生中分数大于等于综合率标准分的学生人数 / 本班该学科参评人数 × 100%
  const comprehensiveCount = classEvaluateStudents.filter(s => 
    (parseFloat(s[subjectName]) || 0) >= standards.comprehensiveStandard
  ).length
  const comprehensiveRate = (comprehensiveCount / evaluateCount) * 100
  
  // 三率之和
  const totalRate = excellentRate + passRate + comprehensiveRate
  
  return {
    excellentRate: excellentRate.toFixed(2),
    passRate: passRate.toFixed(2),
    comprehensiveRate: comprehensiveRate.toFixed(2),
    totalRate: totalRate.toFixed(2),
    evaluateCount,
    evaluateStudents: classEvaluateStudents.map(s => s['姓名'])
  }
}

// 添加班级排名和年级排名
export const addRankings = (allStudents) => {
  // 按总分排序（年级排名）
  const sortedStudents = [...allStudents]
    .sort((a, b) => b.totalScore - a.totalScore)
  
  // 添加年级排名
  sortedStudents.forEach((student, index) => {
    student.gradeRank = index + 1
  })
  
  // 按班级分组并添加班级排名
  const classSorted = {}
  sortedStudents.forEach(student => {
    const classKey = student.class
    if (!classSorted[classKey]) {
      classSorted[classKey] = []
    }
    classSorted[classKey].push(student)
  })
  
  // 为每个班级添加班级排名
  Object.values(classSorted).forEach(classStudents => {
    classStudents
      .sort((a, b) => b.totalScore - a.totalScore)
      .forEach((student, index) => {
        student.classRank = index + 1
      })
  })
  
  return sortedStudents
}

