import Link from 'next/link'
import { ScrollReveal } from '@/components/landing/ScrollReveal'
import {
  ArrowRight, Zap, Plug, Layers, ListTodo, CheckCircle2,
  Sparkles, GitBranch, Clock, Shield, ChevronRight,
} from 'lucide-react'

/* ─── tiny inline components ──────────────────────────────────── */

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
      {children}
    </span>
  )
}

/* ─── Product mockups ─────────────────────────────────────────── */

function BrowserFrame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60 ${className}`}>
      <div className="flex items-center gap-1.5 bg-[#1a1a2e] px-3 py-2.5 border-b border-white/5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <div className="ml-3 flex-1 h-4 rounded bg-white/5 max-w-[140px] text-[10px] text-white/30 flex items-center px-2">
          nokloo.vercel.app
        </div>
      </div>
      {children}
    </div>
  )
}

function KanbanMockup() {
  const phases = [
    {
      name: 'Planning', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20',
      tasks: [
        { title: 'Define user personas', done: true },
        { title: 'Wireframe key flows', done: true },
        { title: 'Technical architecture', done: false, active: true },
      ],
    },
    {
      name: 'Building', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20',
      tasks: [
        { title: 'Auth & user accounts', done: true },
        { title: 'Database schema', done: false, active: true },
        { title: 'API endpoints', done: false },
      ],
    },
    {
      name: 'Testing', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20',
      tasks: [
        { title: 'Unit tests', done: false },
        { title: 'E2E test suite', done: false },
        { title: 'Performance audit', done: false },
      ],
    },
    {
      name: 'Launch', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20',
      tasks: [
        { title: 'Deploy to production', done: false },
        { title: 'Announce on Product Hunt', done: false },
      ],
    },
  ]

  return (
    <BrowserFrame>
      <div className="flex bg-[#0e0e1a] h-[360px] text-xs overflow-hidden">
        {/* Sidebar */}
        <div className="w-40 bg-[#111120] border-r border-white/5 flex flex-col p-3 gap-1 shrink-0">
          <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
            <div className="w-5 h-5 rounded bg-purple-500/20 flex items-center justify-center">
              <Zap className="w-2.5 h-2.5 text-purple-400" />
            </div>
            <span className="font-semibold text-white/90 font-display text-[11px]">Nokloo</span>
          </div>
          {['Dashboard', 'Projects', 'Setup', 'Settings'].map((item, i) => (
            <div key={item} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] ${i === 1 ? 'bg-purple-500/15 text-purple-300' : 'text-white/40'}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
              {item}
            </div>
          ))}
        </div>
        {/* Kanban area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2">
            <span className="text-white/80 font-semibold text-[11px]">My SaaS App</span>
            <span className="px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 text-[9px]">Building</span>
          </div>
          <div className="flex gap-3 px-3 pt-3 overflow-x-auto flex-1 pb-3">
            {phases.map((phase) => (
              <div key={phase.name} className="w-[120px] shrink-0 flex flex-col gap-2">
                <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border ${phase.bg} ${phase.border}`}>
                  <span className={`text-[10px] font-semibold ${phase.color}`}>{phase.name}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {phase.tasks.map((task) => (
                    <div key={task.title} className={`rounded-lg border p-2 ${task.done ? 'bg-white/3 border-white/5' : task.active ? 'bg-white/6 border-purple-500/20' : 'bg-white/4 border-white/5'}`}>
                      <div className="flex items-start gap-1.5">
                        <div className={`mt-0.5 w-2.5 h-2.5 rounded shrink-0 flex items-center justify-center ${task.done ? 'bg-emerald-500/20' : task.active ? 'bg-purple-500/20' : 'bg-white/5'}`}>
                          {task.done && <CheckCircle2 className="w-2 h-2 text-emerald-400" />}
                          {task.active && <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />}
                        </div>
                        <span className={`text-[9px] leading-tight ${task.done ? 'text-white/30 line-through' : task.active ? 'text-white/80' : 'text-white/50'}`}>
                          {task.title}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserFrame>
  )
}

function ProjectsMockup() {
  const projects = [
    { name: 'My SaaS App', desc: 'Subscription platform with AI features', status: 'building', colorCls: 'bg-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-400' },
    { name: 'Portfolio Site', desc: 'Personal brand & case studies', status: 'deployed', colorCls: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    { name: 'Mobile App', desc: 'iOS & Android fitness tracker', status: 'planning', colorCls: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
  ]
  return (
    <BrowserFrame>
      <div className="bg-[#0e0e1a] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 font-semibold text-sm">Projects</p>
            <p className="text-white/30 text-xs mt-0.5">3 active</p>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-medium flex items-center gap-1.5">
            <span>+</span> New project
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {projects.map((p) => (
            <div key={p.name} className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-3">
              <div className={`w-8 h-8 rounded-lg ${p.colorCls} flex items-center justify-center`}>
                <Zap className={`w-3.5 h-3.5 ${p.text}`} />
              </div>
              <div>
                <p className="text-white/80 text-xs font-semibold">{p.name}</p>
                <p className="text-white/30 text-[10px] mt-0.5 leading-tight">{p.desc}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                <span className="text-white/30 text-[10px]">{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  )
}

/* ─── Main landing page ───────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080811] text-white overflow-x-hidden" style={{ colorScheme: 'dark' }}>

      {/* Ambient glows + dot grid */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-purple-600/8 blur-[120px] animate-glow-pulse" />
        <div className="absolute top-[30%] right-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-600/6 blur-[120px] animate-glow-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] rounded-full bg-violet-600/6 blur-[100px] animate-glow-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute inset-0 opacity-[0.12]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(139,92,246,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#080811]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <span className="font-display font-bold text-white tracking-tight">Nokloo</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/55 hover:text-white transition-colors px-3 py-1.5">
              Log in
            </Link>
            <Link href="/signup" className="text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative max-w-6xl mx-auto px-5 pt-24 pb-12 text-center">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both space-y-6">
          <div className="flex justify-center">
            <Badge>
              <Sparkles className="w-3 h-3" />
              Powered by Claude MCP
            </Badge>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight leading-[1.06] max-w-4xl mx-auto">
            Your AI project manager{' '}
            <span className="animate-shimmer-text">that actually ships</span>
          </h1>

          <p className="text-lg md:text-xl text-white/48 max-w-xl mx-auto leading-relaxed">
            Describe what you&apos;re building to Claude. It plans the phases, writes the tasks, and keeps your board updated as you ship.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/signup" className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-medium px-6 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/20 w-full sm:w-auto justify-center">
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 border border-white/10 hover:border-white/20 text-white/65 hover:text-white font-medium px-6 py-3 rounded-xl transition-all w-full sm:w-auto justify-center">
              Log in
            </Link>
          </div>

          <p className="text-xs text-white/22">No credit card required · Free to start</p>
        </div>

        {/* Hero product mockup */}
        <div className="mt-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
          <div className="animate-float-slow">
            <div className="relative">
              <div className="absolute -inset-6 bg-purple-600/10 blur-3xl rounded-3xl" />
              <div className="relative">
                <KanbanMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof strip ── */}
      <ScrollReveal>
        <section className="border-y border-white/5 bg-white/[0.015] py-5">
          <div className="max-w-4xl mx-auto px-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-white/28 text-sm">
            {['Built for indie hackers', 'Works with Claude.ai', 'No installs needed', 'MCP-native', 'Free to start'].map((item, i) => (
              <div key={item} className="flex items-center gap-2">
                {i > 0 && <span className="text-white/8 hidden sm:block">·</span>}
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400/50" />
                {item}
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* ── How it works ── */}
      <section className="max-w-5xl mx-auto px-5 py-24">
        <ScrollReveal className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400/70 mb-3">How it works</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Three steps to a full roadmap
          </h2>
          <p className="text-white/45 mt-4 max-w-lg mx-auto">No spreadsheets. No setup. Describe your idea and watch the board build itself.</p>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-5 relative">
          <div className="absolute top-10 left-[33%] right-[33%] h-px bg-gradient-to-r from-transparent via-purple-500/25 to-transparent hidden md:block" />
          {[
            { step: '01', icon: Plug, title: 'Connect Claude', desc: "Paste one URL into Claude's integration settings. No config files, no API keys to manage.", color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', delay: 0 },
            { step: '02', icon: Layers, title: 'Describe your build', desc: "Tell Claude what you're making. It asks the right questions and maps out phases automatically.", color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', delay: 100 },
            { step: '03', icon: ListTodo, title: 'Ship with clarity', desc: 'Tasks appear on your board instantly. Mark them done and Claude activates the next phase.', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', delay: 200 },
          ].map(({ step, icon: Icon, title, desc, color, bg, border, delay }) => (
            <ScrollReveal key={step} delay={delay}>
              <div className={`rounded-2xl border ${border} bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 space-y-4 h-full`}>
                <div className="flex items-center justify-between">
                  <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <span className={`text-3xl font-bold font-display ${color} opacity-20`}>{step}</span>
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
                  <p className="text-sm text-white/42 mt-1.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Phase auto-activation feature ── */}
      <section className="max-w-6xl mx-auto px-5 py-10">
        <div className="rounded-3xl border border-white/7 bg-white/[0.015] overflow-hidden">
          <div className="grid md:grid-cols-2">
            <ScrollReveal className="p-10 md:p-14 flex flex-col justify-center space-y-5">
              <Badge>
                <Zap className="w-3 h-3" />
                Smart phase tracking
              </Badge>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
                Phases activate themselves
              </h2>
              <p className="text-white/48 leading-relaxed">
                Mark a task in-progress and the phase lights up. Finish everything and the next phase automatically kicks in — no manual prodding required.
              </p>
              <ul className="space-y-2.5">
                {[
                  'In-progress tasks instantly activate their phase',
                  'Completed phases hand off to the next one',
                  'Multiple phases can run in parallel',
                  'All synced live — no page refresh needed',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-white/55">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </ScrollReveal>

            <ScrollReveal delay={150} className="p-8 md:p-10 flex items-center justify-center bg-black/20">
              <div className="w-full max-w-xs space-y-3">
                {[
                  { name: 'Planning',  pct: 100, done: 4, total: 4, status: 'completed', colorBar: 'bg-emerald-500', colorRing: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
                  { name: 'Building',  pct: 50,  done: 3, total: 6, status: 'active',    colorBar: 'bg-purple-500',  colorRing: 'border-purple-500/30 bg-purple-500/10 text-purple-400' },
                  { name: 'Testing',   pct: 33,  done: 1, total: 3, status: 'active',    colorBar: 'bg-blue-500',    colorRing: 'border-blue-500/30 bg-blue-500/10 text-blue-400' },
                  { name: 'Launch',    pct: 0,   done: 0, total: 2, status: 'pending',   colorBar: 'bg-white/20',    colorRing: 'border-white/8 bg-white/3 text-white/35' },
                ].map((phase) => (
                  <div key={phase.name} className={`rounded-xl border p-3.5 ${phase.colorRing}`}>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        {phase.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                        {phase.status === 'active'    && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                        {phase.status === 'pending'   && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-30" />}
                        {phase.name}
                      </div>
                      <span className="text-[10px] opacity-55">{phase.done}/{phase.total}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full rounded-full ${phase.colorBar} transition-all`} style={{ width: `${phase.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Projects view feature ── */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <ScrollReveal delay={100} className="order-2 md:order-1">
            <ProjectsMockup />
          </ScrollReveal>
          <ScrollReveal className="order-1 md:order-2 space-y-5">
            <Badge>
              <GitBranch className="w-3 h-3" />
              Project management
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              All your projects,<br />one clean board
            </h2>
            <p className="text-white/48 leading-relaxed">
              Every project Claude creates lands straight on your board. Archive, restore, edit — all with one click. Your work, always organised.
            </p>
            <ul className="space-y-3">
              {[
                { icon: Sparkles, label: 'Claude creates projects via MCP — no copy-paste' },
                { icon: Clock, label: 'See last activity and status at a glance' },
                { icon: Shield, label: 'Each project is private and secure to your account' },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-sm text-white/55">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  {label}
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="max-w-5xl mx-auto px-5 py-16">
        <ScrollReveal className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Everything a vibe coder needs
          </h2>
          <p className="text-white/40 mt-3">No bloat. Just the essentials, done right.</p>
        </ScrollReveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Plug,         title: 'One-click Claude setup',  desc: 'Paste a URL, click Authorize. Claude is connected in under 30 seconds.',                  color: 'text-purple-400',  bg: 'bg-purple-500/10' },
            { icon: Zap,          title: 'Instant task creation',   desc: 'Claude pushes tasks directly to your board mid-conversation.',                            color: 'text-amber-400',   bg: 'bg-amber-500/10' },
            { icon: Layers,       title: 'Phase-based workflow',    desc: 'Plan → Build → Test → Launch. Move through structured phases automatically.',             color: 'text-blue-400',    bg: 'bg-blue-500/10' },
            { icon: CheckCircle2, title: 'Real-time sync',          desc: 'Updates from Claude appear on your board instantly via live subscriptions.',              color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: Clock,        title: 'UAT checklists',          desc: 'Claude generates acceptance criteria for every feature automatically.',                   color: 'text-violet-400',  bg: 'bg-violet-500/10' },
            { icon: Shield,       title: 'Secure by default',       desc: 'OAuth-based MCP auth. Each connection is scoped and revokable from your dashboard.',     color: 'text-rose-400',    bg: 'bg-rose-500/10' },
          ].map(({ icon: Icon, title, desc, color, bg }, i) => (
            <ScrollReveal key={title} delay={i * 60}>
              <div className="group rounded-2xl border border-white/6 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 p-6 space-y-3 transition-all h-full cursor-default">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <h3 className="font-semibold text-white/88">{title}</h3>
                <p className="text-sm text-white/42 leading-relaxed">{desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-5xl mx-auto px-5 py-20">
        <ScrollReveal>
          <div className="relative rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-600/10 via-indigo-600/5 to-transparent overflow-hidden text-center px-8 py-16 space-y-6">
            <div className="absolute inset-0 bg-gradient-to-t from-purple-600/5 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />
            <div className="relative space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-400/75">Get started today</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
                Build your next project<br />
                <span className="animate-shimmer-text">with an AI co-pilot</span>
              </h2>
              <p className="text-white/42 max-w-md mx-auto">
                Free to start. Connect Claude in 30 seconds. Your first project roadmap in under a minute.
              </p>
            </div>
            <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup" className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-medium px-7 py-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-purple-500/25 w-full sm:w-auto justify-center">
                Create free account
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 border border-white/10 hover:border-white/20 text-white/55 hover:text-white px-7 py-3.5 rounded-xl transition-all w-full sm:w-auto justify-center">
                Already have an account
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5">
        <div className="max-w-5xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/22">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-purple-500/20 flex items-center justify-center">
              <Zap className="w-2.5 h-2.5 text-purple-400" />
            </div>
            <span className="font-display font-semibold text-white/38">Nokloo</span>
          </div>
          <p>Built for indie hackers &amp; vibe coders.</p>
          <div className="flex items-center gap-5">
            <Link href="/login"  className="hover:text-white/55 transition-colors">Log in</Link>
            <Link href="/signup" className="hover:text-white/55 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
