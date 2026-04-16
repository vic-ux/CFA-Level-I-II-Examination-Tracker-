import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Flame,
  LayoutDashboard,
  Menu,
  Plus,
  Settings,
  Share2,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Upload,
  X,
  Zap,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const SUBJECTS = [
  'Ethics',
  'Quantitative Methods',
  'Economics',
  'Financial Statement Analysis',
  'Corporate Issuers',
  'Equity',
  'Fixed Income',
  'Derivatives',
  'Alternative Investments',
  'Portfolio Management',
]

const SHORT = {
  Ethics: 'Ethics',
  'Quantitative Methods': 'Quant',
  Economics: 'Econ',
  'Financial Statement Analysis': 'FSA',
  'Corporate Issuers': 'Corp',
  Equity: 'Equity',
  'Fixed Income': 'FI',
  Derivatives: 'Deriv',
  'Alternative Investments': 'Alt',
  'Portfolio Management': 'PM',
}

const SUBJECT_COLORS = ['#0f766e', '#0d9488', '#14b8a6', '#10b981', '#0891b2', '#334155', '#0f172a', '#f59e0b', '#c9a227', '#e11d48']
const STORAGE_KEY = 'cfa-ace-tracker-premium-v2'

function cn(...items) {
  return items.filter(Boolean).join(' ')
}
function toISO(date) {
  return date.toISOString().slice(0, 10)
}
function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function addDays(dateLike, days) {
  const d = typeof dateLike === 'string' ? parseISO(dateLike) : new Date(dateLike)
  const next = new Date(d)
  next.setDate(next.getDate() + days)
  return next
}
function dateRange(startISO, endISO) {
  const out = []
  let cursor = parseISO(startISO)
  const end = parseISO(endISO)
  while (cursor <= end) {
    out.push(toISO(cursor))
    cursor = addDays(cursor, 1)
  }
  return out
}
function isWeekend(dateLike) {
  const d = typeof dateLike === 'string' ? parseISO(dateLike) : dateLike
  const day = d.getDay()
  return day === 0 || day === 6
}
function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num))
}
function sum(arr) {
  return arr.reduce((a, b) => a + b, 0)
}
function avg(arr) {
  return arr.length ? sum(arr) / arr.length : 0
}
function fmtDate(iso) {
  return parseISO(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
function weekdayName(iso) {
  return parseISO(iso).toLocaleDateString(undefined, { weekday: 'long' })
}
function monthKey(iso) {
  return iso.slice(0, 7)
}
function diffDays(startISO, endISO) {
  const a = parseISO(startISO)
  const b = parseISO(endISO)
  a.setHours(0, 0, 0, 0)
  b.setHours(0, 0, 0, 0)
  return Math.round((b - a) / 86400000)
}
function getWeekBounds(iso) {
  const d = parseISO(iso)
  const day = d.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const start = addDays(d, mondayOffset)
  const end = addDays(start, 6)
  return { start: toISO(start), end: toISO(end) }
}
function planHours(dateISO, settings) {
  return isWeekend(dateISO) ? settings.weekendHours : settings.weekdayHours
}

function seededEntries(settings) {
  const today = new Date()
  const samples = [
    [10, 'Ethics', 3, 'Reading', 20, 15, 4, 'Standards and application drills.', ''],
    [9, 'Quantitative Methods', 3, 'Practice Questions', 26, 16, 3, 'TVM and hypothesis testing needed more work.', ''],
    [8, 'Economics', 3, 'Revision', 18, 12, 4, 'FX and macro recap.', ''],
    [7, 'Financial Statement Analysis', 3, 'Reading', 22, 13, 3, 'Cash flow ratios still soft.', ''],
    [6, 'Equity', 3, 'Practice Questions', 28, 22, 5, 'Strong question set.', ''],
    [5, 'Fixed Income', 6, 'Revision', 35, 24, 4, 'Weekend deep dive.', ''],
    [4, 'Portfolio Management', 6, 'Mock Exam', 60, 42, 4, 'Timed half mock.', 70],
    [3, 'Corporate Issuers', 3, 'Reading', 18, 12, 4, 'Governance and agency review.', ''],
    [2, 'Alternative Investments', 3, 'Formula Review', 12, 9, 4, 'Very manageable session.', ''],
    [1, 'Derivatives', 3, 'Practice Questions', 20, 10, 3, 'Need another pass on swaps.', ''],
  ]
  return samples
    .map((row, idx) => {
      const date = toISO(addDays(today, -row[0]))
      if (date < settings.startDate) return null
      return {
        id: `seed-${idx}`,
        date,
        plannedHours: planHours(date, settings),
        actualHours: row[2],
        subject: row[1],
        topic: row[1],
        studyType: row[3],
        questionsAttempted: row[4],
        questionsCorrect: row[5],
        focusLevel: row[6],
        notes: row[7],
        mockScore: row[8],
      }
    })
    .filter(Boolean)
}

function createInitialState() {
  const settings = {
    brandName: 'CFA Ace Tracker',
    startDate: '2026-04-15',
    examDate: '2026-11-10',
    weekdayHours: 3,
    weekendHours: 6,
    goalMockScore: 78,
    dailyReminder: '19:00',
    theme: 'Executive Teal',
    subjectTargets: Object.fromEntries(SUBJECTS.map((s) => [s, 60])),
  }
  return {
    settings,
    entries: seededEntries(settings),
    mocks: [
      {
        id: 'm-1',
        date: toISO(addDays(new Date(), -4)),
        name: 'Diagnostic Half Mock',
        score: 70,
        notes: 'Good base. Needs sharper Quant and FSA execution.',
      },
    ],
    weeklyReflections: {},
    ui: {
      page: 'Dashboard',
      mode: 'landing',
      mobileOpen: false,
      selectedSubject: 'Ethics',
      selectedMonth: monthKey(toISO(new Date())),
    },
  }
}

function loadState() {
  if (typeof window === 'undefined') return createInitialState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw)
    return {
      ...createInitialState(),
      ...parsed,
      settings: { ...createInitialState().settings, ...(parsed.settings || {}) },
      ui: { ...createInitialState().ui, ...(parsed.ui || {}) },
    }
  } catch {
    return createInitialState()
  }
}

function Button({ children, onClick, tone = 'primary', className = '', type = 'button' }) {
  const tones = {
    primary: 'bg-slate-950 text-white hover:bg-slate-800',
    accent: 'bg-teal-700 text-white hover:bg-teal-800',
    secondary: 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
  }
  return (
    <button type={type} onClick={onClick} className={cn('inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition', tones[tone], className)}>
      {children}
    </button>
  )
}

