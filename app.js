// ========== 应用核心：路由、数据存储、考试选择、首页、初始化 ==========

// ---------- 1. 数据存储辅助 ----------

function getRecords() {
  try {
    return JSON.parse(localStorage.getItem(getStorageKey('records')) || '[]')
  } catch {
    return []
  }
}

function saveRecord(record) {
  const records = getRecords()
  records.push(record)
  localStorage.setItem(getStorageKey('records'), JSON.stringify(records))
}

function getWrongBook() {
  try {
    return JSON.parse(localStorage.getItem(getStorageKey('wrong_book')) || '[]')
  } catch {
    return []
  }
}

function addToWrongBook(questionId) {
  const book = getWrongBook()
  const exists = book.some(item => item.questionId === questionId)
  if (!exists) {
    book.push({ questionId: questionId, reviewed: false })
    saveWrongBook(book)
  }
}

function removeFromWrongBook(questionId) {
  const book = getWrongBook()
  const filtered = book.filter(item => item.questionId !== questionId)
  saveWrongBook(filtered)
}

function saveWrongBook(book) {
  localStorage.setItem(getStorageKey('wrong_book'), JSON.stringify(book))
}

function getTodayCount() {
  const records = getRecords()
  const today = new Date()
  const todayStr = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0')
  return records.filter(r => {
    const d = new Date(r.time)
    const dStr = d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0')
    return dStr === todayStr
  }).length
}

// ---------- 2. 页面路由 ----------

function showPage(pageName) {
  document.querySelectorAll('.page').forEach(function(p) {
    p.classList.remove('active')
  })
  const target = document.getElementById('page-' + pageName)
  if (target) {
    target.classList.add('active')
  }

  // tab-bar 显示控制
  var tabBar = document.getElementById('tab-bar')
  if (pageName === 'exam-select' || pageName === 'assessment' || pageName === 'practice') {
    tabBar.style.display = 'none'
  } else {
    tabBar.style.display = ''
  }

  // 更新 tab-bar active 状态
  document.querySelectorAll('#tab-bar .tab-item').forEach(function(tab) {
    tab.classList.remove('active')
  })
  var activeTab = document.querySelector('#tab-bar .tab-item[data-page="' + pageName + '"]')
  if (activeTab) {
    activeTab.classList.add('active')
  }

  // 页面回调
  if (pageName === 'home') {
    refreshHome()
  } else if (pageName === 'list') {
    if (typeof renderQuestionList === 'function') renderQuestionList()
  } else if (pageName === 'wrong') {
    if (typeof renderWrongBook === 'function') renderWrongBook()
  } else if (pageName === 'profile') {
    if (typeof renderProfile === 'function') renderProfile()
  }

  // 滚动到顶部
  window.scrollTo(0, 0)
}

// ---------- 3. 考试选择 ----------

let selectedExamKey = null

function renderExamCards() {
  var container = document.getElementById('exam-cards')
  if (!container) return

  var keys = ['junior', 'intermediate', 'senior']
  var html = ''

  keys.forEach(function(key) {
    var cfg = EXAM_LEVELS[key]
    if (!cfg) return
    var tagPreviews = Object.values(cfg.categories).slice(0, 4)
    var totalQ = 0
    if (typeof QUESTIONS !== 'undefined') {
      totalQ = QUESTIONS.filter(function(q) { return q.exam === key }).length
    }
    html += '<div class="exam-card' + (selectedExamKey === key ? ' selected' : '') + '" onclick="selectExamCard(\'' + key + '\')">'
    html += '<div class="exam-card-title">' + cfg.name + '</div>'
    html += '<div class="exam-card-desc">' + cfg.desc + '</div>'
    html += '<div class="exam-card-tags">'
    tagPreviews.forEach(function(tag) {
      html += '<span class="exam-card-tag">' + tag + '</span>'
    })
    html += '</div>'
    html += '<div class="exam-card-count">共 ' + totalQ + ' 题</div>'
    html += '</div>'
  })

  container.innerHTML = html
}

function selectExamCard(key) {
  selectedExamKey = key
  var cards = document.querySelectorAll('.exam-card')
  cards.forEach(function(card) {
    card.classList.remove('selected')
  })
  // 找到被点击的卡片并添加 selected
  var allCards = document.querySelectorAll('.exam-card')
  allCards.forEach(function(card) {
    if (card.onclick && card.getAttribute('onclick').indexOf(key) > -1) {
      card.classList.add('selected')
    }
  })
  // 重新渲染以标记 selected
  renderExamCards()
  // 激活确认按钮
  var btn = document.getElementById('exam-confirm-btn')
  if (btn) btn.classList.remove('disabled')
}

function confirmExamSelection() {
  if (!selectedExamKey) return
  localStorage.setItem('kuaiji_selected_exam', selectedExamKey)

  // 确保用户画像存在，没有测评也直接进首页
  var profile = getUserProfile()
  if (!profile) {
    profile = getDefaultProfile()
    saveUserProfile(profile)
  }
  showPage('home')
}

// ---------- 4. 考试切换弹窗 ----------

function showExamSwitchModal() {
  var container = document.getElementById('modal-exam-options')
  if (!container) return

  var currentExam = localStorage.getItem('kuaiji_selected_exam') || 'junior'
  var html = ''

  var keys = ['junior', 'intermediate', 'senior']
  keys.forEach(function(key) {
    var cfg = EXAM_LEVELS[key]
    if (!cfg) return
    var isCurrent = key === currentExam
    html += '<div class="modal-option' + (isCurrent ? ' current' : '') + '" onclick="switchExam(\'' + key + '\')">'
    html += '<div class="modal-option-icon">' + LEVEL_ICONS[cfg.icon] + '</div>'
    html += '<div class="modal-option-text">'
    html += '<div class="modal-option-name">' + cfg.name + '</div>'
    html += '<div class="modal-option-info">' + cfg.desc.substring(0, 20) + '...</div>'
    if (isCurrent) {
      html += '<span class="current-badge">当前</span>'
    }
    html += '</div>'
    html += '</div>'
  })

  container.innerHTML = html
  document.getElementById('exam-switch-modal').style.display = 'flex'
}

function switchExam(key) {
  localStorage.setItem('kuaiji_selected_exam', key)
  currentDifficulty = ''
  currentCategory = ''
  currentSearch = ''
  closeExamSwitchModal()
  showPage('home')
}

