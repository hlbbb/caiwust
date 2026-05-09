// ========== 考试等级配置 ==========

const EXAM_LEVELS = {
  junior: {
    key: 'junior',
    name: '初级会计职称',
    shortName: '初级',
    desc: '会计基础 + 经济法基础，适合零基础入门，侧重基本概念和简单核算',
    icon: 'seedling',
    iconBg: '#E8F5E9',
    iconColor: '#43A047',
    categories: {
      jr_accounting_basis: '会计基础',
      jr_assets: '资产',
      jr_liabilities: '负债',
      jr_equity: '所有者权益',
      jr_revenue_expense: '收入费用利润',
      jr_financial_statements: '财务报表',
      jr_product_cost: '产品成本核算',
      jr_gov_accounting: '政府会计基础',
      jr_economic_law: '经济法基础',
      jr_comprehensive: '综合实战'
    },
    boardOrder: [
      'jr_accounting_basis', 'jr_assets', 'jr_liabilities', 'jr_equity',
      'jr_revenue_expense', 'jr_financial_statements', 'jr_product_cost',
      'jr_gov_accounting', 'jr_economic_law', 'jr_comprehensive'
    ]
  },
  intermediate: {
    key: 'intermediate',
    name: '中级会计职称',
    shortName: '中级',
    desc: '中级会计实务 + 财务管理 + 经济法，适合有基础者进阶，侧重复杂业务处理',
    icon: 'fire',
    iconBg: '#FFF3E0',
    iconColor: '#FF9800',
    categories: {
      im_long_term_equity: '长期股权投资',
      im_investment_property: '投资性房地产',
      im_assets_impairment: '资产减值',
      im_income_tax: '所得税会计',
      im_foreign_currency: '外币折算',
      im_accounting_policies: '会计政策与估计',
      im_restructuring: '企业合并与合并报表',
      im_financial_management: '财务管理',
      im_economic_law: '经济法',
      im_comprehensive: '综合实战'
    },
    boardOrder: [
      'im_long_term_equity', 'im_investment_property', 'im_assets_impairment',
      'im_income_tax', 'im_foreign_currency', 'im_accounting_policies',
      'im_restructuring', 'im_financial_management', 'im_economic_law',
      'im_comprehensive'
    ]
  },
  senior: {
    key: 'senior',
    name: '高级会计职称',
    shortName: '高级',
    desc: '高级会计实务，适合资深财务人员，侧重综合案例分析和管理决策',
    icon: 'star',
    iconBg: '#F3E5F5',
    iconColor: '#9C27B0',
    categories: {
      sr_enterprise_strategy: '企业战略与财务战略',
      sr_enterprise_restructuring: '企业并购与重组',
      sr_financial_instruments: '金融工具会计',
      sr_consolidation_advanced: '合并与合并报表（高级）',
      sr_gov_npo_accounting: '政府与非营利组织会计',
      sr_performance_management: '业绩评价与激励',
      sr_internal_control: '内部控制',
      sr_comprehensive: '综合实战'
    },
    boardOrder: [
      'sr_enterprise_strategy', 'sr_enterprise_restructuring',
      'sr_financial_instruments', 'sr_consolidation_advanced',
      'sr_gov_npo_accounting', 'sr_performance_management',
      'sr_internal_control', 'sr_comprehensive'
    ]
  }
}

// 等级定义（通用）
const LEVELS = [
  { level: 1, name: '会计小白', icon: 'seedling', desc: '借贷都分不清？从头开始', difficulty: { easy: 0.70, medium: 0.25, hard: 0.05 } },
  { level: 2, name: '初窥门径', icon: 'fire', desc: '会计要素已经拿捏了', difficulty: { easy: 0.60, medium: 0.30, hard: 0.10 } },
  { level: 3, name: '小有心得', icon: 'star', desc: '分录报表不在话下', difficulty: { easy: 0.30, medium: 0.50, hard: 0.20 } },
  { level: 4, name: '财务能手', icon: 'target', desc: '综合题也能从容应对', difficulty: { easy: 0.10, medium: 0.40, hard: 0.50 } },
  { level: 5, name: '财务达人', icon: 'rocket', desc: '没有我不会的会计题', difficulty: { easy: 0.00, medium: 0.20, hard: 0.80 } }
]

const LEVEL_ICONS = {
  seedling: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 20h10"/><path d="M10 20c0-4-3-7-6-7"/><path d="M14 20c0-4 3-7 6-7"/><path d="M12 20v-8"/><path d="M12 12C12 6 7 2 7 2s5 2 5 10"/><path d="M12 8c0-4 5-6 5-6s-5 2-5 6"/></svg>',
  fire: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 22c4-2 8-6 8-11 0-3-2-6-5-7-1 2-3 3-5 3-1-2-1-4 0-6-4 1-6 5-6 8 0 5 4 9 8 13z"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  rocket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>'
}

