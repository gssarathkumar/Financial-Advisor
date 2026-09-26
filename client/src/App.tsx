import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity, ArrowRight, ArrowUpRight,
  Bell, BookOpen, BriefcaseBusiness, Check, ChevronDown, CircleHelp,
  Command, Compass, Download, Eye, EyeOff, FileUp, Fingerprint, Goal,
  LayoutDashboard, LogOut, Menu, MoreHorizontal, Plus, Search, Settings,
  ShieldCheck, SlidersHorizontal, Sparkles, TrendingUp, Wallet, X,
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import { apiRequest, restoreSession, setAccessToken } from './lib/api'

type Page = 'Overview' | 'Markets' | 'My portfolio' | 'SIP planner' | 'Mutual funds' | 'Your plan' | 'Settings'
type User = { id?: string; name: string; email: string; needsOnboarding?: boolean; riskLevel?: string }

const navGroups = [
  { title: 'Workspace', items: [{ label: 'Overview', icon: LayoutDashboard }, { label: 'Markets', icon: Activity }, { label: 'My portfolio', icon: BriefcaseBusiness }] },
  { title: 'Plan ahead', items: [{ label: 'SIP planner', icon: Goal }, { label: 'Mutual funds', icon: Compass }, { label: 'Your plan', icon: Sparkles }] },
]

const performance = [
  { month: 'Oct', value: 2510000 }, { month: 'Nov', value: 2590000 }, { month: 'Dec', value: 2570000 },
  { month: 'Jan', value: 2740000 }, { month: 'Feb', value: 2690000 }, { month: 'Mar', value: 2810000 },
  { month: 'Apr', value: 2980000 }, { month: 'May', value: 2920000 }, { month: 'Jun', value: 3140000 },
  { month: 'Jul', value: 3070000 }, { month: 'Aug', value: 3310000 }, { month: 'Sep', value: 3460000 },
]
const allocation = [
  { name: 'Equity', value: 54, color: '#c4f269' }, { name: 'Mutual funds', value: 27, color: '#80a6ed' },
  { name: 'Debt', value: 13, color: '#eca86b' }, { name: 'Cash', value: 6, color: '#6b7771' },
]
const holdings = [
  { name: 'NIFTY 50', ticker: 'INDEX', value: '24,812.60', change: '+0.82%', up: true, tone: 'mint' },
  { name: 'HDFC Bank', ticker: 'HDFCBANK', value: '1,685.40', change: '+1.24%', up: true, tone: 'blue' },
  { name: 'Tata Consultancy', ticker: 'TCS', value: '3,924.10', change: '-0.38%', up: false, tone: 'orange' },
  { name: 'Reliance Industries', ticker: 'RELIANCE', value: '1,412.85', change: '+0.56%', up: true, tone: 'purple' },
]

function currency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}

function App() {
  const [page, setPage] = useState<Page>('Overview')
  const [user, setUser] = useState<User | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [search, setSearch] = useState('')
  const [dark, setDark] = useState(true)
  const [authChecking, setAuthChecking] = useState(true)
  const [onboardingRequired, setOnboardingRequired] = useState(false)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('token')) {
      setAuthChecking(false)
      return
    }
    void restoreSession().then(session => {
      if (session) {
        setUser(session.user)
        setOnboardingRequired(Boolean(session.user.needsOnboarding))
      }
    }).finally(() => setAuthChecking(false))
  }, [])

  const enterDemo = () => {
    setAccessToken(null)
    setOnboardingRequired(false)
    setUser({ name: 'Aarav Mehta', email: 'aarav@example.com' })
    setAuthOpen(false)
  }

  const signOut = () => {
    void apiRequest('/api/auth/logout', { method: 'POST' })
    setAccessToken(null)
    setUser(null)
  }

  if (authChecking) return <div className="auth-loading" role="status">Preparing your workspace…</div>
  if (!user) return <AuthScreen onDemo={enterDemo} onLogin={(nextUser, token) => { setAccessToken(token ?? null); setUser(nextUser); setOnboardingRequired(Boolean(nextUser.needsOnboarding)) }} />
  if (onboardingRequired) return <Onboarding onComplete={riskLevel => { setOnboardingRequired(false); setUser({ ...user, needsOnboarding: false, riskLevel }) }} />

  return (
    <div className={`app-shell ${dark ? 'theme-dark' : 'theme-light'}`}>
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#overview" onClick={() => setPage('Overview')}>
          <span className="brand-mark"><Command size={19} strokeWidth={2.5} /></span>
          <span>wealth<span className="brand-light">lens</span></span>
        </a>
        <button className="workspace-switch" aria-label="Switch workspace">
          <span className="workspace-avatar">A</span>
          <span className="workspace-meta"><strong>Personal account</strong><small>Free plan</small></span>
          <ChevronDown size={15} />
        </button>
        {navGroups.map(group => (
          <div className="nav-group" key={group.title}>
            <span className="nav-label">{group.title}</span>
            {group.items.map(item => {
              const Icon = item.icon
              return <button key={item.label} className={`nav-item ${page === item.label ? 'active' : ''}`} onClick={() => { setPage(item.label as Page); setMobileNav(false) }}><Icon size={17} /><span>{item.label}</span>{item.label === 'Your plan' && <span className="nav-dot" />}</button>
            })}
          </div>
        ))}
        <div className="sidebar-bottom">
          <div className="market-status"><span className="status-dot" /><span><strong>Markets open</strong><small>Closes in 2h 14m</small></span></div>
          <button className="nav-item" onClick={() => setPage('Settings')}><Settings size={17} /><span>Settings</span></button>
          <div className="profile-row"><span className="profile-avatar">AM</span><span className="profile-meta"><strong>{user.name}</strong><small>{user.email}</small></span><button className="icon-button" aria-label="Sign out" onClick={signOut}><LogOut size={15} /></button></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Open menu" onClick={() => setMobileNav(!mobileNav)}><Menu size={19} /></button>
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{page}</strong></div>
          <div className="topbar-actions">
            <label className="search-box"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search anything..." /><kbd>⌘ K</kbd></label>
            <button className="icon-button notification-button" aria-label="Notifications"><Bell size={17} /><i /></button>
            <button className="help-button" aria-label="Help"><CircleHelp size={17} /></button>
          </div>
        </header>
        <div className="page-wrap">
          <AnimatePresence mode="wait">
            {page === 'Overview' && <Overview key={page} onNavigate={setPage} />}
            {page === 'Markets' && <Markets key={page} query={search} />}
            {page === 'My portfolio' && <Portfolio key={page} />}
            {page === 'SIP planner' && <SipPlanner key={page} />}
            {page === 'Mutual funds' && <Funds key={page} />}
            {page === 'Your plan' && <Advice key={page} riskLevel={user.riskLevel} />}
            {page === 'Settings' && <SettingsPage key={page} dark={dark} setDark={setDark} onAuth={() => setAuthOpen(true)} />}
          </AnimatePresence>
        </div>
        <footer className="disclaimer"><ShieldCheck size={13} /><span>For educational purposes only. Not investment advice.</span><a href="#disclaimer">Learn more</a></footer>
      </main>
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onLogin={(nextUser, token) => { setAccessToken(token ?? null); setUser(nextUser); setOnboardingRequired(Boolean(nextUser.needsOnboarding)) }} />}
    </div>
  )
}