function closeExamSwitchModal() {
  document.getElementById('exam-switch-modal').style.display = 'none'
}

// ---------- 5. 首页渲染 ----------

function skipAssessmentAndStart() {
  var profile = getUserProfile()
  if (!profile) profile = getDefaultProfile()
  profile.assessmentDone = true
  saveUserProfile(profile)
  refreshHome()
}

function refreshHome() {
  var container = document.getElementById('home-content')
  if (!container) return

  var profile = getUserProfile()
  if (!profile) {
    profile = getDefaultProfile()
    saveUserProfile(profile)
  }

  var examCfg = getExamConfig()
  var boardOrder = getBoardOrder()
  var categories = getCategories()
  var html = ''

  // 考试标签
  if (examCfg) {
    html += '<div class="exam-tag" onclick="showExamSwitchModal()">' + examCfg.shortName + '</div>'
  }

  // 未测评：欢迎页
  if (!profile.assessmentDone) {
    html += '<div class="hero-card">'
    html += '<div class="hero-bg"></div>'
    html += '<div class="hero-top">'
    html += '<div class="hero-left">'
    html += '<div class="hero-badge">NEW</div>'
    html += '<div class="hero-name">会计刷题</div>'
    html += '<div class="hero-desc">测测你的会计水平，智能推题高效学习</div>'
    html += '</div>'
    html += '<div class="hero-icon-wrap">'
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'
    html += '</div></div>'
    html += '<div class="hero-actions" style="margin-top:20px">'
    html += '<div class="hero-btn hero-btn-primary" onclick="startAssessment()">开始测评</div>'
    html += '</div>'
    html += '<div class="hero-skip" onclick="skipAssessmentAndStart()">跳过，自由刷题 ›</div>'
    html += '</div>'
    html += '<div class="card"><div class="section-title">题库分类</div>'
    html += renderCategoryGrid(boardOrder, categories, profile)
    html += '</div>'
    container.innerHTML = html
    return
  }

  // 已测评：完整首页
  var records = getRecords()
  var totalDone = records.length
  var totalCorrect = records.filter(function(r) { return r.isCorrect }).length
  var accuracy = totalDone > 0 ? Math.round(totalCorrect / totalDone * 100) : 0
  var todayCount = getTodayCount()

  // Hero 卡片
  var levelDef = getLevelDef(profile.level)
  var levelIcon = getLevelIcon(profile.level)
  var levelColor = getLevelColor(profile.level)

  html += '<div class="hero-card">'
  html += '<div class="hero-top">'
  html += '<div class="hero-left">'
  html += '<div class="hero-badge">Lv.' + levelDef.level + '</div>'
  html += '<div class="hero-name">' + levelDef.name + '</div>'
  html += '<div class="hero-desc">' + levelDef.desc + '</div>'
  html += '</div>'
  html += '<div class="hero-icon-wrap">' + levelIcon + '</div>'
  html += '</div>'
  html += '<div class="hero-stats">'
  html += '<div class="hero-stat"><span class="hero-stat-val">' + totalDone + '</span><span class="hero-stat-lbl">总答题</span></div>'
  html += '<div class="hero-stat"><span class="hero-stat-val">' + accuracy + '%</span><span class="hero-stat-lbl">正确率</span></div>'
  html += '<div class="hero-stat"><span class="hero-stat-val">' + todayCount + '</span><span class="hero-stat-lbl">今日</span></div>'
  html += '</div>'
  html += '<div class="hero-actions">'
  html += '<div class="hero-btn hero-btn-primary" onclick="startSmartPractice()">智能刷题</div>'
  var eligible = false
  if (typeof checkPromotionEligibility === 'function') {
    eligible = checkPromotionEligibility().eligible
  }
  if (eligible) {
    html += '<div class="hero-btn hero-btn-ghost" onclick="startChallenge()">晋阶挑战</div>'
  } else {
    html += '<div class="hero-btn hero-btn-ghost" style="opacity:0.5">晋阶挑战</div>'
  }
  html += '</div></div>'

  // 晋阶进度
  if (profile.level < 5) {
    var promoResult = { eligible: false, reasons: [] }
    if (typeof checkPromotionEligibility === 'function') {
      promoResult = checkPromotionEligibility()
    }
    if (promoResult.eligible) {
      html += '<div class="promo-card">'
      html += '<div class="promo-icon">' + LEVEL_ICONS.rocket + '</div>'
      html += '<div class="promo-info"><div class="promo-title">晋阶挑战已解锁</div>'
      html += '<div class="promo-desc">完成晋阶挑战，提升到下一等级</div></div></div>'
    } else {
      var reqs = getPromotionReqs(profile.level)
      if (reqs) {
        html += '<div class="card" style="margin-top:12px">'
        html += '<div class="section-title">晋阶进度</div>'
        html += '<div class="promo-progress-item">'
        html += '<span class="check ' + (totalDone >= reqs.totalDone ? 'met' : 'unmet') + '">' + (totalDone >= reqs.totalDone ? '&#10003;' : '&#9675;') + '</span>'
        html += ' 总答题 ' + totalDone + '/' + reqs.totalDone + '</div>'
        html += '<div class="promo-progress-item">'
        html += '<span class="check ' + (accuracy >= reqs.accuracy ? 'met' : 'unmet') + '">' + (accuracy >= reqs.accuracy ? '&#10003;' : '&#9675;') + '</span>'
        html += ' 正确率 ' + accuracy + '%/' + reqs.accuracy + '%</div>'
        var recentN = reqs.recentTotal || 20
        var recentRecords = records.slice(-recentN)
        var recentCorrect = recentRecords.filter(function(r) { return r.isCorrect }).length
        var recentOk = recentCorrect >= reqs.recentCorrect
        html += '<div class="promo-progress-item">'
        html += '<span class="check ' + (recentOk ? 'met' : 'unmet') + '">' + (recentOk ? '&#10003;' : '&#9675;') + '</span>'
        html += ' 近期 ' + recentCorrect + '/' + reqs.recentTotal + ' 题</div>'
        html += '</div>'
      }
    }
  }

  // 薄弱板块
  var weakCat = null
  var weakAcc = 100
  boardOrder.forEach(function(cat) {
    var bw = profile.boardWeights[cat]
    if (!bw) return
    var total = bw.correct + bw.wrong
    if (total === 0) return
    var acc = bw.correct / total * 100
    if (acc < weakAcc) { weakAcc = acc; weakCat = cat }
  })
  if (weakCat) {
    html += '<div class="weak-banner">'
    html += '<div class="weak-label">薄弱板块：' + categories[weakCat] + '（正确率 ' + Math.round(weakAcc) + '%）</div>'
    html += '<div class="weak-action" onclick="startBoardPractice(\'' + weakCat + '\')">去练习 ›</div>'
    html += '</div>'
  }

  // 分类宫格
  html += '<div class="card"><div class="section-title">题库分类</div>'
  html += renderCategoryGrid(boardOrder, categories, profile)
  html += '</div>'

  // 板块进度
  html += '<div class="card" style="margin-top:12px"><div class="section-title">板块进度</div>'
  boardOrder.forEach(function(cat) {
    var catName = categories[cat]
    var bw = profile.boardWeights[cat]
    if (!bw) return
    var total = bw.correct + bw.wrong
    var acc = total > 0 ? Math.round(bw.correct / total * 100) : 0
    html += '<div class="board-progress-item">'
    html += '<div class="board-progress-name">' + catName + '</div>'
    html += '<div class="board-progress-bar"><div class="board-progress-fill" style="width:' + acc + '%"></div></div>'
    html += '<span style="font-size:12px;color:#666;margin-left:8px">' + acc + '%</span>'
    html += '</div>'
  })
  html += '</div>'

  container.innerHTML = html
}

