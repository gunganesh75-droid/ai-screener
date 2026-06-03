import { Link } from 'react-router-dom'
import { Zap, Brain, Shield, TrendingUp, CheckCircle, ArrowRight, Users, Briefcase, Star } from 'lucide-react'

const features = [
  { icon: Brain, title: 'AI-Powered Screening', desc: 'AI analyzes every resume against job requirements and calculates precise match scores instantly.' },
  { icon: Zap, title: 'Instant Ranking', desc: 'Candidates are automatically sorted by AI score — from most to least suitable — saving hours of manual review.' },
  { icon: Shield, title: 'Secure & Private', desc: 'JWT authentication, bcrypt hashing, and rate limiting keep your data safe.' },
  { icon: TrendingUp, title: 'Smart Filtering', desc: 'Scores ≥70% are shortlisted, 50–69% flagged for review, and <50% auto-rejected. Fully configurable.' },
]

const stats = [
  { label: 'Time Saved', value: '85%', icon: '⚡' },
  { label: 'Accuracy Rate', value: '94%', icon: '🎯' },
  { label: 'Jobs Processed', value: '10K+', icon: '📋' },
  { label: 'Happy Recruiters', value: '500+', icon: '😊' },
]

const steps = [
  { step: '01', title: 'Post a Job', desc: 'HR creates a job posting with description and required skills.' },
  { step: '02', title: 'Candidates Apply', desc: 'Candidates upload their PDF resume and apply for positions.' },
  { step: '03', title: 'AI Screens', desc: 'AI parses the resume and computes a match score against the job.' },
  { step: '04', title: 'Hire Smarter', desc: 'HR reviews ranked candidates and makes data-driven hiring decisions.' },
]

export default function Home() {
  return (
    <div className="bg-slate-950">
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-900/40 border border-primary-700/40 text-primary-300 text-sm font-medium mb-8 animate-fade-in">
            <Zap size={14} className="text-primary-400" />
            Enhanced by Artificial Intelligence
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tight mb-6 animate-slide-up">
            Hire Smarter with<br />
            <span className="gradient-text">AI Resume Screening</span>
          </h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in">
            Automatically score, rank, and shortlist candidates using advanced AI, helping your team hire faster and more accurately.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link to="/register" className="btn-primary !text-base !px-8 !py-4 shadow-2xl shadow-primary-900/50">
              Start for Free <ArrowRight size={18} />
            </Link>
            <Link to="/jobs" className="btn-secondary !text-base !px-8 !py-4">
              Browse Open Jobs
            </Link>
          </div>
          {/* Hero mockup stats bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="glass rounded-2xl p-4 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-2xl font-black text-white">{s.value}</div>
                <div className="text-xs text-slate-500 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section className="py-24 border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">Everything you need to<br /><span className="gradient-text">hire the right people</span></h2>
            <p className="section-sub">An end-to-end recruitment platform with AI at its core</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card group hover:border-primary-700/40 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary-600/15 border border-primary-500/20 flex items-center justify-center mb-4 group-hover:bg-primary-600/25 transition-all">
                  <Icon size={22} className="text-primary-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────── */}
      <section className="py-24 bg-slate-900/40 border-y border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">How it <span className="gradient-text">works</span></h2>
            <p className="section-sub">From job post to hired candidate in four simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {steps.map(({ step, title, desc }, i) => (
              <div key={step} className="relative">
                <div className="card text-center h-full">
                  <div className="text-5xl font-black text-primary-800 mb-4">{step}</div>
                  <h3 className="text-white font-semibold mb-2">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ArrowRight size={20} className="text-slate-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Score explanation ───────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">
                Automatic filtering with<br /><span className="gradient-text">AI match scores</span>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-8">
                Every resume is parsed and compared against the job description using advanced AI. Candidates receive an instant match score, and are automatically filtered into categories.
              </p>
              <div className="space-y-4">
                {[
                  { range: 'Score ≥ 70%', label: 'Auto-Shortlisted', desc: 'Strong match — top candidates ready for interview.', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
                  { range: 'Score 50–69%', label: 'Review Required', desc: 'Moderate match — worth a closer human look.', bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' },
                  { range: 'Score < 50%', label: 'Auto-Rejected', desc: 'Poor match — saves HR from reviewing irrelevant profiles.', bg: 'bg-red-500/5', border: 'border-red-500/20', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300' },
                ].map(({ range, label, desc, bg, border, text, badge }) => (
                  <div key={label} className={`flex items-start gap-4 p-4 rounded-xl ${bg} border ${border}`}>
                    <CheckCircle size={18} className={`${text} mt-0.5 flex-shrink-0`} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`${text} font-bold text-sm`}>{range}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${badge}`}>{label}</span>
                      </div>
                      <p className="text-slate-500 text-sm">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'Sarah Chen', role: 'Full Stack Dev', score: 92, status: 'Shortlisted' },
                { name: 'Alex Kumar', role: 'React Engineer', score: 78, status: 'Shortlisted' },
                { name: 'Mike Brown', role: 'Frontend Dev', score: 61, status: 'Review' },
                { name: 'Jenny Liu', role: 'UI Designer', score: 34, status: 'Rejected' },
              ].map(({ name, role, score, status }) => (
                <div key={name} className="card text-center">
                  <div className="w-12 h-12 rounded-full bg-primary-600/20 border border-primary-500/20 flex items-center justify-center text-primary-300 font-bold mx-auto mb-3">
                    {name.charAt(0)}
                  </div>
                  <p className="text-white font-semibold text-sm">{name}</p>
                  <p className="text-slate-500 text-xs mb-3">{role}</p>
                  <div className={`text-2xl font-black mb-2 ${score >= 70 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {score}%
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${status === 'Shortlisted' ? 'badge-shortlisted' : status === 'Review' ? 'badge-review' : 'badge-rejected'}`}>
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="py-24 border-t border-slate-800/60">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="card glow border-primary-700/30">
            <div className="w-16 h-16 rounded-2xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center mx-auto mb-6">
              <Brain size={32} className="text-primary-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to transform your hiring?</h2>
            <p className="text-slate-400 mb-8 text-lg">Join hundreds of recruiters saving time with AI-powered screening.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary !text-base !px-8 !py-4">
                Get Started Free <ArrowRight size={18} />
              </Link>
              <Link to="/jobs" className="btn-secondary !text-base !px-8 !py-4">
                <Briefcase size={18} /> Browse Jobs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