// 晋阶条件（按考试等级分别配置）
const PROMOTION_REQUIREMENTS = {
  junior: [
    null,
    { totalDone: 50, accuracy: 60, boardAccuracy: 70, wrongClearRate: 80, recentCorrect: 14, recentTotal: 20, boards: ['jr_accounting_basis', 'jr_assets'] },
    { totalDone: 120, accuracy: 65, boardAccuracy: 70, wrongClearRate: 80, recentCorrect: 14, recentTotal: 20, boards: ['jr_liabilities', 'jr_equity', 'jr_revenue_expense'] },
    { totalDone: 200, accuracy: 70, boardAccuracy: 70, wrongClearRate: 80, recentCorrect: 15, recentTotal: 20, boards: ['jr_financial_statements', 'jr_product_cost'] },
    { totalDone: 350, accuracy: 75, boardAccuracy: 70, wrongClearRate: 90, recentCorrect: 16, recentTotal: 20, boards: ['jr_economic_law', 'jr_gov_accounting', 'jr_comprehensive'] }
  ],
  intermediate: [
    null,
    { totalDone: 50, accuracy: 60, boardAccuracy: 70, wrongClearRate: 80, recentCorrect: 14, recentTotal: 20, boards: ['im_long_term_equity', 'im_investment_property'] },
    { totalDone: 120, accuracy: 65, boardAccuracy: 70, wrongClearRate: 80, recentCorrect: 14, recentTotal: 20, boards: ['im_assets_impairment', 'im_income_tax', 'im_foreign_currency'] },
    { totalDone: 200, accuracy: 70, boardAccuracy: 70, wrongClearRate: 80, recentCorrect: 15, recentTotal: 20, boards: ['im_accounting_policies', 'im_restructuring'] },
    { totalDone: 350, accuracy: 75, boardAccuracy: 70, wrongClearRate: 90, recentCorrect: 16, recentTotal: 20, boards: ['im_financial_management', 'im_economic_law', 'im_comprehensive'] }
  ],
  senior: [
    null,
    { totalDone: 40, accuracy: 60, boardAccuracy: 70, wrongClearRate: 80, recentCorrect: 14, recentTotal: 20, boards: ['sr_enterprise_strategy', 'sr_financial_instruments'] },
    { totalDone: 100, accuracy: 65, boardAccuracy: 70, wrongClearRate: 80, recentCorrect: 14, recentTotal: 20, boards: ['sr_enterprise_restructuring', 'sr_consolidation_advanced'] },
    { totalDone: 180, accuracy: 70, boardAccuracy: 70, wrongClearRate: 80, recentCorrect: 15, recentTotal: 20, boards: ['sr_gov_npo_accounting', 'sr_internal_control'] },
    { totalDone: 300, accuracy: 75, boardAccuracy: 70, wrongClearRate: 90, recentCorrect: 16, recentTotal: 20, boards: ['sr_performance_management', 'sr_comprehensive'] }
  ]
}

const CHALLENGE_CONFIG = {
  junior: {
    1: { boards: ['jr_assets', 'jr_liabilities'], difficulty: { easy: 0.50, medium: 0.40, hard: 0.10 } },
    2: { boards: ['jr_revenue_expense', 'jr_financial_statements'], difficulty: { easy: 0.20, medium: 0.50, hard: 0.30 } },
    3: { boards: ['jr_product_cost', 'jr_economic_law'], difficulty: { easy: 0.10, medium: 0.40, hard: 0.50 } },
    4: { boards: null, difficulty: { easy: 0.00, medium: 0.30, hard: 0.70 } }
  },
  intermediate: {
    1: { boards: ['im_investment_property', 'im_assets_impairment'], difficulty: { easy: 0.50, medium: 0.40, hard: 0.10 } },
    2: { boards: ['im_income_tax', 'im_foreign_currency'], difficulty: { easy: 0.20, medium: 0.50, hard: 0.30 } },
    3: { boards: ['im_restructuring', 'im_financial_management'], difficulty: { easy: 0.10, medium: 0.40, hard: 0.50 } },
    4: { boards: null, difficulty: { easy: 0.00, medium: 0.30, hard: 0.70 } }
  },
  senior: {
    1: { boards: ['sr_financial_instruments', 'sr_enterprise_restructuring'], difficulty: { easy: 0.50, medium: 0.40, hard: 0.10 } },
    2: { boards: ['sr_consolidation_advanced', 'sr_gov_npo_accounting'], difficulty: { easy: 0.20, medium: 0.50, hard: 0.30 } },
    3: { boards: ['sr_internal_control', 'sr_performance_management'], difficulty: { easy: 0.10, medium: 0.40, hard: 0.50 } },
    4: { boards: null, difficulty: { easy: 0.00, medium: 0.30, hard: 0.70 } }
  }
}

// ========== 工具函数 ==========

function getExamConfig() {
  const examKey = localStorage.getItem('kuaiji_selected_exam')
  if (!examKey || !EXAM_LEVELS[examKey]) return null
  return EXAM_LEVELS[examKey]
}

function getLevelDef(level) {
  return LEVELS.find(l => l.level === level) || LEVELS[0]
}

function getLevelIcon(level) {
  const def = getLevelDef(level)
  return LEVEL_ICONS[def.icon] || ''
}

function getLevelColor(level) {
  const colors = { 1: '#8BC34A', 2: '#FF9800', 3: '#FFD700', 4: '#E91E63', 5: '#9C27B0' }
  return colors[level] || '#8BC34A'
}

function getCategories() {
  const config = getExamConfig()
  return config ? config.categories : {}
}

function getBoardOrder() {
  const config = getExamConfig()
  return config ? config.boardOrder : []
}

function getDifficulties() {
  return { easy: '简单', medium: '中等', hard: '困难' }
}

function diffTag(diff) {
  return `<span class="tag tag-${diff}">${getDifficulties()[diff] || diff}</span>`
}

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