function renderCategoryGrid(boardOrder, categories, profile) {
  var catEmojis = {
    jr_accounting_basis: '📖', jr_assets: '🏦', jr_liabilities: '📋', jr_equity: '💎',
    jr_revenue_expense: '💰', jr_financial_statements: '📊', jr_product_cost: '🏭',
    jr_gov_accounting: '🏛', jr_economic_law: '⚖', jr_comprehensive: '🎯',
    im_long_term_equity: '📈', im_investment_property: '🏠', im_assets_impairment: '📉',
    im_income_tax: '💸', im_foreign_currency: '🌍', im_accounting_policies: '📝',
    im_restructuring: '🔄', im_financial_management: '🧮', im_economic_law: '⚖',
    im_comprehensive: '🎯',
    sr_enterprise_strategy: '🗺', sr_enterprise_restructuring: '🤝',
    sr_financial_instruments: '💳', sr_consolidation_advanced: '📊',
    sr_gov_npo_accounting: '🏛', sr_performance_management: '🏆',
    sr_internal_control: '🔒', sr_comprehensive: '🎯'
  }
  var html = '<div class="category-grid">'
  boardOrder.forEach(function(cat) {
    var catName = categories[cat]
    var emoji = catEmojis[cat] || '📘'
    var bw = profile && profile.boardWeights ? profile.boardWeights[cat] : null
    var doneCount = bw ? (bw.correct + bw.wrong) : 0
    html += '<div class="category-item" onclick="startBoardPractice(\'' + cat + '\')">'
    html += '<div class="category-icon">' + emoji + '</div>'
    html += '<div class="category-name">' + catName + '</div>'
    html += '<div style="font-size:11px;color:#999;margin-top:2px">' + doneCount + '题</div>'
    html += '</div>'
  })
  html += '</div>'
  return html
}

// 获取指定等级的晋阶要求
function getPromotionReqs(level) {
  var examKey = localStorage.getItem('kuaiji_selected_exam') || 'junior'
  var reqs = PROMOTION_REQUIREMENTS[examKey]
  if (!reqs || !reqs[level]) return null
  return reqs[level]
}

// ---------- 6. 应用初始化 ----------

document.addEventListener('DOMContentLoaded', function() {
  var selectedExam = localStorage.getItem('kuaiji_selected_exam')

  if (!selectedExam) {
    // 没有选择考试，显示考试选择页
    selectedExamKey = null
    renderExamCards()
    // 隐藏 tab-bar
    document.getElementById('tab-bar').style.display = 'none'
    // 显示考试选择页
    document.getElementById('page-exam-select').classList.add('active')
    // 隐藏其他页
    document.querySelectorAll('.page').forEach(function(p) {
      if (p.id !== 'page-exam-select') p.classList.remove('active')
    })
  } else {
    // 已选择考试，直接进入首页
    showPage('home')
  }

  // 绑定 tab-bar 点击事件
  document.querySelectorAll('#tab-bar .tab-item').forEach(function(tab) {
    tab.addEventListener('click', function() {
      var page = this.getAttribute('data-page')
      if (page) showPage(page)
    })
  })
})
// ========== 题库列表 & 答题系统 (Part 2) ==========

// ----- 题库列表页状态 -----
let currentDifficulty = '';
let currentCategory = '';
let currentSearch = '';

// ----- 答题系统状态 -----
let practiceState = null; // { questions: [], index: 0, correct: 0, answers: [], mode: 'smart'|'board'|'single' }

// ==================== 题库列表页 ====================

function renderQuestionList() {
  // (a) 渲染板块筛选 chips
  var catRow = document.getElementById('cat-filter-row');
  var categories = getCategories();
  var boardOrder = getBoardOrder();
  var catHtml = '<span class="cat-chip' + (currentCategory === '' ? ' active' : '') + '" onclick="currentCategory=\'\';renderQuestionList()">全部</span>';
  for (var i = 0; i < boardOrder.length; i++) {
    var key = boardOrder[i];
    var name = categories[key] || key;
    var isActive = currentCategory === key ? ' active' : '';
    catHtml += '<span class="cat-chip' + isActive + '" onclick="currentCategory=\'' + key + '\';renderQuestionList()">' + name + '</span>';
  }
  catRow.innerHTML = catHtml;

  // (b) 获取题目并过滤
  var allQ = getExamQuestions();
  var filtered = allQ.filter(function(q) {
    if (currentDifficulty && q.difficulty !== currentDifficulty) return false;
    if (currentCategory && q.category !== currentCategory) return false;
    if (currentSearch) {
      var kw = currentSearch.toLowerCase();
      if (q.stem.toLowerCase().indexOf(kw) === -1) return false;
    }
    return true;
  });

  // (c) 渲染题目列表
  var listEl = document.getElementById('question-list');
  if (filtered.length === 0) {
    listEl.innerHTML = '<div class="empty">没有找到匹配的题目</div>';
    return;
  }

  var html = '';
  for (var j = 0; j < filtered.length; j++) {
    var q = filtered[j];
    var catName = categories[q.category] || q.category;
    var stemText = q.stem.length > 60 ? q.stem.substring(0, 60) + '...' : q.stem;
    html += '<div class="card question-item" onclick="startQuestionPractice(\'' + q.id + '\')">';
    html += '<div class="question-header">';
    html += diffTag(q.difficulty);
    html += '<span class="tag">' + catName + '</span>';
    html += '</div>';
    html += '<div class="question-stem">' + stemText + '</div>';
    html += '</div>';
  }
  listEl.innerHTML = html;
}

