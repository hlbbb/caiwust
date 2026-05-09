// ========== 智能推题系统 ==========

// 用户画像存储（按考试隔离）
function getStorageKey(suffix) {
  const exam = localStorage.getItem('kuaiji_selected_exam') || 'junior'
  return `kuaiji_${exam}_${suffix}`
}

function getDefaultProfile() {
  const boardOrder = getBoardOrder()
  const weights = {}
  boardOrder.forEach(cat => {
    weights[cat] = { weight: 1.0, correct: 0, wrong: 0, mastered: false }
  })
  return {
    level: 1,
    levelName: '会计小白',
    assessmentDone: false,
    boardWeights: weights,
    promotion: {
      eligible: false,
      lastChallengeTime: null,
      challengeCount: 0,
      cooldownUntil: null
    }
  }
}

function getUserProfile() {
  try {
    const raw = localStorage.getItem(getStorageKey('user_profile'))
    if (!raw) return null
    const profile = JSON.parse(raw)
    const boardOrder = getBoardOrder()
    boardOrder.forEach(cat => {
      if (!profile.boardWeights[cat]) {
        profile.boardWeights[cat] = { weight: 1.0, correct: 0, wrong: 0, mastered: false }
      }
    })
    if (!profile.promotion) {
      profile.promotion = { eligible: false, lastChallengeTime: null, challengeCount: 0, cooldownUntil: null }
    }
    return profile
  } catch {
    return null
  }
}

function saveUserProfile(profile) {
  localStorage.setItem(getStorageKey('user_profile'), JSON.stringify(profile))
}

function getDoneQuestions() {
  try {
    return JSON.parse(localStorage.getItem(getStorageKey('done_questions')) || '[]')
  } catch {
    return []
  }
}

function saveDoneQuestions(ids) {
  localStorage.setItem(getStorageKey('done_questions'), JSON.stringify(ids))
}

// 板块权重计算
function calculateWeight(entry) {
  const baseWeight = 1.0
  const wrongBonus = Math.min(entry.wrong * 0.15, 2.0)
  const masterDecay = Math.min(entry.correct * 0.05, 1.5)
  const raw = baseWeight + wrongBonus - masterDecay
  return Math.max(0.2, raw)
}

function recalculateAllWeights(boardWeights) {
  const result = {}
  const boardOrder = getBoardOrder()
  boardOrder.forEach(cat => {
    const entry = { ...boardWeights[cat] }
    if (entry.mastered) {
      entry.weight = 0.1
    } else {
      entry.weight = calculateWeight(entry)
    }
    result[cat] = entry
  })
  return result
}

function checkMastery(boardWeights) {
  const result = {}
  const boardOrder = getBoardOrder()
  boardOrder.forEach(cat => {
    const entry = boardWeights[cat]
    const total = entry.correct + entry.wrong
    const acc = total > 0 ? entry.correct / total : 0
    result[cat] = { ...entry, mastered: total >= 30 && acc > 0.8 }
  })
  return result
}

function isAllMastered(boardWeights) {
  const boardOrder = getBoardOrder()
  return boardOrder.every(cat => boardWeights[cat].mastered)
}

// 获取当前考试题目
function getExamQuestions() {
  const exam = localStorage.getItem('kuaiji_selected_exam') || 'junior'
  return (typeof QUESTIONS !== 'undefined' ? QUESTIONS : []).filter(q => q.exam === exam)
}

// 智能选题
function pickDifficulty(level) {
  const levelDef = LEVELS.find(l => l.level === level) || LEVELS[0]
  const r = Math.random()
  const { easy, medium, hard } = levelDef.difficulty
  if (r < easy) return 'easy'
  if (r < easy + medium) return 'medium'
  return 'hard'
}

function pickBoard(boardWeights) {
  const boardOrder = getBoardOrder()
  const entries = boardOrder.filter(cat => !boardWeights[cat].mastered)
  if (entries.length === 0) return boardOrder[Math.floor(Math.random() * boardOrder.length)]

  const totalWeight = entries.reduce((sum, cat) => sum + boardWeights[cat].weight, 0)
  let r = Math.random() * totalWeight
  for (const cat of entries) {
    r -= boardWeights[cat].weight
    if (r <= 0) return cat
  }
  return entries[entries.length - 1]
}

function smartPickQuestion() {
  const profile = getUserProfile()
  if (!profile) return null

  const { boardWeights } = profile
  const allQ = getExamQuestions()
  let doneIds = getDoneQuestions()

  let available = allQ.filter(q => !doneIds.includes(q.id))

  if (available.length < 10) {
    doneIds = []
    saveDoneQuestions(doneIds)
    available = [...allQ]
  }

  const board = pickBoard(boardWeights)
  const difficulty = pickDifficulty(profile.level)

  let candidates = available.filter(q => q.category === board && q.difficulty === difficulty)
  if (candidates.length === 0) candidates = available.filter(q => q.category === board)
  if (candidates.length === 0) candidates = available.filter(q => q.difficulty === difficulty)
  if (candidates.length === 0) candidates = available
  if (candidates.length === 0) return null

  return candidates[Math.floor(Math.random() * candidates.length)]
}

// 答题后更新权重
function updateAfterAnswer(questionId, isCorrect) {
  const profile = getUserProfile()
  if (!profile) return

  const q = (typeof QUESTIONS !== 'undefined' ? QUESTIONS : []).find(qq => qq.id === questionId)
  if (!q) return

  const entry = profile.boardWeights[q.category]
  if (!entry) return

  if (isCorrect) {
    entry.correct += 1
  } else {
    entry.wrong += 1
  }

  profile.boardWeights = recalculateAllWeights(checkMastery(profile.boardWeights))
  saveUserProfile(profile)

  const done = getDoneQuestions()
  if (!done.includes(questionId)) {
    done.push(questionId)
    saveDoneQuestions(done)
  }
}