function Panel({ title, subtitle, right, children, className = '' }) {
  return (
    <section className={cn('rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm', className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

function KPI({ title, value, sub, icon: Icon, tone = 'default' }) {
  const toneStyles = {
    default: 'bg-white border-slate-200',
    strong: 'bg-teal-50 border-teal-200',
    warm: 'bg-amber-50 border-amber-200',
    alert: 'bg-rose-50 border-rose-200',
  }
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn('rounded-[26px] border p-4 shadow-sm', toneStyles[tone])}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
          <p className="mt-1 text-sm text-slate-600">{sub}</p>
        </div>
        <div className="rounded-2xl bg-white p-2 shadow-sm">
          <Icon className="h-5 w-5 text-slate-700" />
        </div>
      </div>
    </motion.div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  )
}
function TextInput(props) {
  return <input {...props} className={cn('w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-700', props.className || '')} />
}
function SelectInput({ options, ...props }) {
  return (
    <select {...props} className={cn('w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-700', props.className || '')}>
      {options.map((option) => (
        <option key={option.value ?? option} value={option.value ?? option}>
          {option.label ?? option}
        </option>
      ))}
    </select>
  )
}
function Progress({ value }) {
  return (
    <div className="h-2.5 w-full rounded-full bg-slate-100">
      <div className="h-2.5 rounded-full bg-teal-700" style={{ width: `${clamp(value, 0, 100)}%` }} />
    </div>
  )
}

function LandingPage({ onOpenApp, settings }) {
  const features = [
    { icon: LayoutDashboard, title: 'Executive dashboard', text: 'Readiness, streaks, subject pressure, and next best action in one command center.' },
    { icon: CalendarDays, title: 'Daily check-ins', text: 'Log study sessions, questions, focus, notes, and mock scores in seconds.' },
    { icon: Flame, title: 'Consistency heat map', text: 'See every study day between start date and exam day with brutal clarity.' },
    { icon: BarChart3, title: 'Analytics that matter', text: 'Track accuracy, subject coverage, mock trajectory, and execution variance.' },
  ]
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 rounded-[30px] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-teal-600 p-3"><Brain className="h-6 w-6" /></div>
            <div>
              <p className="text-lg font-semibold">{settings.brandName}</p>
              <p className="text-sm text-slate-300">Premium CFA study operating system</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button tone="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={onOpenApp}>Live app</Button>
            <Button tone="accent" onClick={onOpenApp}>Launch workspace <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </header>

        <section className="grid items-center gap-10 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-sm text-teal-100"><Sparkles className="h-4 w-4" /> Publish-ready product shell</div>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">Turn CFA prep into a measured, visual, and disciplined performance system.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">CFA Ace Tracker helps candidates plan daily hours, monitor subject coverage, log question performance, track mock results, and move toward exam day with clarity instead of guesswork.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button tone="accent" className="px-5 py-3" onClick={onOpenApp}>Open the app <ArrowRight className="h-4 w-4" /></Button>
              <Button tone="secondary" className="border-white/15 bg-white/5 px-5 py-3 text-white hover:bg-white/10" onClick={onOpenApp}>Explore product</Button>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Study plan</p><p className="mt-2 text-sm font-medium text-white">{settings.weekdayHours}h weekdays / {settings.weekendHours}h weekends</p></div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Exam date</p><p className="mt-2 text-sm font-medium text-white">{fmtDate(settings.examDate)}</p></div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Experience</p><p className="mt-2 text-sm font-medium text-white">Public-facing SaaS style shell</p></div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 rounded-[36px] bg-teal-500/20 blur-3xl" />
            <div className="relative rounded-[36px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[26px] bg-white p-4 text-slate-950"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Readiness</p><p className="mt-2 text-4xl font-semibold">74</p><p className="mt-1 text-sm text-slate-600">Competitive trajectory</p></div>
                <div className="rounded-[26px] bg-teal-700 p-4 text-white"><p className="text-xs uppercase tracking-[0.18em] text-teal-100">Current streak</p><p className="mt-2 text-4xl font-semibold">6</p><p className="mt-1 text-sm text-teal-100">Keep the chain alive</p></div>
              </div>
              <div className="mt-4 rounded-[28px] bg-slate-950 p-4 text-white">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Today’s call</p>
                <div className="mt-3 flex items-start justify-between gap-4"><div><p className="text-xl font-semibold">Study Fixed Income next</p><p className="mt-1 text-sm text-slate-300">It is lagging target coverage and has been inactive for 9 days.</p></div><div className="rounded-2xl bg-teal-600 p-3"><Zap className="h-5 w-5" /></div></div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[24px] bg-white/10 p-4 text-white"><p className="text-xs uppercase tracking-[0.18em] text-slate-300">Hours</p><p className="mt-2 text-2xl font-semibold">138 / 171</p></div>
                <div className="rounded-[24px] bg-white/10 p-4 text-white"><p className="text-xs uppercase tracking-[0.18em] text-slate-300">Mock average</p><p className="mt-2 text-2xl font-semibold">70%</p></div>
                <div className="rounded-[24px] bg-white/10 p-4 text-white"><p className="text-xs uppercase tracking-[0.18em] text-slate-300">Weakest zone</p><p className="mt-2 text-lg font-semibold">FSA / Quant</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 py-8 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <div className="w-fit rounded-2xl bg-white/10 p-3"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-300">{feature.text}</p>
              </div>
            )
          })}
        </section>
      </div>
    </div>
  )
}