function setDifficulty(val) {
  currentDifficulty = val;
  var chips = document.querySelectorAll('.diff-chip');
  for (var i = 0; i < chips.length; i++) {
    var chip = chips[i];
    if (chip.getAttribute('data-val') === val) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  }
  renderQuestionList();
}

function onSearch(val) {
  currentSearch = val;
  renderQuestionList();
}

// ==================== 答题系统 ====================

function startSmartPractice() {
  var questions = [];
  var pickedIds = {};
  var maxRetry = 100;
  for (var i = 0; i < 20; i++) {
    var q = null;
    for (var retry = 0; retry < maxRetry; retry++) {
      var candidate = smartPickQuestion();
      if (!candidate) break;
      if (!pickedIds[candidate.id]) {
        q = candidate;
        break;
      }
    }
    if (!q) break;
    pickedIds[q.id] = true;
    questions.push(q);
  }
  if (questions.length === 0) return;

  practiceState = {
    questions: questions,
    index: 0,
    correct: 0,
    answers: [],
    mode: 'smart'
  };
  renderPractice();
  showPage('practice');
}

function startBoardPractice(category) {
  var allQ = getExamQuestions();
  var boardQ = allQ.filter(function(q) { return q.category === category; });

  // 优先未做过的
  var doneIds = [];
  try {
    doneIds = JSON.parse(localStorage.getItem(getStorageKey('done_questions')) || '[]');
  } catch(e) {}

  var undone = boardQ.filter(function(q) { return doneIds.indexOf(q.id) === -1; });
  var pool = undone.length > 0 ? undone : boardQ;
  var shuffled = shuffleArray(pool);
  var picked = shuffled.slice(0, Math.min(20, shuffled.length));

  if (picked.length === 0) return;

  practiceState = {
    questions: picked,
    index: 0,
    correct: 0,
    answers: [],
    mode: 'board'
  };
  renderPractice();
  showPage('practice');
}

function startQuestionPractice(questionId) {
  var allQ = getExamQuestions();
  var q = allQ.find(function(item) { return String(item.id) === String(questionId); });
  if (!q) return;

  practiceState = {
    questions: [q],
    index: 0,
    correct: 0,
    answers: [],
    mode: 'single'
  };
  renderPractice();
  showPage('practice');
}

function renderPractice() {
  var el = document.getElementById('practice-content');
  var state = practiceState;
  var q = state.questions[state.index];
  var categories = getCategories();
  var catName = categories[q.category] || q.category;
  var isSingle = state.mode === 'single';

  var html = '';

  // (a) 进度信息（单题模式不显示）
  if (!isSingle) {
    html += '<span class="progress-text">第 ' + (state.index + 1) + ' / ' + state.questions.length + ' 题</span>';
  }

  // (b) 进度条（单题模式不显示）
  if (!isSingle) {
    var pct = ((state.index) / state.questions.length * 100).toFixed(1);
    html += '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>';
  }

  // (c) 题目标签
  html += '<div class="question-meta">';
  html += diffTag(q.difficulty);
  html += '<span class="tag">' + catName + '</span>';
  html += '</div>';

  // (d) 题干
  html += '<div class="card" style="margin-bottom:16px">';
  html += '<div class="practice-stem">' + q.stem + '</div>';
  html += '</div>';

  // (e) 选项
  html += '<div id="options-area">';
  for (var i = 0; i < q.options.length; i++) {
    var opt = q.options[i];
    html += '<div class="option-card" onclick="selectPracticeOption(\'' + opt.label + '\')">';
    html += '<span class="option-label">' + opt.label + '</span>';
    html += '<span class="option-text">' + opt.text + '</span>';
    html += '<span class="option-icon"></span>';
    html += '</div>';
  }
  html += '</div>';

  // 解析区占位
  html += '<div id="result-area"></div>';
  html += '<div id="bottom-action"></div>';

  el.innerHTML = html;
}

function selectPracticeOption(label) {
  var state = practiceState;
  var q = state.questions[state.index];
  var isSingle = state.mode === 'single';

  // (a) 禁止重复选择
  var resultArea = document.getElementById('result-area');
  if (resultArea && resultArea.getAttribute('data-answered') === '1') return;

  // (b) 找到正确答案，标记选项
  var correctLabel = '';
  for (var i = 0; i < q.options.length; i++) {
    if (q.options[i].correct) {
      correctLabel = q.options[i].label;
      break;
    }
  }
  var isCorrect = (label === correctLabel);

  var optCards = document.querySelectorAll('#options-area .option-card');
  for (var j = 0; j < optCards.length; j++) {
    var card = optCards[j];
    var cardLabel = card.querySelector('.option-label').textContent.trim();
    card.style.pointerEvents = 'none';
    if (cardLabel === correctLabel) {
      card.classList.add('correct');
      card.querySelector('.option-icon').textContent = '✓';
    }
    if (cardLabel === label && !isCorrect) {
      card.classList.add('wrong');
      card.querySelector('.option-icon').textContent = '✗';
    }
  }

  // 标记已作答
  resultArea.setAttribute('data-answered', '1');

  // (c) 显示解析区
  var bannerClass = isCorrect ? 'result-banner correct-banner' : 'result-banner wrong-banner';
  var bannerText = isCorrect ? '回答正确！' : '回答错误';
  var expHtml = '<div class="' + bannerClass + '">' + bannerText + '</div>';
  expHtml += '<div class="card" style="margin-top:14px">';
  expHtml += '<div class="explanation-content">';
  expHtml += '<span class="explanation-title">解析</span>';
  expHtml += '<div class="explanation-text">' + (q.explanation || '暂无解析') + '</div>';
  expHtml += '</div></div>';

  // (d) 保存记录 + 更新推题 + 错题处理（用 try-catch 防止中断按钮渲染）
  try {
    state.answers.push({ questionId: q.id, selected: label, correct: isCorrect });
    if (isCorrect) state.correct++;

    saveRecord({
      questionId: q.id,
      isCorrect: isCorrect,
      chosenOption: label,
      correctAnswer: correctLabel,
      time: new Date().toISOString()
    });

    if (typeof updateAfterAnswer === 'function') updateAfterAnswer(q.id, isCorrect);

    if (!isCorrect) {
      if (typeof addToWrongBook === 'function') addToWrongBook(q.id);
    } else {
      if (typeof getWrongBook === 'function') {
        var wb = getWrongBook();
        var entry = wb.find(function(w) { return w.questionId === q.id; });
        if (entry) {
          entry.reviewed = true;
          if (typeof saveWrongBook === 'function') saveWrongBook(wb);
        }
      }
    }
  } catch(e) {
    console.error('答题数据处理异常:', e);
  }

  // (e) 解析和按钮始终显示（不受上面异常影响）
  resultArea.innerHTML = expHtml;

  var bottomEl = document.getElementById('bottom-action');
  var isLast = (state.index >= state.questions.length - 1);
  if (isSingle) {
    bottomEl.innerHTML = '<div class="next-btn" onclick="showPage(\'list\')">返回题库</div>';
  } else if (isLast) {
    bottomEl.innerHTML = '<div class="next-btn" onclick="finishPractice()">查看结果</div>';
  } else {
    bottomEl.innerHTML = '<div class="next-btn" onclick="goToNextPractice()">下一题</div>';
  }
}