function PageHeading({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: React.ReactNode }) {
  return <motion.div className="page-heading" initial={{ opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }}><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{action}</motion.div>
}

function Overview({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [range, setRange] = useState('1Y')
  const [showValue, setShowValue] = useState(true)
  return <motion.div className="view-stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <PageHeading eyebrow="Saturday, September 26" title="Good morning, Aarav" subtitle="Here's how your money is doing today." action={<button className="button button-secondary" onClick={() => onNavigate('My portfolio')}><Plus size={16} /> Add investment</button>} />
    <div className="metric-grid">
      <article className="metric-card hero-metric"><div className="metric-top"><span>Total portfolio value</span><button className="icon-button subtle" aria-label={showValue ? 'Hide balance' : 'Show balance'} onClick={() => setShowValue(!showValue)}>{showValue ? <Eye size={16} /> : <EyeOff size={16} />}</button></div><div className="metric-value">{showValue ? '₹34,62,480' : '••••••••'}</div><div className="metric-foot"><span className="gain-pill"><ArrowUpRight size={14} /> ₹4,18,920 (13.76%)</span><span className="muted">all time</span></div><div className="metric-spark"><svg viewBox="0 0 140 38" preserveAspectRatio="none" aria-hidden="true"><path d="M0 32 C18 29 17 22 32 25S49 17 62 21 82 7 96 14 119 2 140 4" /></svg></div></article>
      <Metric label="Total invested" value="₹30,43,560" change="Across 8 assets" icon={<Wallet size={16} />} />
      <Metric label="Today's return" value="+₹12,840" change="+0.37% today" icon={<TrendingUp size={16} />} positive />
      <Metric label="Active SIPs" value="4 plans" change="Next debit · Oct 5" icon={<Goal size={16} />} />
    </div>

    <div className="overview-grid">
      <section className="panel performance-panel">
        <div className="panel-header"><div><h2>Portfolio performance</h2><p>Growth over time, across all investments</p></div><button className="icon-button" aria-label="More performance options"><MoreHorizontal size={19} /></button></div>
        <div className="chart-legend"><span className="legend-mark" /> Your portfolio <span className="benchmark-mark" /> Nifty 50</div>
        <div className="performance-total">₹34,62,480 <span>+13.76%</span></div>
        <div className="line-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={performance} margin={{ top: 12, right: 4, left: -14, bottom: 0 }}><defs><linearGradient id="portfolio-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c4f269" stopOpacity={0.17} /><stop offset="94%" stopColor="#c4f269" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#27312c" vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#76827b', fontSize: 11 }} dy={9} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#76827b', fontSize: 10 }} tickFormatter={v => `${(v / 100000).toFixed(0)}L`} /><Tooltip content={<ChartTooltip />} cursor={{ stroke: '#647069', strokeDasharray: '4 4' }} /><Area type="monotone" dataKey="value" stroke="#c4f269" strokeWidth={2} fill="url(#portfolio-fill)" activeDot={{ r: 4, fill: '#c4f269', stroke: '#111815', strokeWidth: 2 }} /></AreaChart></ResponsiveContainer></div>
        <div className="range-tabs">{['1M', '3M', '6M', '1Y', 'ALL'].map(item => <button key={item} className={range === item ? 'selected' : ''} onClick={() => setRange(item)}>{item}</button>)}</div>
      </section>
      <section className="panel allocation-panel"><div className="panel-header"><div><h2>Asset allocation</h2><p>Spread across your portfolio</p></div><button className="text-action" onClick={() => onNavigate('My portfolio')}>Details <ArrowRight size={14} /></button></div><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={allocation} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="88%" paddingAngle={3} stroke="none"><Cell fill="#c4f269" /><Cell fill="#80a6ed" /><Cell fill="#eca86b" /><Cell fill="#6b7771" /></Pie><Tooltip content={<AllocationTooltip />} /></PieChart></ResponsiveContainer><div className="donut-center"><strong>4</strong><span>asset classes</span></div></div><div className="allocation-list">{allocation.map(item => <div className="allocation-row" key={item.name}><span className="allocation-label"><i style={{ background: item.color }} />{item.name}</span><strong>{item.value}%</strong></div>)}</div></section>
    </div>

    <div className="overview-grid lower-grid"><section className="panel watchlist-panel"><div className="panel-header"><div><h2>Market watch</h2><p>Prices · NSE · Delayed by 15 minutes</p></div><button className="text-action" onClick={() => onNavigate('Markets')}>Explore markets <ArrowRight size={14} /></button></div><div className="watch-table">{holdings.map((item, index) => <div className="watch-row" key={item.ticker}><span className={`company-icon ${item.tone}`}>{item.ticker.slice(0, 1)}</span><span className="company-name"><strong>{item.name}</strong><small>{item.ticker}</small></span><SparkLine index={index} /><strong className="price">₹{item.value}</strong><span className={`change ${item.up ? 'up' : 'down'}`}>{item.change}</span></div>)}</div></section>
      <section className="insight-card"><div className="insight-head"><span className="insight-icon"><Sparkles size={16} /></span><span>PERSONAL INSIGHT</span><button className="icon-button" aria-label="More insights"><MoreHorizontal size={18} /></button></div><h2>A little more balance could go a long way.</h2><p>Equity is 8% above your target allocation. A small shift toward debt funds may help keep your long-term plan on track.</p><button className="insight-link" onClick={() => onNavigate('Your plan')}>Review your plan <ArrowRight size={14} /></button><div className="insight-orbit" aria-hidden="true" /></section></div>
  </motion.div>
}

function Metric({ label, value, change, icon, positive = false }: { label: string; value: string; change: string; icon: React.ReactNode; positive?: boolean }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><span className="metric-icon">{icon}</span></div><div className="metric-value">{value}</div><div className={`metric-foot ${positive ? 'positive-text' : ''}`}>{positive && <ArrowUpRight size={14} />}{change}</div></article>
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tooltip"><span>{label}</span><strong>{currency(payload[0].value)}</strong></div>
}

function AllocationTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tooltip"><span>{payload[0].name}</span><strong>{payload[0].value}%</strong></div>
}