export default function App() {
  const [state, setState] = useState(createInitialState)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState(() => {
    const initial = createInitialState().settings
    const today = toISO(new Date())
    return {
      date: today,
      plannedHours: planHours(today, initial),
      actualHours: '',
      subject: SUBJECTS[0],
      topic: '',
      studyType: 'Reading',
      questionsAttempted: '',
      questionsCorrect: '',
      mockScore: '',
      focusLevel: 4,
      notes: '',
    }
  })
  const fileInputRef = useRef(null)

  useEffect(() => {
    setState(loadState())
  }, [])
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const settings = state.settings
  const entries = [...state.entries].sort((a, b) => a.date.localeCompare(b.date))
  const todayISO = toISO(new Date())
  const dates = useMemo(() => dateRange(settings.startDate, settings.examDate), [settings.startDate, settings.examDate])

  const entryMap = useMemo(() => {
    const map = {}
    entries.forEach((entry) => {
      if (!map[entry.date]) map[entry.date] = []
      map[entry.date].push(entry)
    })
    return map
  }, [entries])

  const todayEntries = entryMap[todayISO] || []
  const plannedToDate = sum(dates.filter((d) => d <= todayISO).map((d) => planHours(d, settings)))
  const actualToDate = sum(entries.filter((e) => e.date <= todayISO).map((e) => Number(e.actualHours || 0)))
  const completionRate = plannedToDate ? (actualToDate / plannedToDate) * 100 : 0
  const daysLeft = Math.max(0, diffDays(todayISO, settings.examDate))

  const subjectStats = useMemo(() => SUBJECTS.map((subject) => {
    const data = entries.filter((e) => e.subject === subject)
    const actualHours = sum(data.map((d) => Number(d.actualHours || 0)))
    const targetHours = Number(settings.subjectTargets[subject] || 0)
    const attempted = sum(data.map((d) => Number(d.questionsAttempted || 0)))
    const correct = sum(data.map((d) => Number(d.questionsCorrect || 0)))
    const accuracy = attempted ? (correct / attempted) * 100 : 0
    const mockScores = data.map((d) => Number(d.mockScore || 0)).filter((n) => n > 0)
    const lastStudied = data.length ? data[data.length - 1].date : ''
    const completion = targetHours ? (actualHours / targetHours) * 100 : 0
    const inactiveDays = lastStudied ? diffDays(lastStudied, todayISO) : 999
    let risk = 'On Track'
    if (inactiveDays > 21 || completion < 20) risk = 'Neglected'
    else if (accuracy > 0 && accuracy < 55) risk = 'At Risk'
    else if (inactiveDays > 10 || completion < 45) risk = 'Needs Attention'
    const confidence = accuracy >= 75 && completion >= 60 ? 'High' : accuracy < 55 || completion < 30 ? 'Low' : 'Moderate'
    return { subject, actualHours, targetHours, attempted, correct, accuracy, lastStudied, inactiveDays, completion, risk, confidence, mockAverage: mockScores.length ? avg(mockScores) : 0 }
  }), [entries, settings.subjectTargets, todayISO])

  const overallAccuracy = (() => {
    const attempted = sum(entries.map((e) => Number(e.questionsAttempted || 0)))
    const correct = sum(entries.map((e) => Number(e.questionsCorrect || 0)))
    return attempted ? (correct / attempted) * 100 : 0
  })()
  const mockAverage = state.mocks.length ? avg(state.mocks.map((m) => Number(m.score || 0))) : 0

  const streak = useMemo(() => {
    let total = 0
    let cursor = todayISO
    while (cursor >= settings.startDate) {
      const hours = sum((entryMap[cursor] || []).map((e) => Number(e.actualHours || 0)))
      if (hours > 0) total += 1
      else break
      cursor = toISO(addDays(cursor, -1))
    }
    return total
  }, [todayISO, settings.startDate, entryMap])

  const longestStreak = useMemo(() => {
    let best = 0
    let current = 0
    dates.forEach((date) => {
      const hours = sum((entryMap[date] || []).map((e) => Number(e.actualHours || 0)))
      if (hours > 0) {
        current += 1
        best = Math.max(best, current)
      } else current = 0
    })
    return best
  }, [dates, entryMap])

  const readinessScore = useMemo(() => {
    const hoursFactor = clamp(completionRate, 0, 100)
    const coverageFactor = clamp(avg(subjectStats.map((s) => s.completion)), 0, 100)
    const accuracyFactor = clamp(overallAccuracy, 0, 100)
    const mockFactor = clamp(mockAverage || 45, 0, 100)
    const consistencyFactor = clamp((streak / 14) * 100, 0, 100)
    return Math.round(hoursFactor * 0.3 + coverageFactor * 0.2 + accuracyFactor * 0.2 + mockFactor * 0.15 + consistencyFactor * 0.15)
  }, [completionRate, subjectStats, overallAccuracy, mockAverage, streak])

  const readinessLabel = readinessScore >= 85 ? 'Exam Ready' : readinessScore >= 70 ? 'Competitive' : readinessScore >= 50 ? 'Building' : 'Early Stage'
  const strongest = [...subjectStats].sort((a, b) => b.accuracy + b.completion - (a.accuracy + a.completion))[0]
  const weakest = [...subjectStats].sort((a, b) => (a.accuracy || 40) + a.completion - a.inactiveDays - ((b.accuracy || 40) + b.completion - b.inactiveDays))[0]
  const recommendation = [...subjectStats].sort((a, b) => {
    const aPenalty = a.inactiveDays * 2 + (100 - a.completion) + (a.accuracy ? 70 - a.accuracy : 20)
    const bPenalty = b.inactiveDays * 2 + (100 - b.completion) + (b.accuracy ? 70 - b.accuracy : 20)
    return bPenalty - aPenalty
  })[0]

  const trendData = dates.filter((d) => d <= todayISO).slice(-14).map((date) => ({ date: date.slice(5), planned: planHours(date, settings), actual: sum((entryMap[date] || []).map((e) => Number(e.actualHours || 0))) }))
  const doughnutHours = [
    { name: 'Completed', value: Number(actualToDate.toFixed(1)), color: '#0f766e' },
    { name: 'Remaining', value: Math.max(0, Number((plannedToDate - actualToDate).toFixed(1))), color: '#cbd5e1' },
  ]
  const doughnutSubjects = subjectStats.filter((s) => s.actualHours > 0).map((s, idx) => ({ name: SHORT[s.subject], value: Number(s.actualHours.toFixed(1)), color: SUBJECT_COLORS[idx % SUBJECT_COLORS.length] }))

  const week = getWeekBounds(todayISO)
  const weekDates = dateRange(week.start, week.end)
  const weeklyData = weekDates.map((date) => ({ date, label: parseISO(date).toLocaleDateString(undefined, { weekday: 'short' }), planned: planHours(date, settings), actual: sum((entryMap[date] || []).map((e) => Number(e.actualHours || 0))), subject: (entryMap[date] || [])[0]?.subject || '-', questions: sum((entryMap[date] || []).map((e) => Number(e.questionsAttempted || 0))) }))
  const weeklyPlanned = sum(weeklyData.map((d) => d.planned))
  const weeklyActual = sum(weeklyData.map((d) => d.actual))
  const weeklyQuestions = sum(weeklyData.map((d) => d.questions))

  const selectedMonthDates = dates.filter((d) => monthKey(d) === state.ui.selectedMonth)
  const monthCells = selectedMonthDates.map((date) => {
    const planned = planHours(date, settings)
    const actual = sum((entryMap[date] || []).map((e) => Number(e.actualHours || 0)))
    const entry = (entryMap[date] || [])[0] || null
    return { date, planned, actual, completion: planned ? (actual / planned) * 100 : 0, entry }
  })

  const monthStats = useMemo(() => {
    const grouped = {}
    dates.forEach((date) => {
      const key = monthKey(date)
      if (!grouped[key]) grouped[key] = { key, planned: 0, actual: 0, daysStudied: 0 }
      const planned = planHours(date, settings)
      const actual = sum((entryMap[date] || []).map((e) => Number(e.actualHours || 0)))
      grouped[key].planned += planned
      grouped[key].actual += actual
      if (actual > 0) grouped[key].daysStudied += 1
    })
    return Object.values(grouped).map((item) => ({ ...item, completion: item.planned ? (item.actual / item.planned) * 100 : 0 }))
  }, [dates, entryMap, settings])

  const reflectionKey = `${week.start}_${week.end}`
  const reflection = state.weeklyReflections[reflectionKey] || { wins: '', blockers: '', attention: '', focus: '' }
  const analyticsBySubject = subjectStats.map((s) => ({ subject: SHORT[s.subject], accuracy: Number(s.accuracy.toFixed(0)), completion: Number(s.completion.toFixed(0)) }))
  const radarData = [
    { metric: 'Hours', value: Number(clamp(completionRate, 0, 100).toFixed(0)) },
    { metric: 'Coverage', value: Number(avg(subjectStats.map((s) => s.completion)).toFixed(0)) },
    { metric: 'Accuracy', value: Number(overallAccuracy.toFixed(0)) },
    { metric: 'Mocks', value: Number(mockAverage.toFixed(0)) },
    { metric: 'Consistency', value: Number(clamp((streak / 14) * 100, 0, 100).toFixed(0)) },
  ]
  const mockTrend = state.mocks.map((m) => ({ date: m.date.slice(5), score: Number(m.score) }))

  function setPage(page) {
    setState((prev) => ({ ...prev, ui: { ...prev.ui, page, mobileOpen: false } }))
  }
  function exportBackup() {
    const payload = { app: settings.brandName, exportedAt: new Date().toISOString(), version: 2, data: state }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cfa-ace-tracker-backup-${todayISO}.json`
    a.click()
    URL.revokeObjectURL(url)
    setToast('Backup exported.')
  }
  function importBackup(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'))
        const imported = parsed.data || parsed
        if (!imported.settings || !imported.entries) {
          setToast('That file is not a valid CFA Ace Tracker backup.')
          return
        }
        setState({ ...createInitialState(), ...imported, settings: { ...createInitialState().settings, ...(imported.settings || {}) }, ui: { ...createInitialState().ui, ...(imported.ui || {}) } })
        setToast('Backup restored.')
      } catch {
        setToast('Import failed. Use a valid JSON backup.')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }
  function saveEntry(e) {
    e?.preventDefault?.()
    if (!form.date || !form.subject || form.actualHours === '') {
      setToast('Fill date, subject, and actual hours first.')
      return
    }
    const actual = Number(form.actualHours)
    if (Number.isNaN(actual) || actual < 0) {
      setToast('Actual hours must be a valid number.')
      return
    }
    const entry = { id: `entry-${Date.now()}`, date: form.date, plannedHours: Number(form.plannedHours), actualHours: actual, subject: form.subject, topic: form.topic || form.subject, studyType: form.studyType, questionsAttempted: Number(form.questionsAttempted || 0), questionsCorrect: Number(form.questionsCorrect || 0), focusLevel: Number(form.focusLevel || 4), notes: form.notes, mockScore: form.mockScore === '' ? '' : Number(form.mockScore) }
    setState((prev) => ({ ...prev, entries: [...prev.entries, entry], mocks: entry.mockScore === '' ? prev.mocks : [...prev.mocks, { id: `mock-${Date.now()}`, date: entry.date, name: `${entry.subject} Session Mock`, score: Number(entry.mockScore), notes: entry.notes || 'Logged from daily session' }] }))
    setForm((prev) => ({ ...prev, actualHours: '', topic: '', questionsAttempted: '', questionsCorrect: '', mockScore: '', notes: '' }))
    setToast('Study session saved.')
  }
  function deleteEntry(id) {
    setState((prev) => ({ ...prev, entries: prev.entries.filter((entry) => entry.id !== id) }))
    setToast('Entry removed.')
  }
  function autoDistributeTargets() {
    const totalAvailable = sum(dates.map((d) => planHours(d, settings)))
    const each = Math.round(totalAvailable / SUBJECTS.length)
    setState((prev) => ({ ...prev, settings: { ...prev.settings, subjectTargets: Object.fromEntries(SUBJECTS.map((s) => [s, each])) } }))
    setToast('Subject targets auto-distributed.')
  }
  function updateSettings(field, value) {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, [field]: value } }))
  }
  function updateSubjectTarget(subject, value) {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, subjectTargets: { ...prev.settings.subjectTargets, [subject]: Number(value || 0) } } }))
  }
  function updateReflection(field, value) {
    setState((prev) => ({ ...prev, weeklyReflections: { ...prev.weeklyReflections, [reflectionKey]: { ...reflection, [field]: value } } }))
  }

  const nav = [
    ['Dashboard', LayoutDashboard],
    ['Daily Log', CalendarDays],
    ['Subjects', BookOpen],
    ['Analytics', BarChart3],
    ['Heat Map', Flame],
    ['Weekly Review', Target],
    ['Settings', Settings],
  ]

  if (state.ui.mode === 'landing') {
    return <LandingPage onOpenApp={() => setState((prev) => ({ ...prev, ui: { ...prev.ui, mode: 'app' } }))} settings={settings} />
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <input ref={fileInputRef} type="file" accept="application/json" onChange={importBackup} className="hidden" />
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1700px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setState((prev) => ({ ...prev, ui: { ...prev.ui, mobileOpen: !prev.ui.mobileOpen } }))} className="rounded-2xl border border-slate-200 p-2 lg:hidden">{state.ui.mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
            <div className="rounded-2xl bg-teal-700 p-3 text-white"><Brain className="h-5 w-5" /></div>
            <div><p className="text-lg font-semibold tracking-tight">{settings.brandName}</p><p className="text-sm text-slate-500">Publish-ready app workspace</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button tone="secondary" onClick={() => setState((prev) => ({ ...prev, ui: { ...prev.ui, mode: 'landing' } }))}><Share2 className="h-4 w-4" /> Public page</Button>
            <Button tone="secondary" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4" /> Import</Button>
            <Button tone="secondary" onClick={exportBackup}><Download className="h-4 w-4" /> Export</Button>
            <Button tone="accent" onClick={() => setPage('Daily Log')}><Plus className="h-4 w-4" /> Log today</Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1700px] grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className={cn('border-b border-slate-200 bg-[#0f172a] p-5 text-white lg:min-h-[calc(100vh-81px)] lg:border-b-0 lg:border-r', !state.ui.mobileOpen && 'hidden lg:block')}>
          <div className="rounded-[30px] bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Readiness score</p>
            <div className="mt-3 flex items-end gap-3"><span className="text-5xl font-semibold">{readinessScore}</span><span className="mb-1 rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">{readinessLabel}</span></div>
            <div className="mt-4 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-teal-500" style={{ width: `${readinessScore}%` }} /></div>
            <p className="mt-4 text-sm text-slate-300">{readinessScore >= 85 ? 'You are operating with real exam control.' : readinessScore >= 70 ? 'Solid trajectory. Keep pressure on weak areas.' : readinessScore >= 50 ? 'A strong foundation is forming.' : 'Build consistency first, then volume and output.'}</p>
          </div>
          <nav className="mt-6 space-y-2">
            {nav.map(([name, Icon]) => {
              const active = state.ui.page === name
              return <button key={name} onClick={() => setPage(name)} className={cn('flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition', active ? 'bg-white text-slate-950' : 'text-slate-200 hover:bg-white/10')}><span className="flex items-center gap-3"><Icon className="h-5 w-5" /><span className="text-sm font-medium">{name}</span></span><ChevronRight className="h-4 w-4 opacity-70" /></button>
            })}
          </nav>
          <div className="mt-6 rounded-[30px] bg-white/5 p-4 text-sm text-slate-300"><p className="font-medium text-white">Study engine</p><p className="mt-2">Weekdays: {settings.weekdayHours} hours</p><p>Weekends: {settings.weekendHours} hours</p><p>Exam: {fmtDate(settings.examDate)}</p><p className="mt-3 text-slate-400">One daily log powers the dashboard, heat map, analytics, and reviews.</p></div>
        </aside>

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-teal-700">Maximum capacity build</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{state.ui.page}</h1>
              <p className="mt-1 text-sm text-slate-600">{state.ui.page === 'Dashboard' && 'The command center for your CFA prep system.'}{state.ui.page === 'Daily Log' && 'Fast logging flow with immediate downstream updates.'}{state.ui.page === 'Subjects' && 'Coverage, risk, and confidence at subject level.'}{state.ui.page === 'Analytics' && 'Effort, output, and readiness in one view.'}{state.ui.page === 'Heat Map' && 'Consistency visualized over the full prep horizon.'}{state.ui.page === 'Weekly Review' && 'Reset your week with insight and intention.'}{state.ui.page === 'Settings' && 'Control targets, study rules, and persistence.'}</p>
            </div>
            <div className="flex flex-wrap gap-3"><Button tone="secondary" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4" /> Restore</Button><Button tone="secondary" onClick={exportBackup}><Download className="h-4 w-4" /> Save backup</Button><Button tone="accent" onClick={() => setPage('Dashboard')}><TrendingUp className="h-4 w-4" /> Overview</Button></div>
          </div>

          {state.ui.page === 'Dashboard' && <div className="space-y-6">
            <Panel title="Launch-ready product layer" subtitle="This workspace is framed like a public product, not just a private tracker." right={<span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white">Deployable shell</span>}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Persistence', 'Local browser save', 'Users keep their data between visits.'],
                  ['Portability', 'Import and export', 'Progress can move through JSON backups.'],
                  ['Public face', 'Landing page included', 'The product can present itself before app use.'],
                  ['Execution', 'Daily engine first', 'Every major page reads the same study source.'],
                ].map(([title, value, text]) => <div key={title} className="rounded-[24px] bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">{title}</p><p className="mt-2 text-lg font-semibold text-slate-950">{value}</p><p className="mt-1 text-sm text-slate-600">{text}</p></div>)}
              </div>
            </Panel>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <KPI title="Days to exam" value={daysLeft} sub={`Countdown to ${fmtDate(settings.examDate)}`} icon={Clock3} />
              <KPI title="Planned hours" value={plannedToDate.toFixed(1)} sub="Expected by today" icon={Target} />
              <KPI title="Actual hours" value={actualToDate.toFixed(1)} sub="Logged from daily sessions" icon={CheckCircle2} tone="strong" />
              <KPI title="Completion rate" value={`${completionRate.toFixed(0)}%`} sub="Actual vs planned" icon={TrendingUp} tone={completionRate >= 85 ? 'strong' : completionRate >= 60 ? 'warm' : 'alert'} />
              <KPI title="Readiness" value={readinessScore} sub={readinessLabel} icon={Brain} tone="strong" />
              <KPI title="Current streak" value={streak} sub={`Longest streak ${longestStreak} days`} icon={Flame} tone="warm" />
            </div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Panel title="Today’s focus" subtitle="What matters right now" right={<span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800">{fmtDate(todayISO)}</span>}>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[24px] bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Today’s target</p><p className="mt-2 text-2xl font-semibold">{planHours(todayISO, settings)} hrs</p><p className="mt-1 text-sm text-slate-600">From your schedule rules</p></div>
                  <div className="rounded-[24px] bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Logged today</p><p className="mt-2 text-2xl font-semibold">{sum(todayEntries.map((e) => Number(e.actualHours || 0))).toFixed(1)} hrs</p><p className="mt-1 text-sm text-slate-600">{todayEntries.length ? 'The day is in motion.' : 'No session saved yet.'}</p></div>
                  <div className="rounded-[24px] bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Recommended next subject</p><p className="mt-2 text-lg font-semibold">{recommendation?.subject}</p><p className="mt-1 text-sm text-slate-600">Biggest combined pressure point</p></div>
                  <div className="rounded-[24px] bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Priority risk</p><p className="mt-2 text-lg font-semibold">{weakest?.subject}</p><p className="mt-1 text-sm text-slate-600">{weakest?.risk || '-'}</p></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3"><Button tone="accent" onClick={() => setPage('Daily Log')}><Plus className="h-4 w-4" /> Log study</Button><Button tone="secondary" onClick={() => setPage('Subjects')}><BookOpen className="h-4 w-4" /> Review subjects</Button></div>
              </Panel>
              <Panel title="Performance signals" subtitle="The three things worth seeing immediately">
                <div className="space-y-4">
                  {[
                    { title: 'Strongest subject', text: strongest ? `${strongest.subject} leads with ${strongest.accuracy.toFixed(0)}% accuracy and ${strongest.completion.toFixed(0)}% target completion.` : 'Not enough data yet.', tone: 'bg-teal-50 border-teal-200', icon: Trophy },
                    { title: 'Weakest subject', text: weakest ? `${weakest.subject} is the current pressure point. It is tagged ${weakest.risk.toLowerCase()} and needs intervention.` : 'Not enough data yet.', tone: 'bg-rose-50 border-rose-200', icon: ShieldAlert },
                    { title: 'Next best move', text: recommendation ? `Study ${recommendation.subject} next, then follow with a revision or question block.` : 'Not enough data yet.', tone: 'bg-amber-50 border-amber-200', icon: Zap },
                  ].map((card) => { const Icon = card.icon; return <div key={card.title} className={cn('rounded-[24px] border p-4', card.tone)}><div className="flex items-start gap-3"><div className="rounded-2xl bg-white p-2 shadow-sm"><Icon className="h-5 w-5 text-slate-700" /></div><div><p className="font-semibold text-slate-950">{card.title}</p><p className="mt-1 text-sm text-slate-700">{card.text}</p></div></div></div>})}
                </div>
              </Panel>
            </div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <Panel title="Planned vs completed" subtitle="Progress against expected hours"><div className="h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={doughnutHours} dataKey="value" innerRadius={72} outerRadius={100} paddingAngle={2}>{doughnutHours.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></Panel>
              <Panel title="Time by subject" subtitle="Where your hours have gone"><div className="h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={doughnutSubjects} dataKey="value" innerRadius={68} outerRadius={100} paddingAngle={2}>{doughnutSubjects.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></Panel>
              <Panel title="14-day trend" subtitle="Recent momentum and drift"><div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="date" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Line type="monotone" dataKey="planned" stroke="#cbd5e1" strokeWidth={3} dot={false} /><Line type="monotone" dataKey="actual" stroke="#0f766e" strokeWidth={3} /></LineChart></ResponsiveContainer></div></Panel>
            </div>
          </div>}

          {state.ui.page === 'Daily Log' && <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Panel title="Daily check-in" subtitle="The one screen that drives the whole system">
              <form onSubmit={saveEntry} className="grid gap-4 md:grid-cols-2">
                <Field label="Date"><TextInput type="date" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value, plannedHours: planHours(e.target.value, settings) }))} /></Field>
                <Field label="Day"><TextInput value={weekdayName(form.date)} readOnly /></Field>
                <Field label="Planned hours"><TextInput type="number" step="0.5" value={form.plannedHours} onChange={(e) => setForm((prev) => ({ ...prev, plannedHours: e.target.value }))} /></Field>
                <Field label="Actual hours"><TextInput type="number" step="0.5" value={form.actualHours} onChange={(e) => setForm((prev) => ({ ...prev, actualHours: e.target.value }))} placeholder="Hours completed" /></Field>
                <Field label="Subject"><SelectInput value={form.subject} onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))} options={SUBJECTS} /></Field>
                <Field label="Topic"><TextInput value={form.topic} onChange={(e) => setForm((prev) => ({ ...prev, topic: e.target.value }))} placeholder="Optional topic or sub-topic" /></Field>
                <Field label="Study type"><SelectInput value={form.studyType} onChange={(e) => setForm((prev) => ({ ...prev, studyType: e.target.value }))} options={['Reading', 'Practice Questions', 'Revision', 'Mock Exam', 'Video Lesson', 'Formula Review']} /></Field>
                <Field label="Focus level (1-5)"><TextInput type="number" min="1" max="5" value={form.focusLevel} onChange={(e) => setForm((prev) => ({ ...prev, focusLevel: e.target.value }))} /></Field>
                <Field label="Questions attempted"><TextInput type="number" value={form.questionsAttempted} onChange={(e) => setForm((prev) => ({ ...prev, questionsAttempted: e.target.value }))} /></Field>
                <Field label="Questions correct"><TextInput type="number" value={form.questionsCorrect} onChange={(e) => setForm((prev) => ({ ...prev, questionsCorrect: e.target.value }))} /></Field>
                <Field label="Mock score"><TextInput type="number" value={form.mockScore} onChange={(e) => setForm((prev) => ({ ...prev, mockScore: e.target.value }))} placeholder="Optional" /></Field>
                <div className="md:col-span-2"><Field label="Notes"><textarea className="min-h-[130px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-700" value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="What felt strong, weak, confusing, or worth revisiting?" /></Field></div>
                <div className="md:col-span-2 flex flex-wrap gap-3"><Button tone="accent" type="submit"><CheckCircle2 className="h-4 w-4" /> Save session</Button></div>
              </form>
            </Panel>
            <div className="space-y-6">
              <Panel title="Today’s readout" subtitle="What today is saying already"><div className="grid gap-4 md:grid-cols-3"><div className="rounded-[24px] bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Target met</p><p className="mt-2 text-2xl font-semibold">{planHours(todayISO, settings) ? `${((sum(todayEntries.map((e) => Number(e.actualHours || 0))) / planHours(todayISO, settings)) * 100 || 0).toFixed(0)}%` : '0%'}</p></div><div className="rounded-[24px] bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Question accuracy</p><p className="mt-2 text-2xl font-semibold">{(() => { const attempted = sum(todayEntries.map((e) => Number(e.questionsAttempted || 0))); const correct = sum(todayEntries.map((e) => Number(e.questionsCorrect || 0))); return attempted ? `${((correct / attempted) * 100).toFixed(0)}%` : '0%' })()}</p></div><div className="rounded-[24px] bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p><p className="mt-2 text-sm font-medium text-slate-800">{sum(todayEntries.map((e) => Number(e.actualHours || 0))) >= planHours(todayISO, settings) ? 'You hit today’s target.' : todayEntries.length ? `You are ${(planHours(todayISO, settings) - sum(todayEntries.map((e) => Number(e.actualHours || 0)))).toFixed(1)} hours behind.` : 'No study logged for today yet.'}</p></div></div></Panel>
              <Panel title="Recent sessions" subtitle="Your latest study history"><div className="max-h-[460px] space-y-2 overflow-auto">{[...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map((entry) => { const accuracy = Number(entry.questionsAttempted || 0) ? (Number(entry.questionsCorrect || 0) / Number(entry.questionsAttempted || 1)) * 100 : 0; return <div key={entry.id} className="grid grid-cols-[1.05fr_1fr_0.7fr_0.8fr_0.8fr_0.7fr] gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"><div>{fmtDate(entry.date)}</div><div>{entry.subject}</div><div>{entry.actualHours}</div><div>{entry.questionsAttempted || 0}</div><div>{accuracy.toFixed(0)}%</div><div className="text-right"><button onClick={() => deleteEntry(entry.id)} className="text-rose-600 hover:text-rose-700">Delete</button></div></div>})}</div></Panel>
            </div>
          </div>}

          {state.ui.page === 'Subjects' && <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <Panel title="Subject intelligence" subtitle="Coverage, risk, and neglect at a glance"><div className="space-y-2">{subjectStats.map((row) => <div key={row.subject} className="grid grid-cols-[1.5fr_0.7fr_0.7fr_0.8fr_0.8fr_1fr_0.9fr_0.7fr] gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"><div className="font-medium text-slate-950">{row.subject}</div><div>{row.targetHours}</div><div>{row.actualHours.toFixed(1)}</div><div>{row.completion.toFixed(0)}%</div><div>{row.accuracy.toFixed(0)}%</div><div>{row.lastStudied ? fmtDate(row.lastStudied) : '-'}</div><div>{row.risk}</div><div className="text-right"><button onClick={() => setState((prev) => ({ ...prev, ui: { ...prev.ui, selectedSubject: row.subject } }))} className="text-teal-700 hover:text-teal-800">Open</button></div></div>)}</div></Panel>
            <Panel title="Subject deep dive" subtitle="One subject, fully surfaced">{(() => { const detail = subjectStats.find((s) => s.subject === state.ui.selectedSubject) || subjectStats[0]; return <div className="space-y-4"><div className="flex items-center justify-between"><div><h3 className="text-xl font-semibold text-slate-950">{detail.subject}</h3><p className="text-sm text-slate-600">Confidence: {detail.confidence}</p></div><span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800">{detail.risk}</span></div><div className="grid grid-cols-2 gap-3">{[['Target hours', detail.targetHours], ['Actual hours', detail.actualHours.toFixed(1)], ['Completion', `${detail.completion.toFixed(0)}%`], ['Accuracy', `${detail.accuracy.toFixed(0)}%`]].map(([label, value]) => <div key={label} className="rounded-[24px] bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p></div>)}</div><Progress value={detail.completion} /></div>})()}</Panel>
          </div>}

          {state.ui.page === 'Analytics' && <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5"><KPI title="Questions attempted" value={sum(entries.map((e) => Number(e.questionsAttempted || 0)))} sub="Across all sessions" icon={BarChart3} /><KPI title="Questions correct" value={sum(entries.map((e) => Number(e.questionsCorrect || 0)))} sub="Tracked from the daily log" icon={CheckCircle2} tone="strong" /><KPI title="Average accuracy" value={`${overallAccuracy.toFixed(0)}%`} sub="Overall output quality" icon={TrendingUp} tone={overallAccuracy >= 70 ? 'strong' : overallAccuracy >= 55 ? 'warm' : 'alert'} /><KPI title="Most practiced" value={[...subjectStats].sort((a, b) => b.attempted - a.attempted)[0]?.subject || '-'} sub="By question volume" icon={Target} /><KPI title="Mock average" value={`${mockAverage.toFixed(0)}%`} sub={`Goal ${settings.goalMockScore}%`} icon={Trophy} tone={mockAverage >= settings.goalMockScore ? 'strong' : 'warm'} /></div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2"><Panel title="Accuracy by subject" subtitle="Where performance is truly landing"><div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={analyticsBySubject}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="subject" fontSize={12} /><YAxis domain={[0, 100]} fontSize={12} /><Tooltip /><Bar dataKey="accuracy" fill="#0f766e" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></Panel><Panel title="Mock score trend" subtitle="Timed performance over time"><div className="h-80"><ResponsiveContainer width="100%" height="100%"><LineChart data={mockTrend}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="date" fontSize={12} /><YAxis domain={[0, 100]} fontSize={12} /><Tooltip /><Line type="monotone" dataKey="score" stroke="#c9a227" strokeWidth={3} /></LineChart></ResponsiveContainer></div></Panel></div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]"><Panel title="Readiness radar" subtitle="A compact multi-factor diagnostic"><div className="h-80"><ResponsiveContainer width="100%" height="100%"><RadarChart data={radarData}><PolarGrid /><PolarAngleAxis dataKey="metric" /><PolarRadiusAxis domain={[0, 100]} /><Radar dataKey="value" stroke="#0f766e" fill="#0f766e" fillOpacity={0.24} /></RadarChart></ResponsiveContainer></div></Panel><Panel title="Interpretation" subtitle="What the numbers are saying now"><div className="space-y-3"><div className="rounded-[24px] bg-teal-50 p-4"><p className="font-semibold text-slate-950">Momentum</p><p className="mt-1 text-sm text-slate-700">Your 14-day average actual study time is {avg(trendData.map((d) => d.actual)).toFixed(1)} hours per day.</p></div><div className="rounded-[24px] bg-amber-50 p-4"><p className="font-semibold text-slate-950">Pressure point</p><p className="mt-1 text-sm text-slate-700">{weakest?.subject || 'A weak subject'} still needs targeted attention in both time allocation and output quality.</p></div><div className="rounded-[24px] bg-slate-50 p-4"><p className="font-semibold text-slate-950">Recommendation</p><p className="mt-1 text-sm text-slate-700">Study {recommendation?.subject || 'your weakest area'} next, then schedule a fresh mock once two weak subjects have had one deep session each.</p></div></div></Panel></div>
          </div>}

          {state.ui.page === 'Heat Map' && <div className="space-y-6">
            <Panel title="Consistency heat map" subtitle="Every square tells the truth about that day" right={<div className="w-[230px]"><Field label="Month"><SelectInput value={state.ui.selectedMonth} onChange={(e) => setState((prev) => ({ ...prev, ui: { ...prev.ui, selectedMonth: e.target.value } }))} options={monthStats.map((item) => ({ value: item.key, label: parseISO(`${item.key}-01`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) }))} /></Field></div>}>
              <div className="grid grid-cols-7 gap-3">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((label) => <div key={label} className="px-1 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>)}{(() => { if (!selectedMonthDates.length) return null; const first = parseISO(selectedMonthDates[0]); const firstDay = first.getDay(); const padding = firstDay === 0 ? 6 : firstDay - 1; const nodes = []; for (let i = 0; i < padding; i += 1) nodes.push(<div key={`pad-${i}`} className="aspect-square rounded-2xl" />); monthCells.forEach((cell) => { const ratio = cell.completion; const tone = ratio >= 100 ? 'bg-teal-700 text-white' : ratio >= 80 ? 'bg-teal-500 text-white' : ratio >= 50 ? 'bg-teal-200 text-slate-900' : ratio > 0 ? 'bg-slate-200 text-slate-900' : 'bg-slate-100 text-slate-500'; nodes.push(<div key={cell.date} title={`${fmtDate(cell.date)} · ${cell.actual}/${cell.planned} hrs`} className={cn('aspect-square rounded-2xl p-2 shadow-sm', tone)}><div className="flex h-full flex-col justify-between"><span className="text-sm font-semibold">{parseISO(cell.date).getDate()}</span><span className="text-[10px] leading-tight">{cell.actual.toFixed(0)}h</span></div></div>)}); return nodes })()}</div>
            </Panel>
          </div>}

          {state.ui.page === 'Weekly Review' && <div className="space-y-6"><div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6"><KPI title="Planned hours" value={weeklyPlanned.toFixed(1)} sub="This week" icon={Target} /><KPI title="Actual hours" value={weeklyActual.toFixed(1)} sub="This week" icon={CheckCircle2} tone="strong" /><KPI title="Weekly completion" value={`${weeklyPlanned ? ((weeklyActual / weeklyPlanned) * 100).toFixed(0) : 0}%`} sub="Actual vs planned" icon={TrendingUp} tone={weeklyActual >= weeklyPlanned ? 'strong' : 'warm'} /><KPI title="Days studied" value={weeklyData.filter((d) => d.actual > 0).length} sub="This week" icon={CalendarDays} /><KPI title="Questions" value={weeklyQuestions} sub="This week" icon={BarChart3} /><KPI title="Average accuracy" value={`${(() => { const weekEntries = entries.filter((e) => e.date >= week.start && e.date <= week.end); const attempted = sum(weekEntries.map((e) => Number(e.questionsAttempted || 0))); const correct = sum(weekEntries.map((e) => Number(e.questionsCorrect || 0))); return attempted ? ((correct / attempted) * 100).toFixed(0) : 0 })()}%`} sub="This week" icon={TrendingUp} /></div><Panel title="Weekly reflection" subtitle="Close the week with intention"><div className="grid gap-4 md:grid-cols-2"><Field label="What went well?"><textarea value={reflection.wins} onChange={(e) => updateReflection('wins', e.target.value)} className="min-h-[85px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-700" /></Field><Field label="What held you back?"><textarea value={reflection.blockers} onChange={(e) => updateReflection('blockers', e.target.value)} className="min-h-[85px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-700" /></Field><Field label="Subject needing more attention"><TextInput value={reflection.attention} onChange={(e) => updateReflection('attention', e.target.value)} /></Field><Field label="One focus for next week"><TextInput value={reflection.focus} onChange={(e) => updateReflection('focus', e.target.value)} /></Field></div></Panel></div>}

          {state.ui.page === 'Settings' && <div className="grid grid-cols-1 gap-6 xl:grid-cols-2"><Panel title="Study setup" subtitle="Control the engine that drives the app"><div className="grid gap-4 md:grid-cols-2"><Field label="Brand name"><TextInput value={settings.brandName} onChange={(e) => updateSettings('brandName', e.target.value)} /></Field><Field label="Theme"><SelectInput value={settings.theme} onChange={(e) => updateSettings('theme', e.target.value)} options={['Executive Teal', 'Midnight Slate', 'Gold Accent']} /></Field><Field label="Study start date"><TextInput type="date" value={settings.startDate} onChange={(e) => updateSettings('startDate', e.target.value)} /></Field><Field label="Exam date"><TextInput type="date" value={settings.examDate} onChange={(e) => updateSettings('examDate', e.target.value)} /></Field><Field label="Weekday hours"><TextInput type="number" step="0.5" value={settings.weekdayHours} onChange={(e) => updateSettings('weekdayHours', Number(e.target.value || 0))} /></Field><Field label="Weekend hours"><TextInput type="number" step="0.5" value={settings.weekendHours} onChange={(e) => updateSettings('weekendHours', Number(e.target.value || 0))} /></Field><Field label="Goal mock score"><TextInput type="number" value={settings.goalMockScore} onChange={(e) => updateSettings('goalMockScore', Number(e.target.value || 0))} /></Field><Field label="Daily reminder"><TextInput type="time" value={settings.dailyReminder} onChange={(e) => updateSettings('dailyReminder', e.target.value)} /></Field></div><div className="mt-4 flex flex-wrap gap-3"><Button tone="accent" onClick={() => setToast('Settings updated.')}>Save settings</Button><Button tone="secondary" onClick={exportBackup}><Download className="h-4 w-4" /> Export backup</Button></div></Panel><Panel title="Subject targets" subtitle="Shape your prep load intentionally"><div className="space-y-3">{SUBJECTS.map((subject) => <div key={subject} className="grid grid-cols-[1.45fr_0.8fr] items-center gap-3 rounded-[24px] border border-slate-200 p-3"><div><p className="font-medium text-slate-950">{subject}</p><p className="text-sm text-slate-500">Edit target hours directly</p></div><TextInput type="number" value={settings.subjectTargets[subject] || 0} onChange={(e) => updateSubjectTarget(subject, e.target.value)} /></div>)}</div><div className="mt-4 flex flex-wrap gap-3"><Button tone="accent" onClick={autoDistributeTargets}>Auto-distribute hours</Button><Button tone="secondary" onClick={() => setToast(`Theme selected: ${settings.theme}`)}>Preview theme</Button></div></Panel></div>}
        </main>
      </div>
      {toast ? <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-950 px-4 py-3 text-sm text-white shadow-2xl">{toast}</div> : null}
    </div>
  )
}