function goToNextPractice() {
  practiceState.index++;
  renderPractice();
}

function finishPractice() {
  var el = document.getElementById('practice-content');
  var state = practiceState;
  var total = state.questions.length;
  var correct = state.correct;
  var accuracy = total > 0 ? (correct / total * 100) : 0;
  var accuracyText = accuracy.toFixed(1);

  // (a) 环形正确率图表
  var circumference = 2 * Math.PI * 50; // 2 * 3.14159 * 50 = 314.159
  var dasharray = circumference.toFixed(1);
  var dashoffset = (circumference * (1 - accuracy / 100)).toFixed(1);

  var ringColor = '#E53935'; // <60% 红色
  if (accuracy >= 80) ringColor = '#43A047'; // >=80% 绿色
  else if (accuracy >= 60) ringColor = '#3A9E8F'; // >=60% 蓝色

  var html = '';

  // 结果汇总卡片
  html += '<div class="result-summary-card">';
  html += '<div class="result-summary-ring">';
  html += '<svg viewBox="0 0 120 120">';
  html += '<circle cx="60" cy="60" r="50" fill="none" stroke="rgba(45,90,78,0.08)" stroke-width="8"/>';
  html += '<circle cx="60" cy="60" r="50" fill="none" stroke="' + ringColor + '" stroke-width="8"';
  html += ' stroke-dasharray="' + dasharray + '" stroke-dashoffset="' + dashoffset + '" stroke-linecap="round"';
  html += ' transform="rotate(-90 60 60)"/>';
  html += '</svg>';
  html += '</div>';
  html += '<div class="result-summary-stats">';
  html += '<div class="result-summary-item"><span class="result-summary-num">' + total + '</span><span class="result-summary-label">总题数</span></div>';
  html += '<div class="result-summary-item"><span class="result-summary-num" style="color:' + ringColor + '">' + correct + '</span><span class="result-summary-label">答对</span></div>';
  html += '<div class="result-summary-item"><span class="result-summary-num" style="color:' + ringColor + '">' + accuracyText + '%</span><span class="result-summary-label">正确率</span></div>';
  html += '</div>';
  html += '</div>';

  // (c) 各板块表现条
  var categories = getCategories();
  var boardStats = {};
  for (var i = 0; i < state.questions.length; i++) {
    var q = state.questions[i];
    var cat = q.category;
    if (!boardStats[cat]) boardStats[cat] = { total: 0, correct: 0 };
    boardStats[cat].total++;
  }
  for (var j = 0; j < state.answers.length; j++) {
    var a = state.answers[j];
    var aq = state.questions.find(function(item) { return item.id === a.questionId; });
    if (aq && boardStats[aq.category] && a.correct) {
      boardStats[aq.category].correct++;
    }
  }

  var boardKeys = Object.keys(boardStats);
  if (boardKeys.length > 1) {
    html += '<div class="card"><div class="section-title">各板块表现</div>';
    for (var k = 0; k < boardKeys.length; k++) {
      var bk = boardKeys[k];
      var bs = boardStats[bk];
      var bAcc = bs.total > 0 ? (bs.correct / bs.total * 100) : 0;
      var bName = categories[bk] || bk;
      var barColor = bAcc >= 80 ? 'var(--success)' : (bAcc >= 60 ? 'var(--blue)' : 'var(--danger)');
      html += '<div class="board-progress-item">';
      html += '<span class="board-progress-name">' + bName + '</span>';
      html += '<div class="board-progress-bar"><div class="board-progress-fill" style="width:' + bAcc.toFixed(1) + '%;background:' + barColor + '"></div></div>';
      html += '<span class="board-progress-count">' + bs.correct + '/' + bs.total + '</span>';
      html += '</div>';
    }
    html += '</div>';
  }

  // (d) 错题回顾
  var wrongAnswers = [];
  for (var m = 0; m < state.answers.length; m++) {
    if (!state.answers[m].correct) {
      wrongAnswers.push(state.answers[m]);
    }
  }

  if (wrongAnswers.length > 0) {
    html += '<div class="card"><div class="section-title">错题回顾</div>';
    for (var n = 0; n < wrongAnswers.length; n++) {
      var wa = wrongAnswers[n];
      var wq = state.questions.find(function(item) { return item.id === wa.questionId; });
      if (!wq) continue;
      var wCorrectOpt = '';
      for (var p = 0; p < wq.options.length; p++) {
        if (wq.options[p].correct) {
          wCorrectOpt = wq.options[p].label + '. ' + wq.options[p].text;
          break;
        }
      }
      var wStem = wq.stem.length > 50 ? wq.stem.substring(0, 50) + '...' : wq.stem;
      html += '<div class="practice-result-wrong-item">';
      html += '<div class="practice-result-wrong-stem">' + wStem + '</div>';
      html += '<div class="practice-result-wrong-ans">正确答案：' + wCorrectOpt + '</div>';
      html += '</div>';
    }
    html += '</div>';
  }

  // (e) 底部按钮
  html += '<div class="action-row" style="margin-top:18px">';
  html += '<div class="action-btn btn-primary" onclick="startSmartPractice()">再来一组</div>';
  html += '<div class="action-btn btn-outline" onclick="showPage(\'home\');refreshHome()">返回首页</div>';
  html += '</div>';

  el.innerHTML = html;
}
// ========== 错题本、个人中心、学习报告 & 使用说明 (Part 3) ==========