function SparkLine({ index }: { index: number }) {
  const paths = ['M0 18 C8 20 9 10 17 12S25 6 32 10 40 2 48 3', 'M0 18 C8 15 9 17 17 12S25 15 32 8 40 13 48 3', 'M0 5 C8 4 9 10 17 8S25 14 32 10 40 17 48 18', 'M0 18 C8 11 9 15 17 9S25 16 32 8 40 10 48 2']
  return <svg className={`sparkline ${index === 2 ? 'sparkline-down' : ''}`} viewBox="0 0 48 22" preserveAspectRatio="none" aria-hidden="true"><path d={paths[index % paths.length]} /></svg>
}

function Markets({ query }: { query: string }) {
  const stocks = [...holdings, { name: 'Infosys', ticker: 'INFY', value: '1,519.30', change: '+0.92%', up: true, tone: 'blue' }, { name: 'Zomato', ticker: 'ETERNAL', value: '311.20', change: '-1.07%', up: false, tone: 'orange' }]
  const visible = stocks.filter(stock => `${stock.name} ${stock.ticker}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="view-stack"><PageHeading eyebrow="Markets · NSE" title="Find your next move." subtitle="Explore Indian equities with a clearer perspective." action={<button className="button button-secondary"><SlidersHorizontal size={16} /> Filters</button>} /><section className="market-banner"><div><span className="eyebrow">NIFTY 50 · INDEX</span><div className="market-big">24,812.60 <span>+202.15 (0.82%)</span></div><p>Market is open · Last updated just now</p></div><div className="market-chart"><SparkLine index={1} /></div></section><section className="panel market-table-panel"><div className="panel-header"><div><h2>Popular on NSE</h2><p>{visible.length} instruments · Prices are illustrative</p></div><button className="button button-primary"><Plus size={15} /> Add to watchlist</button></div><div className="data-table"><div className="table-head"><span>Instrument</span><span>Price</span><span>Change</span><span>Trend</span><span /></div>{visible.map((stock, i) => <div className="table-row" key={stock.ticker}><span className="table-company"><span className={`company-icon ${stock.tone}`}>{stock.ticker.slice(0, 1)}</span><span><strong>{stock.name}</strong><small>{stock.ticker}</small></span></span><strong>₹{stock.value}</strong><span className={`change ${stock.up ? 'up' : 'down'}`}>{stock.change}</span><SparkLine index={i} /><button className="icon-button" aria-label={`View ${stock.name}`}><ArrowRight size={15} /></button></div>)}{!visible.length && <div className="empty-state"><Search size={20} /><strong>No instruments found</strong><span>Try a different name or ticker.</span></div>}</div></section><p className="data-note"><ShieldCheck size={14} /> Mock market data for demonstration. Not for trading decisions.</p></div>
}

function Portfolio() {
  const [showImport, setShowImport] = useState(false)
  const [added, setAdded] = useState(false)
  return <div className="view-stack"><PageHeading eyebrow="Your money, together" title="My portfolio" subtitle="All your investments, in one view." action={<div className="button-group"><button className="button button-secondary" onClick={() => setShowImport(!showImport)}><FileUp size={15} /> Import CSV</button><button className="button button-primary" onClick={() => setAdded(true)}><Plus size={15} /> Add holding</button></div>} /><div className="metric-grid portfolio-metrics"><Metric label="Current value" value="₹34,62,480" change="+13.76% overall" icon={<Wallet size={16} />} positive /><Metric label="Invested amount" value="₹30,43,560" change="Across 8 assets" icon={<BriefcaseBusiness size={16} />} /><Metric label="Unrealized gains" value="₹4,18,920" change="Since first investment" icon={<TrendingUp size={16} />} positive /><Metric label="XIRR" value="14.2%" change="Annualized return" icon={<Activity size={16} />} positive /></div>{showImport && <div className="inline-form"><FileUp size={18} /><span>Choose a CSV with columns for symbol, quantity, and average price.</span><input type="file" accept=".csv" aria-label="Upload holdings CSV" /></div>}{added && <div className="inline-form"><Check size={17} /><span>Holding form ready. Connect an account or use CSV import to add positions.</span><button className="icon-button" aria-label="Dismiss" onClick={() => setAdded(false)}><X size={15} /></button></div>}<section className="panel market-table-panel"><div className="panel-header"><div><h2>Your holdings</h2><p>Updated today · 8 positions</p></div><button className="text-action"><Download size={14} /> Export</button></div><div className="data-table"><div className="table-head portfolio-table-head"><span>Asset</span><span>Invested</span><span>Current value</span><span>Returns</span></div>{[{ name: 'Parag Parikh Flexi Cap', kind: 'Mutual fund · Direct growth', amount: 500000, current: 624300, tone: 'mint' }, { name: 'HDFC Bank', kind: 'Equity · 42 shares', amount: 598400, current: 708468, tone: 'blue' }, { name: 'Nifty 50 Index Fund', kind: 'SIP · Monthly ₹15,000', amount: 436000, current: 501120, tone: 'purple' }, { name: 'Tata Consultancy Services', kind: 'Equity · 18 shares', amount: 630000, current: 706338, tone: 'orange' }].map(item => <div className="table-row portfolio-row" key={item.name}><span className="table-company"><span className={`company-icon ${item.tone}`}>{item.name.slice(0, 1)}</span><span><strong>{item.name}</strong><small>{item.kind}</small></span></span><span>{currency(item.amount)}</span><strong>{currency(item.current)}</strong><span className="change up">+{((item.current / item.amount - 1) * 100).toFixed(2)}%</span></div>)}</div></section><p className="data-note"><ShieldCheck size={14} /> Figures are illustrative. Actual portfolio performance may differ.</p></div>
}

function SipPlanner() {
  const [amount, setAmount] = useState(15000)
  const [rate, setRate] = useState(12)
  const [years, setYears] = useState(10)
  const [goal, setGoal] = useState(5000000)
  const months = years * 12
  const monthlyRate = rate / 1200
  const future = amount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)
  const required = Math.round(goal * monthlyRate / ((Math.pow(1 + monthlyRate, months) - 1) * (1 + monthlyRate)))
  const chartData = Array.from({ length: years + 1 }, (_, year) => ({ year: `Year ${year}`, invested: amount * year * 12, projected: amount * ((Math.pow(1 + monthlyRate, year * 12) - 1) / monthlyRate) * (1 + monthlyRate) }))
  return <div className="view-stack"><PageHeading eyebrow="Plan for the future" title="Small steps. Big plans." subtitle="See what a regular investment could grow into." /><div className="sip-layout"><section className="panel calculator-panel"><div className="panel-header"><div><h2>SIP calculator</h2><p>Adjust the numbers to explore possibilities</p></div><span className="metric-icon"><Goal size={16} /></span></div><RangeInput label="Monthly investment" value={amount} display={currency(amount)} min={500} max={100000} step={500} onChange={setAmount} prefix="₹" /><RangeInput label="Expected annual return" value={rate} display={`${rate}%`} min={1} max={30} step={0.5} onChange={setRate} suffix="%" /><RangeInput label="Investment duration" value={years} display={`${years} years`} min={1} max={40} step={1} onChange={setYears} suffix="yrs" /><div className="calculator-result"><span>Projected value</span><strong>{currency(Math.round(future))}</strong><small>On an assumed {rate}% annual return</small></div></section><section className="panel sip-chart-panel"><div className="panel-header"><div><h2>Your growth, over time</h2><p>Illustrative projection, not a guarantee</p></div></div><div className="sip-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="sip-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c4f269" stopOpacity={0.24} /><stop offset="100%" stopColor="#c4f269" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#27312c" vertical={false} /><XAxis dataKey="year" interval={Math.max(0, Math.floor(years / 5) - 1)} tickLine={false} axisLine={false} tick={{ fill: '#76827b', fontSize: 10 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#76827b', fontSize: 10 }} tickFormatter={v => `${(v / 100000).toFixed(0)}L`} /><Tooltip content={<ChartTooltip />} /><Area type="monotone" dataKey="invested" name="Invested" stackId="1" stroke="#80a6ed" fill="#80a6ed" fillOpacity={.55} /><Area type="monotone" dataKey="projected" name="Projected" stroke="#c4f269" fill="url(#sip-fill)" /></AreaChart></ResponsiveContainer></div><div className="chart-legend"><span className="benchmark-mark" /> Amount invested <span className="legend-mark" /> Estimated value</div></section></div><section className="goal-planner"><div className="goal-mark"><Goal size={19} /></div><div className="goal-copy"><span className="eyebrow">GOAL-BASED PLANNING</span><h2>Working toward a bigger goal?</h2><p>Find a monthly SIP amount for a future target.</p></div><div className="goal-fields"><label>Goal amount<div className="goal-input"><span>₹</span><input type="number" min="1000" step="10000" value={goal} onChange={e => setGoal(Number(e.target.value))} /></div></label><label>Time horizon<div className="goal-horizon">{years} years</div></label><div className="goal-answer"><span>Monthly SIP needed</span><strong>{currency(required)}</strong></div></div></section></div>
}

function RangeInput({ label, value, display, min, max, step, onChange }: { label: string; value: number; display: string; min: number; max: number; step: number; onChange: (value: number) => void; prefix?: string; suffix?: string }) {
  return <label className="range-field"><span>{label}<strong>{display}</strong></span><input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} /></label>
}

function Funds() {
  const [category, setCategory] = useState('All funds')
  const categories = ['All funds', 'Equity', 'Debt', 'Hybrid', 'Index']
  const funds = [{ name: 'Parag Parikh Flexi Cap Fund', type: 'Flexi cap · Equity', nav: '₹82.46', returns: '+18.42%', risk: 'Very high', tone: 'mint' }, { name: 'UTI Nifty 50 Index Fund', type: 'Index · Equity', nav: '₹168.21', returns: '+15.20%', risk: 'Very high', tone: 'blue' }, { name: 'HDFC Balanced Advantage', type: 'Dynamic asset allocation · Hybrid', nav: '₹512.70', returns: '+13.84%', risk: 'High', tone: 'orange' }, { name: 'SBI Short Duration Fund', type: 'Short duration · Debt', nav: '₹29.18', returns: '+7.26%', risk: 'Moderate', tone: 'purple' }]
  return <div className="view-stack"><PageHeading eyebrow="Explore mutual funds" title="Invest in what matters." subtitle="Compare funds with the details that count." /><div className="segmented">{categories.map(item => <button className={category === item ? 'selected' : ''} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div><section className="panel market-table-panel"><div className="panel-header"><div><h2>{category === 'All funds' ? 'Funds to know' : `${category} funds`}</h2><p>Illustrative data · Returns are not guaranteed</p></div><button className="button button-secondary"><SlidersHorizontal size={15} /> Sort & filter</button></div><div className="data-table"><div className="table-head fund-table-head"><span>Fund</span><span>NAV</span><span>5Y CAGR</span><span>Riskometer</span><span /></div>{funds.filter(fund => category === 'All funds' || fund.type.toLowerCase().includes(category.toLowerCase())).map(fund => <div className="table-row" key={fund.name}><span className="table-company"><span className={`company-icon ${fund.tone}`}>{fund.name.slice(0, 1)}</span><span><strong>{fund.name}</strong><small>{fund.type}</small></span></span><strong>{fund.nav}</strong><span className="change up">{fund.returns}</span><span><i className={`risk-dot ${fund.risk === 'Moderate' ? 'risk-low' : ''}`} />{fund.risk}</span><button className="button button-secondary button-small">Compare</button></div>)}</div></section><div className="fund-note"><ShieldCheck size={15} /><span>Mutual fund investments are subject to market risks. Read all scheme-related documents carefully.</span></div></div>
}

function Advice({ riskLevel = 'moderate' }: { riskLevel?: string }) {
  const level = riskLevel === 'conservative' || riskLevel === 'aggressive' ? riskLevel : 'moderate'
  const allocations = { conservative: [25, 60, 10, 5], moderate: [55, 30, 10, 5], aggressive: [75, 15, 7, 3] }
  const [equity, debt, gold, cash] = allocations[level]
  const drift = 63 - equity
  const targets = [{ label: 'Equity', percent: equity, color: 'mint', copy: 'Growth potential' }, { label: 'Debt', percent: debt, color: 'blue', copy: 'Stability & income' }, { label: 'Gold', percent: gold, color: 'orange', copy: 'Portfolio diversifier' }, { label: 'Cash', percent: cash, color: 'slate', copy: 'Accessible reserve' }]
  return <div className="view-stack"><PageHeading eyebrow="Built around you" title="A plan with purpose." subtitle="Transparent guidance shaped by your goals and risk profile." action={<button className="button button-secondary"><SlidersHorizontal size={15} /> Retake profile</button>} /><section className="plan-banner"><div className="plan-banner-icon"><Sparkles size={20} /></div><div><span className="eyebrow">YOUR INVESTOR PROFILE</span><h2>Steady builder <span className="profile-tag">{level[0].toUpperCase() + level.slice(1)}</span></h2><p>Long-term horizon · Wealth creation · 10+ years</p></div><div className="plan-score"><span>Profile confidence</span><strong>Good match</strong><div className="confidence-bar"><i /></div></div></section><div className="overview-grid"><section className="panel recommendation-panel"><div className="panel-header"><div><h2>Your target allocation</h2><p>A starting mix based on your risk profile</p></div><span className="text-muted">Long-term</span></div><div className="target-list">{targets.map(item => <div className="target-row" key={item.label}><div className="target-label"><span className={`target-dot ${item.color}`} /><span><strong>{item.label}</strong><small>{item.copy}</small></span></div><div className="target-track"><i className={item.color} style={{ width: `${item.percent}%` }} /></div><strong>{item.percent}%</strong></div>)}</div></section><section className="insight-card allocation-insight"><div className="insight-head"><span className="insight-icon"><Activity size={16} /></span><span>REBALANCE CHECK</span></div><h2>{drift > 0 ? 'Your equity allocation is drifting high.' : drift < 0 ? 'Your equity allocation is below target.' : 'Your equity allocation is on target.'}</h2><p>Illustrative equity holdings are at 63% against a {equity}% target. Review during your next scheduled portfolio check-in.</p><div className="drift-stats"><span>Current <strong>63%</strong></span><span>Target <strong>{equity}%</strong></span><span>Drift <strong className={drift > 0 ? 'negative-text' : 'positive-text'}>{drift > 0 ? '+' : ''}{drift}%</strong></span></div></section></div><section className="panel suggestions-panel"><div className="panel-header"><div><h2>Ideas to explore</h2><p>Examples that fit your stated preferences, not personal recommendations</p></div><BookOpen size={17} /></div><div className="suggestion-grid">{[{ tag: 'INDEX · EQUITY', title: 'Broad-market index funds', copy: 'A diversified way to follow a major market index with a long horizon.', color: 'mint' }, { tag: 'DEBT · STABILITY', title: 'Short-duration debt funds', copy: 'May help add stability to a portfolio, depending on your time horizon.', color: 'blue' }, { tag: 'HABIT · CONSISTENCY', title: 'Automate your SIPs', copy: 'Regular investing can build a consistent habit through market cycles.', color: 'orange' }].map(item => <article className="suggestion" key={item.title}><span className={`suggestion-tag ${item.color}`}>{item.tag}</span><h3>{item.title}</h3><p>{item.copy}</p><button className="text-action">Explore <ArrowRight size={14} /></button></article>)}</div></section><p className="data-note"><ShieldCheck size={14} /> Educational insights only. Not personalized financial, tax, or investment advice.</p></div>
}

function SettingsPage({ dark, setDark, onAuth }: { dark: boolean; setDark: (value: boolean) => void; onAuth: () => void }) {
  const [notice, setNotice] = useState(false)
  return <div className="view-stack"><PageHeading eyebrow="Make it yours" title="Settings" subtitle="Your account, preferences, and peace of mind." /><div className="settings-layout"><section className="panel settings-panel"><div className="settings-section"><div className="settings-heading"><h2>Personal details</h2><p>Manage the basics of your account.</p></div><div className="settings-profile"><span className="profile-avatar large">AM</span><div><strong>Aarav Mehta</strong><span>aarav@example.com</span></div><button className="button button-secondary button-small">Edit profile</button></div><div className="settings-divider" /><div className="setting-row"><span><strong>Investor profile</strong><small>Moderate · Long-term · Wealth creation</small></span><button className="text-action">Retake quiz <ArrowRight size={14} /></button></div></div><div className="settings-section"><div className="settings-heading"><h2>Preferences</h2><p>Set up WealthLens to feel right for you.</p></div><div className="setting-row"><span><strong>Appearance</strong><small>Choose a comfortable theme.</small></span><button className={`toggle ${dark ? 'toggle-on' : ''}`} role="switch" aria-checked={dark} aria-label="Dark appearance" onClick={() => setDark(!dark)}><i /></button></div><div className="setting-row"><span><strong>Price alerts</strong><small>Get notified about watchlist changes.</small></span><button className="toggle" role="switch" aria-checked="false" aria-label="Price alerts" onClick={() => setNotice(!notice)}><i /></button></div>{notice && <p className="setting-notice">Price alerts are off in this demo workspace.</p>}</div><div className="settings-section"><div className="settings-heading"><h2>Security</h2><p>Your account protection comes first.</p></div><div className="setting-row"><span><strong>Password & sign-in</strong><small>Manage your credentials securely.</small></span><button className="text-action" onClick={onAuth}>Manage <ArrowRight size={14} /></button></div></div></section><aside className="security-note"><span><Fingerprint size={19} /></span><h3>Your money data is yours.</h3><p>We use encrypted connections and never sell your personal information. Connect a real account to enable cloud-synced preferences.</p><button className="text-action">Privacy overview <ArrowRight size={14} /></button></aside></div></div>
}

function AuthScreen({ onDemo, onLogin }: { onDemo: () => void; onLogin: (user: User, token?: string) => void }) {
  const resetToken = new URLSearchParams(window.location.search).get('token') ?? ''
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>(resetToken ? 'reset' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setStatusMessage('')
    if (mode === 'reset' && password !== confirmPassword) { setError('Those passwords do not match.'); setBusy(false); return }
    try {
      const endpoint = mode === 'forgot' ? 'forgot-password' : mode === 'reset' ? 'reset-password' : mode
      const body = mode === 'forgot' ? { email } : mode === 'reset' ? { token: resetToken, password } : { email, password, name }
      const response = await apiRequest(`/api/auth/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to sign in.')
      if (mode === 'forgot') { setStatusMessage(payload.message); setBusy(false); return }
      if (mode === 'reset') { window.history.replaceState({}, '', window.location.pathname); setMode('login'); setPassword(''); setConfirmPassword(''); setStatusMessage(payload.message); setBusy(false); return }
      onLogin({ id: payload.user.id, name: payload.user.name, email: payload.user.email, needsOnboarding: payload.user.needsOnboarding, riskLevel: payload.user.riskLevel }, payload.accessToken)
    } catch (err) { setError(err instanceof Error && err.message !== 'Failed to fetch' ? err.message : 'Connect the API to sign in, or continue in demo mode.') }
    finally { setBusy(false) }
  }
  const copy = { login: ['Good to have you back.', 'Sign in to pick up where you left off.'], signup: ['Start with a clearer view.', 'Create an account for your financial workspace.'], forgot: ['Reset your password.', 'We’ll email a secure link if the account exists.'], reset: ['Choose a new password.', 'Use at least 8 characters for your new password.'] }[mode]
  return <div className="auth-screen"><div className="auth-brand brand"><span className="brand-mark"><Command size={19} strokeWidth={2.5} /></span><span>wealth<span className="brand-light">lens</span></span></div><div className="auth-decoration"><div className="auth-ring ring-one" /><div className="auth-ring ring-two" /><div className="auth-orbit-dot" /><div className="auth-decoration-copy"><span>YOUR FINANCIAL LIFE, IN FOCUS</span><strong>Make your next<br />move a thoughtful one.</strong><p>A calmer, clearer way to see where you are and where you could go.</p></div><div className="auth-proof"><span className="status-dot" /> Your finances. One clear view.</div></div><section className="auth-form-wrap"><div className="auth-form"><span className="eyebrow">WELCOME TO WEALTHLENS</span><h1>{copy[0]}</h1><p>{copy[1]}</p><form onSubmit={submit}>{mode === 'signup' && <label>Your name<input value={name} onChange={e => setName(e.target.value)} required placeholder="Aarav Mehta" /></label>}{mode !== 'reset' && <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="email" /></label>}{mode !== 'forgot' && <label>{mode === 'reset' ? 'New password' : 'Password'}<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="At least 8 characters" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>}{mode === 'reset' && <label>Confirm new password<input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} placeholder="Enter it once more" autoComplete="new-password" /></label>}{mode === 'login' && <button type="button" className="forgot-link" onClick={() => { setMode('forgot'); setError(''); setStatusMessage('') }}>Forgot password?</button>}{error && <p className="auth-error" role="alert">{error}</p>}{statusMessage && <p className="auth-success" role="status">{statusMessage}</p>}<button className="button button-primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Reset password'} <ArrowRight size={16} /></button></form>{(mode === 'login' || mode === 'signup') && <><div className="auth-separator"><span /> or <span /></div><button className="button button-secondary demo-button" onClick={onDemo}>Explore demo workspace <ArrowRight size={15} /></button></>}<p className="auth-switch">{mode === 'login' ? <>New to WealthLens? <button onClick={() => { setMode('signup'); setError('') }}>Create an account</button></> : mode === 'signup' ? <>Already have an account? <button onClick={() => { setMode('login'); setError('') }}>Sign in</button></> : <button onClick={() => { setMode('login'); setError(''); setStatusMessage('') }}>Back to sign in</button>}</p><small className="auth-disclaimer"><ShieldCheck size={13} /> Your information is protected. Educational use only.</small></div></section></div>
}

