// ========== 自适应水平测评 ==========

let assessmentState = null

function createAssessment() {
  return {
    currentDifficulty: 'easy',
    currentBoardIndex: 0,
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
    totalCorrect: 0,
    totalWrong: 0,
    totalQuestions: 0,
    hardStreak: 0,
    easyFailStreak: 0,
    skipCount: 0,
    answers: [],
    boardResults: {},
    finished: false,
    questions: []
  }
}

function startAssessment() {
  assessmentState = createAssessment()
  renderAssessment()
  showPage('assessment')
}

function pickAssessmentQuestion() {
  const st = assessmentState
  const boardOrder = getBoardOrder()
  const board = boardOrder[st.currentBoardIndex % boardOrder.length]
  const allQ = getExamQuestions()

  let candidates = allQ.filter(q =>
    q.category === board &&
    q.difficulty === st.currentDifficulty &&
    !st.questions.includes(q.id)
  )

  if (candidates.length === 0) {
    candidates = allQ.filter(q =>
      q.category === board &&
      !st.questions.includes(q.id)
    )
  }

  if (candidates.length === 0) {
    const tried = new Set(st.questions)
    candidates = allQ.filter(q =>
      q.difficulty === st.currentDifficulty && !tried.has(q.id)
    )
  }

  if (candidates.length === 0) {
    candidates = allQ.filter(q => !st.questions.includes(q.id))
  }

  if (candidates.length === 0) return null
  return candidates[Math.floor(Math.random() * candidates.length)]
}

function processAssessmentAnswer(questionId, isCorrect) {
  const st = assessmentState
  const allQ = typeof QUESTIONS !== 'undefined' ? QUESTIONS : []
  const q = allQ.find(qq => qq.id === questionId)
  if (!q) return

  const board = q.category
  st.totalQuestions++
  st.answers.push({ questionId, board, difficulty: q.difficulty, correct: isCorrect })
  st.questions.push(questionId)

  if (!st.boardResults[board]) st.boardResults[board] = { correct: 0, wrong: 0 }
  if (isCorrect) {
    st.boardResults[board].correct++
    st.totalCorrect++
    st.consecutiveCorrect++
    st.consecutiveWrong = 0

    if (st.consecutiveCorrect >= 2) {
      st.currentDifficulty = upgradeDifficulty(st.currentDifficulty)
      st.consecutiveCorrect = 0
    }
  } else {
    st.boardResults[board].wrong++
    st.totalWrong++
    st.consecutiveWrong++
    st.consecutiveCorrect = 0

    if (st.consecutiveWrong >= 2) {
      st.currentDifficulty = downgradeDifficulty(st.currentDifficulty)
      st.consecutiveWrong = 0
    }
  }

  if (isCorrect && q.difficulty === 'hard') {
    st.hardStreak++
    st.easyFailStreak = 0
  } else if (!isCorrect && q.difficulty === 'easy') {
    st.easyFailStreak++
    st.hardStreak = 0
  } else {
    if (q.difficulty !== 'hard') st.hardStreak = 0
    if (q.difficulty !== 'easy') st.easyFailStreak = 0
  }

  st.currentBoardIndex++
  checkAssessmentEnd()
}

function upgradeDifficulty(d) {
  if (d === 'easy') return 'medium'
  if (d === 'medium') return 'hard'
  return 'hard'
}

function downgradeDifficulty(d) {
  if (d === 'hard') return 'medium'
  if (d === 'medium') return 'easy'
  return 'easy'
}

function checkAssessmentEnd() {
  const st = assessmentState
  if (st.hardStreak >= 3) { finishAssessment(); return }
  if (st.easyFailStreak >= 3) { finishAssessment(); return }
  if (st.totalQuestions >= 12) { finishAssessment(); return }
  if (st.totalQuestions >= 8 && st.skipCount >= 2) { finishAssessment(); return }
}

function finishAssessment() {
  const st = assessmentState
  st.finished = true

  const score = st.totalQuestions > 0
    ? Math.round(st.totalCorrect / st.totalQuestions * 100)
    : 0

  let level
  if (st.hardStreak >= 3) level = 5
  else if (st.easyFailStreak >= 3) level = 1
  else level = scoreToLevel(score)

  const boardOrder = getBoardOrder()
  const weights = {}
  boardOrder.forEach(cat => {
    const result = st.boardResults[cat]
    if (result && result.correct > 0) {
      weights[cat] = { weight: 0.6, correct: 0, wrong: 0, mastered: false }
    } else if (result && result.wrong > 0) {
      weights[cat] = { weight: 1.5, correct: 0, wrong: 0, mastered: false }
    } else {
      weights[cat] = { weight: 1.0, correct: 0, wrong: 0, mastered: false }
    }
  })

  const levelDef = getLevelDef(level)
  const profile = {
    level,
    levelName: levelDef.name,
    assessmentDone: true,
    boardWeights: weights,
    promotion: { eligible: false, lastChallengeTime: null, challengeCount: 0, cooldownUntil: null },
    assessmentScore: score,
    assessmentAnswers: st.answers
  }

  saveUserProfile(profile)
  saveDoneQuestions(st.questions)
}