// ==================== 错题本 ====================

function renderWrongBook() {
  var wrongBook = getWrongBook();
  var countEl = document.getElementById('wrong-count');
  var listEl = document.getElementById('wrong-list');

  // (a) 更新错题计数
  if (countEl) countEl.textContent = wrongBook.length;

  // (b) 没有错题时显示空提示
  if (wrongBook.length === 0) {
    listEl.innerHTML = '<div class="empty">暂无错题，继续保持！</div>';
    return;
  }

  var allQ = getExamQuestions();
  var categories = getCategories();
  var html = '';

  // (d) 如果错题 >= 3 道，顶部添加全部重做按钮
  if (wrongBook.length >= 3) {
    html += '<div style="margin-bottom:16px;text-align:center">';
    html += '<div class="action-btn btn-primary" onclick="redoAllWrong()">全部重做 (' + wrongBook.length + ' 题)</div>';
    html += '</div>';
  }

  // (c) 渲染错题列表
  for (var i = 0; i < wrongBook.length; i++) {
    var item = wrongBook[i];
    var q = allQ.find(function(qq) { return qq.id === item.questionId; });
    if (!q) continue;

    var catName = categories[q.category] || q.category;
    var stemText = q.stem.length > 80 ? q.stem.substring(0, 80) + '...' : q.stem;

    html += '<div class="card wrong-item">';
    html += '<div class="wrong-content">';
    html += '<div class="wrong-meta">' + diffTag(q.difficulty) + '<span class="tag">' + catName + '</span></div>';
    html += '<div class="wrong-stem">' + stemText + '</div>';
    html += '</div>';
    html += '<div class="wrong-actions">';
    html += '<span class="action-redo" onclick="redoWrongQuestion(' + q.id + ')">重做</span>';
    html += '<span class="action-remove" onclick="removeWrongItem(' + q.id + ')">移除</span>';
    html += '</div>';
    html += '</div>';
  }

  listEl.innerHTML = html;
}

function redoWrongQuestion(id) {
  startQuestionPractice(id);
}

function removeWrongItem(id) {
  removeFromWrongBook(id);
  renderWrongBook();
}

function redoAllWrong() {
  var wrongBook = getWrongBook();
  if (wrongBook.length === 0) return;

  var allQ = getExamQuestions();
  var questions = [];
  for (var i = 0; i < wrongBook.length; i++) {
    var q = allQ.find(function(qq) { return qq.id === wrongBook[i].questionId; });
    if (q) questions.push(q);
  }

  if (questions.length === 0) return;

  questions = shuffleArray(questions);

  practiceState = {
    questions: questions,
    index: 0,
    correct: 0,
    answers: [],
    mode: 'wrong'
  };
  renderPractice();
  showPage('practice');
}

// ==================== 个人中心 ====================

function renderProfile() {
  var profile = getUserProfile();
  var records = getRecords();
  var wrongBook = getWrongBook();
  var config = getExamConfig();

  // (a) 等级描述
  var descEl = document.getElementById('profile-level-desc');
  if (descEl) {
    if (profile) {
      var levelDef = getLevelDef(profile.level);
      descEl.textContent = levelDef.name + ' - ' + levelDef.desc;
    } else {
      descEl.textContent = '坚持刷题，逢考必过';
    }
  }

  // (b) 当前考试名称
  var examLabel = document.getElementById('profile-exam-label');
  if (examLabel && config) {
    examLabel.textContent = config.shortName + ' ›';
  }

  // (c) 统计数据
  var totalDone = records.length;
  var totalCorrect = 0;
  for (var i = 0; i < records.length; i++) {
    if (records[i].isCorrect) totalCorrect++;
  }
  var accuracy = totalDone > 0 ? Math.round(totalCorrect / totalDone * 100) : 0;
  var wrongCount = wrongBook.length;
  var todayCount = getTodayCount();

  var pTotal = document.getElementById('p-total');
  var pCorrect = document.getElementById('p-correct');
  var pAccuracy = document.getElementById('p-accuracy');
  var pWrong = document.getElementById('p-wrong');
  var pToday = document.getElementById('p-today');

  if (pTotal) pTotal.textContent = totalDone;
  if (pCorrect) pCorrect.textContent = totalCorrect;
  if (pAccuracy) pAccuracy.textContent = accuracy + '%';
  if (pWrong) pWrong.textContent = wrongCount;
  if (pToday) pToday.textContent = todayCount;
}

// ==================== 学习报告页 ====================