function AuthModal({ onClose, onLogin }: { onClose: () => void; onLogin: (user: User, token?: string) => void }) {
  return <div className="modal-backdrop" onClick={onClose}><div className="auth-modal" onClick={e => e.stopPropagation()}><button className="icon-button modal-close" aria-label="Close" onClick={onClose}><X size={17} /></button><AuthScreen onDemo={() => { onLogin({ name: 'Aarav Mehta', email: 'aarav@example.com' }); onClose() }} onLogin={(user, token) => { onLogin(user, token); onClose() }} /></div></div>
}

function Onboarding({ onComplete }: { onComplete: (riskLevel: string) => void }) {
  const [age, setAge] = useState('30')
  const [income, setIncome] = useState('₹10L – ₹25L')
  const [goals, setGoals] = useState<string[]>([])
  const [horizon, setHorizon] = useState('long')
  const [answers, setAnswers] = useState<number[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const questions = [
    { title: 'Your portfolio falls 15% in a month. What feels right?', options: ['Sell to limit further losses', 'Hold and review my plan', 'Stay invested or add gradually'] },
    { title: 'How would a temporary loss affect your plans?', options: ['I would need the money soon', 'I can wait, but would feel uneasy', 'It would not change my long-term plan'] },
    { title: 'Which trade-off feels most comfortable?', options: ['Steadier returns, even if lower', 'A balance of growth and stability', 'Higher long-term growth with more ups and downs'] },
    { title: 'How much short-term fluctuation can you tolerate?', options: ['Very little', 'Some, within a clear plan', 'I can tolerate significant swings'] },
  ]
  const goalOptions = ['Retirement', 'Home', 'Education', 'Wealth growth']
  const toggleGoal = (goal: string) => setGoals(current => current.includes(goal) ? current.filter(item => item !== goal) : [...current, goal])
  const submit = async () => {
    if (!goals.length || answers.length !== questions.length) return setError('Choose at least one goal and answer each risk question.')
    const score = answers.reduce((total, answer) => total + answer, 0)
    const riskLevel = score <= 6 ? 'conservative' : score <= 9 ? 'moderate' : 'aggressive'
    setBusy(true); setError('')
    try {
      const response = await apiRequest('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ age: Number(age), income, goals, horizon, riskLevel, answers: Object.fromEntries(answers.map((value, index) => [`q${index + 1}`, value])) }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Could not save your profile.')
      onComplete(riskLevel)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save your profile.') }
    finally { setBusy(false) }
  }
  return <main className="onboarding-screen"><div className="onboarding-brand brand"><span className="brand-mark"><Command size={19} strokeWidth={2.5} /></span><span>wealth<span className="brand-light">lens</span></span></div><div className="onboarding-content"><span className="eyebrow">LET'S GET TO KNOW YOU</span><h1>A plan that fits your life.</h1><p className="onboarding-intro">A few thoughtful questions help us make your workspace more relevant. This is educational guidance, not financial advice.</p><div className="onboarding-basics"><label>Age<input type="number" min="18" max="100" value={age} onChange={event => setAge(event.target.value)} /></label><label>Annual income<select value={income} onChange={event => setIncome(event.target.value)}><option>Below ₹5L</option><option>₹5L – ₹10L</option><option>₹10L – ₹25L</option><option>Above ₹25L</option><option>Prefer not to say</option></select></label><label>Investment horizon<select value={horizon} onChange={event => setHorizon(event.target.value)}><option value="short">Under 3 years</option><option value="medium">3–10 years</option><option value="long">10+ years</option></select></label></div><div className="onboarding-goals"><strong>What are you investing toward?</strong><div>{goalOptions.map(goal => <button key={goal} className={`goal-choice ${goals.includes(goal) ? 'chosen' : ''}`} onClick={() => toggleGoal(goal)}>{goals.includes(goal) && <Check size={13} />}{goal}</button>)}</div></div><section className="quiz-section"><div className="quiz-heading"><strong>A little about your comfort with risk</strong><span>{answers.length} / {questions.length} answered</span></div>{questions.map((question, index) => <fieldset className="quiz-question" key={question.title}><legend>{index + 1}. {question.title}</legend><div>{question.options.map((option, optionIndex) => <label className={`quiz-option ${answers[index] === optionIndex + 1 ? 'chosen' : ''}`} key={option}><input type="radio" name={`question-${index}`} checked={answers[index] === optionIndex + 1} onChange={() => setAnswers(current => { const next = [...current]; next[index] = optionIndex + 1; return next })} />{option}</label>)}</div></fieldset>)}</section>{error && <p className="auth-error" role="alert">{error}</p>}<button className="button button-primary onboarding-submit" disabled={busy} onClick={submit}>{busy ? 'Saving your profile…' : 'Build my profile'} <ArrowRight size={16} /></button></div></main>
}

export default App