function scoreToLevel(score) {
  if (score <= 30) return 1
  if (score <= 50) return 2
  if (score <= 70) return 3
  if (score <= 90) return 4
  return 5
}

function skipAssessment() {
  let profile = getUserProfile()
  if (!profile || !profile.assessmentDone) {
    profile = getDefaultProfile()
    profile.assessmentDone = true
    saveUserProfile(profile)
  }
}

// ========== 测评页渲染 ==========
let assessSelected = null
let assessShowResult = false

function renderAssessment() {
  const st = assessmentState
  if (!st) return

  const container = document.getElementById('assessment-content')

  if (st.finished) {
    renderAssessmentResult(container)
    return
  }

  const q = pickAssessmentQuestion()
  if (!q) {
    finishAssessment()
    renderAssessment()
    return
  }

  container.innerHTML = `
    <div class="nav-bar">
      <span class="nav-back" onclick="showPage('home')">
        <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
      </span>
      <span class="nav-title">水平测评 ${st.totalQuestions + 1}/12</span>
    </div>
    <span class="progress-text">第 ${st.totalQuestions + 1} 题，约还需 ${Math.max(1, 5 - st.totalQuestions)} 分钟</span>
    <div class="progress-bar">
      <div class="progress-fill" style="width:${(st.totalQuestions / 12) * 100}%"></div>
    </div>
    <div class="question-meta">
      ${diffTag(q.difficulty)}
      <span class="tag">${getCategories()[q.category] || q.category}</span>
    </div>
    <div class="card">
      <div class="practice-stem">${q.stem}</div>
    </div>
    <div class="options-area" id="assess-options">
      ${q.options.map(o => `
        <div class="option-card" onclick="selectAssessOption('${o.label}', ${q.id})">
          <div class="option-label">${o.label}</div>
          <div class="option-text">${o.text}</div>
        </div>
      `).join('')}
    </div>
  `
}

function selectAssessOption(label, questionId) {
  if (assessShowResult) return
  assessSelected = label
  assessShowResult = true

  const allQ = typeof QUESTIONS !== 'undefined' ? QUESTIONS : []
  const q = allQ.find(qq => qq.id === questionId)
  if (!q) return
  const isCorrect = q.options.find(o => o.label === label)?.correct || false

  document.querySelectorAll('#assess-options .option-card').forEach(card => {
    const optLabel = card.querySelector('.option-label').textContent.trim()
    if (q.options.find(o => o.label === optLabel)?.correct) card.classList.add('correct')
    if (optLabel === label && !isCorrect) card.classList.add('wrong')
  })

  saveRecord({
    questionId: q.id,
    chosenOption: label,
    isCorrect,
    time: new Date().toISOString()
  })

  processAssessmentAnswer(questionId, isCorrect)

  setTimeout(() => {
    assessSelected = null
    assessShowResult = false
    renderAssessment()
  }, isCorrect ? 800 : 1500)
}

function renderAssessmentResult(container) {
  const profile = getUserProfile()
  if (!profile) return

  const score = profile.assessmentScore || 0
  const levelDef = getLevelDef(profile.level)
  const iconSvg = getLevelIcon(profile.level)
  const levelColor = getLevelColor(profile.level)
  const records = getRecords()
  const config = getExamConfig()

  container.innerHTML = `
    <div class="assessment-result">
      <div class="result-header" style="--level-color: ${levelColor}">
        <div class="result-icon level-up-anim">${iconSvg}</div>
        <div class="result-level">${levelDef.name}</div>
        <div class="result-score">测评得分 ${score} 分 · ${config.shortName}</div>
        <div class="result-desc">${levelDef.desc}</div>
      </div>
      <div class="card">
        <div class="section-title">各板块正确率</div>
        <canvas id="radar-chart" width="400" height="400" style="width:100%;max-width:400px;margin:0 auto;display:block"></canvas>
        <div class="radar-legend">
          ${Object.entries(getCategories()).map(([key, name]) => {
            const catRecords = records.filter(r => {
              const qq = getExamQuestions().find(qqq => qqq.id === r.questionId)
              return qq && qq.category === key
            })
            const catTotal = catRecords.length
            const catCorrect = catRecords.filter(r => r.isCorrect).length
            const catAcc = catTotal > 0 ? Math.round(catCorrect / catTotal * 100) : 0
            const dotColor = catAcc >= 80 ? 'var(--success)' : catAcc >= 50 ? 'var(--warning)' : 'var(--danger)'
            return `<div class="radar-legend-item">
              <span class="radar-legend-dot" style="background:${dotColor}"></span>
              <span class="radar-legend-name">${name}</span>
              <span class="radar-legend-val">${catAcc}%</span>
            </div>`
          }).join('')}
        </div>
      </div>
      <div class="action-row">
        <div class="action-btn btn-primary" onclick="showPage('home');refreshHome()">开始学习</div>
        <div class="action-btn btn-outline" onclick="skipAssessment();showPage('home');refreshHome()">自由刷题</div>
      </div>
    </div>
  `

  setTimeout(() => drawRadarChart(records), 100)
}