function showRankPage() {
  // 隐藏其他页面
  var pages = document.querySelectorAll('.page');
  for (var i = 0; i < pages.length; i++) {
    pages[i].classList.remove('active');
  }

  // 显示测评页容器
  var assessmentPage = document.getElementById('page-assessment');
  if (assessmentPage) assessmentPage.classList.add('active');

  // 隐藏底部导航
  var tabBar = document.getElementById('tab-bar');
  if (tabBar) tabBar.style.display = 'none';

  var container = document.getElementById('assessment-content');
  var profile = getUserProfile();
  if (!profile) return;

  var records = getRecords();
  var config = getExamConfig();
  var levelDef = getLevelDef(profile.level);
  var iconSvg = getLevelIcon(profile.level);
  var levelColor = getLevelColor(profile.level);
  var categories = getCategories();
  var boardOrder = getBoardOrder();
  var allQ = getExamQuestions();

  var html = '';

  // (a) 返回导航栏
  html += '<div class="nav-bar">';
  html += '<span class="nav-back" onclick="showPage(\'profile\')">';
  html += '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>';
  html += '</span>';
  html += '<span class="nav-title">学习报告</span>';
  html += '</div>';

  // (b) Hero 区域
  html += '<div class="result-header" style="--level-color: ' + levelColor + '">';
  html += '<div class="result-icon">' + iconSvg + '</div>';
  html += '<div class="result-level">' + levelDef.name + '</div>';
  html += '<div class="result-score">' + (config ? config.shortName : '') + ' · Lv.' + profile.level + '</div>';
  html += '<div class="result-desc">' + levelDef.desc + '</div>';
  html += '</div>';

  // (c) Canvas 雷达图
  html += '<div class="card">';
  html += '<div class="section-title">各板块正确率</div>';
  html += '<canvas id="radar-chart" width="500" height="500" style="width:100%;max-width:500px;margin:0 auto;display:block"></canvas>';

  // (d) 各板块正确率图例
  html += '<div class="radar-legend">';
  for (var i = 0; i < boardOrder.length; i++) {
    var catKey = boardOrder[i];
    var catName = categories[catKey] || catKey;
    var catRecords = records.filter(function(r) {
      var qq = allQ.find(function(qqq) { return qqq.id === r.questionId; });
      return qq && qq.category === catKey;
    });
    var catTotal = catRecords.length;
    var catCorrect = catRecords.filter(function(r) { return r.isCorrect; }).length;
    var catAcc = catTotal > 0 ? Math.round(catCorrect / catTotal * 100) : 0;
    var dotColor = catAcc >= 80 ? 'var(--success)' : (catAcc >= 50 ? 'var(--warning)' : 'var(--danger)');

    html += '<div class="radar-legend-item">';
    html += '<span class="radar-legend-dot" style="background:' + dotColor + '"></span>';
    html += '<span class="radar-legend-name">' + catName + '</span>';
    html += '<span class="radar-legend-val">' + catAcc + '%</span>';
    html += '</div>';
  }
  html += '</div>';
  html += '</div>';

  // (e) 各板块详细进度条
  html += '<div class="card">';
  html += '<div class="section-title">板块详情</div>';
  for (var j = 0; j < boardOrder.length; j++) {
    var bk = boardOrder[j];
    var bName = categories[bk] || bk;
    var bRecords = records.filter(function(r) {
      var qq = allQ.find(function(qqq) { return qqq.id === r.questionId; });
      return qq && qq.category === bk;
    });
    var bTotal = bRecords.length;
    var bCorrect = bRecords.filter(function(r) { return r.isCorrect; }).length;
    var bAcc = bTotal > 0 ? (bCorrect / bTotal * 100) : 0;
    var barColor = bAcc >= 80 ? 'var(--success)' : (bAcc >= 60 ? 'var(--blue)' : 'var(--danger)');

    html += '<div class="board-progress-item">';
    html += '<span class="board-progress-name">' + bName + '</span>';
    html += '<div class="board-progress-bar"><div class="board-progress-fill" style="width:' + bAcc.toFixed(1) + '%;background:' + barColor + '"></div></div>';
    html += '<span class="board-progress-count">' + bCorrect + '/' + bTotal + '</span>';
    html += '</div>';
  }
  html += '</div>';

  // (f) 底部返回按钮
  html += '<div class="action-row" style="margin-top:18px">';
  html += '<div class="action-btn btn-outline" onclick="showPage(\'profile\')">返回个人中心</div>';
  html += '</div>';

  container.innerHTML = html;

  // 绘制雷达图
  setTimeout(function() { drawRadarChart(records); }, 100);
}

function drawRadarChart(records) {
  var canvas = document.getElementById('radar-chart');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var boardOrder = getBoardOrder();
  var categories = getCategories();
  var allQ = getExamQuestions();
  var n = boardOrder.length;

  if (n < 3) return;

  canvas.width = 500;
  canvas.height = 500;

  var cx = 250;
  var cy = 250;
  var maxR = 180;

  // 计算每个板块的正确率
  var accuracies = [];
  for (var i = 0; i < n; i++) {
    var catKey = boardOrder[i];
    var catRecords = records.filter(function(r) {
      var qq = allQ.find(function(qqq) { return qqq.id === r.questionId; });
      return qq && qq.category === catKey;
    });
    var catTotal = catRecords.length;
    var catCorrect = catRecords.filter(function(r) { return r.isCorrect; }).length;
    var acc = catTotal > 0 ? (catCorrect / catTotal * 100) : 0;
    accuracies.push(acc);
  }

  // 角度步长
  var angleStep = (2 * Math.PI) / n;
  var startAngle = -Math.PI / 2; // 从顶部开始

  // 清除画布
  ctx.clearRect(0, 0, 500, 500);

  // 绘制背景网格（3层同心多边形）
  var gridColors = ['rgba(45,90,78,0.06)', 'rgba(45,90,78,0.08)', 'rgba(45,90,78,0.1)'];
  for (var layer = 1; layer <= 3; layer++) {
    var r = maxR * (layer / 3);
    ctx.beginPath();
    for (var k = 0; k < n; k++) {
      var angle = startAngle + k * angleStep;
      var px = cx + r * Math.cos(angle);
      var py = cy + r * Math.sin(angle);
      if (k === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.strokeStyle = gridColors[layer - 1];
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 绘制从中心到各顶点的连线
  for (var m = 0; m < n; m++) {
    var angle = startAngle + m * angleStep;
    var ex = cx + maxR * Math.cos(angle);
    var ey = cy + maxR * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = 'rgba(45,90,78,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 绘制数据多边形（填充半透明蓝色）
  ctx.beginPath();
  for (var p = 0; p < n; p++) {
    var dataAngle = startAngle + p * angleStep;
    var dataR = maxR * (accuracies[p] / 100);
    var dx = cx + dataR * Math.cos(dataAngle);
    var dy = cy + dataR * Math.sin(dataAngle);
    if (p === 0) {
      ctx.moveTo(dx, dy);
    } else {
      ctx.lineTo(dx, dy);
    }
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(58,158,143,0.2)';
  ctx.fill();
  ctx.strokeStyle = '#3A9E8F';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 绘制数据点（小圆点）
  for (var q = 0; q < n; q++) {
    var ptAngle = startAngle + q * angleStep;
    var ptR = maxR * (accuracies[q] / 100);
    var ptx = cx + ptR * Math.cos(ptAngle);
    var pty = cy + ptR * Math.sin(ptAngle);

    ctx.beginPath();
    ctx.arc(ptx, pty, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#3A9E8F';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // 绘制标签文字（板块名称）
  ctx.fillStyle = '#4A5568';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (var s = 0; s < n; s++) {
    var labelAngle = startAngle + s * angleStep;
    var labelR = maxR + 28;
    var lx = cx + labelR * Math.cos(labelAngle);
    var ly = cy + labelR * Math.sin(labelAngle);
    var catName = categories[boardOrder[s]] || boardOrder[s];
    ctx.fillText(catName, lx, ly);
  }
}

// ==================== 使用说明页 ====================

function showHelpPage() {
  // 隐藏其他页面
  var pages = document.querySelectorAll('.page');
  for (var i = 0; i < pages.length; i++) {
    pages[i].classList.remove('active');
  }

  // 显示测评页容器
  var assessmentPage = document.getElementById('page-assessment');
  if (assessmentPage) assessmentPage.classList.add('active');

  // 隐藏底部导航
  var tabBar = document.getElementById('tab-bar');
  if (tabBar) tabBar.style.display = 'none';

  var container = document.getElementById('assessment-content');
  var config = getExamConfig();
  var categories = getCategories();
  var boardOrder = getBoardOrder();
  var allQ = getExamQuestions();

  var html = '';

  // (a) 返回导航栏
  html += '<div class="nav-bar">';
  html += '<span class="nav-back" onclick="showPage(\'profile\')">';
  html += '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>';
  html += '</span>';
  html += '<span class="nav-title">使用说明</span>';
  html += '</div>';

  // (b) 等级体系说明
  html += '<div class="card">';
  html += '<div class="section-title">等级体系</div>';
  for (var i = 0; i < LEVELS.length; i++) {
    var lv = LEVELS[i];
    var lvIcon = LEVEL_ICONS[lv.icon] || '';
    var lvColor = getLevelColor(lv.level);
    html += '<div class="help-level-item">';
    html += '<span class="help-level-icon" style="color:' + lvColor + '">' + lvIcon + '</span>';
    html += '<div class="help-level-info">';
    html += '<div class="help-level-name">Lv.' + lv.level + ' ' + lv.name + '</div>';
    html += '<div class="help-level-desc">' + lv.desc + '</div>';
    html += '</div>';
    html += '</div>';
  }
  html += '</div>';

  // (c) 晋阶条件表格
  var exam = localStorage.getItem('kuaiji_selected_exam') || 'junior';
  var promoReqs = PROMOTION_REQUIREMENTS[exam];
  if (promoReqs) {
    html += '<div class="card">';
    html += '<div class="section-title">晋阶条件</div>';
    html += '<div class="help-table">';
    html += '<div class="help-table-header"><span>等级</span><span>做题数</span><span>正确率</span><span>板块正确率</span><span>错题清空</span><span>近期表现</span></div>';
    for (var j = 1; j < promoReqs.length; j++) {
      var req = promoReqs[j];
      if (!req) continue;
      var lvDef = getLevelDef(j);
      html += '<div class="help-table-row">';
      html += '<span>Lv.' + j + ' ' + (lvDef ? lvDef.name : '') + '</span>';
      html += '<span>' + req.totalDone + '题</span>';
      html += '<span>' + req.accuracy + '%</span>';
      html += '<span>' + req.boardAccuracy + '%</span>';
      html += '<span>' + req.wrongClearRate + '%</span>';
      html += '<span>' + req.recentCorrect + '/' + req.recentTotal + '</span>';
      html += '</div>';
    }
    html += '</div>';
    html += '</div>';
  }

  // (d) 智能推题算法说明
  html += '<div class="card">';
  html += '<div class="section-title">智能推题算法</div>';
  html += '<div class="help-algo-list">';

  var algoItems = [
    { title: '板块加权轮转', desc: '系统根据你的薄弱板块动态分配题目权重，薄弱板块出现概率更高' },
    { title: '难度偏好', desc: '根据当前等级自动调整简单/中等/困难题目的比例，循序渐进' },
    { title: '已做去重', desc: '优先推送未做过的题目，当剩余题目不足时自动重置题库' },
    { title: '掌握判定', desc: '某板块答题数>=30且正确率>80%时判定为已掌握，降低推题权重' },
    { title: '权重公式', desc: '基于错题加成和答对衰减动态计算，确保薄弱环节得到更多练习' }
  ];

  for (var k = 0; k < algoItems.length; k++) {
    var algo = algoItems[k];
    html += '<div class="help-algo-item">';
    html += '<span class="help-algo-num">' + (k + 1) + '</span>';
    html += '<div>';
    html += '<div class="help-algo-title">' + algo.title + '</div>';
    html += '<div class="help-algo-desc">' + algo.desc + '</div>';
    html += '</div>';
    html += '</div>';
  }

  html += '</div>';

  // (e) 权重公式展示
  html += '<div class="help-formula">';
  html += '<div class="section-title">权重计算公式</div>';
  html += '<div style="font-size:14px;line-height:1.8;color:var(--text-secondary)">';
  html += '基础权重 = 1.0<br>';
  html += '错题加成 = min(错题数 x 0.15, 2.0)<br>';
  html += '答对衰减 = min(答对数 x 0.05, 1.5)<br>';
  html += '最终权重 = max(基础权重 + 错题加成 - 答对衰减, 0.2)<br>';
  html += '已掌握板块权重 = 0.1';
  html += '</div>';
  html += '</div>';
  html += '</div>';

  // (f) 知识板块列表
  html += '<div class="card">';
  html += '<div class="section-title">知识板块</div>';
  html += '<div class="help-cat-grid">';
  for (var m = 0; m < boardOrder.length; m++) {
    var catKey = boardOrder[m];
    var catName = categories[catKey] || catKey;
    var catQCount = allQ.filter(function(q) { return q.category === catKey; }).length;
    html += '<div class="help-cat-item">';
    html += '<span class="help-cat-name">' + catName + '</span>';
    html += '<span class="help-cat-count">' + catQCount + '题</span>';
    html += '</div>';
  }
  html += '</div>';
  html += '</div>';

  // 底部返回按钮
  html += '<div class="action-row" style="margin-top:18px">';
  html += '<div class="action-btn btn-outline" onclick="showPage(\'profile\')">返回个人中心</div>';
  html += '</div>';

  container.innerHTML = html;
}

// ==================== 数据清理 ====================

function clearAllData() {
  localStorage.removeItem(getStorageKey('records'));
  localStorage.removeItem(getStorageKey('wrong_book'));
  localStorage.removeItem(getStorageKey('user_profile'));
  localStorage.removeItem(getStorageKey('done_questions'));
  showPage('home');
}
