import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Hero Section */}
      <section className="w-full py-24 md:py-32 lg:py-40 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/40 via-zinc-950 to-zinc-950 -z-10" />
        <div className="container px-4 md:px-6 text-center">
          <div className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-400 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
            Advanced Quantitative Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6">
            Test and Analyze <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
              Systematic Momentum
            </span>
          </h1>
          <p className="max-w-[700px] mx-auto text-zinc-400 md:text-xl mb-10 leading-relaxed">
            A powerful research environment for simulating relative, absolute, and dual momentum strategies using historical market data. Strictly for educational and analytical purposes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="h-12 px-8 inline-flex items-center justify-center rounded-md bg-emerald-500 text-zinc-950 font-medium hover:bg-emerald-400 hover:scale-105 transition-all">
              Start Researching
            </Link>
            <Link href="#methodology" className="h-12 px-8 inline-flex items-center justify-center rounded-md border border-zinc-700 hover:bg-zinc-800 text-white font-medium transition-all">
              Learn Methodology
            </Link>
          </div>
        </div>
      </section>

      {/* Philosophy / Methodology Section */}
      <section id="methodology" className="w-full py-20 bg-zinc-900/50 border-t border-zinc-800">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">The Logic of Momentum</h2>
            <p className="text-zinc-400 max-w-[800px] mx-auto">
              Momentum investing is grounded in the observation that assets which have performed well recently tend to continue performing well in the near term, while those that have performed poorly tend to continue performing poorly.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Relative Momentum</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Ranks securities against their peers. By selecting the top performers over a defined lookback period, this cross-sectional approach aims to capture relative strength within a market universe.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Absolute Momentum</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Focuses on the trend of the asset itself, independent of peers. Often called time-series momentum, it filters out assets with negative returns over the lookback to protect capital during severe downtrends.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Dual Momentum</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Combines both metrics. It first requires positive absolute momentum to enter the market, then selects the strongest assets based on relative momentum, striving for both growth and downside protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Realistic Analytics Section */}
      <section className="w-full py-20 flex flex-col items-center">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Institutional-Grade Analytics</h2>
            <p className="text-zinc-400 max-w-[700px] mx-auto">
              Our backtest engine computes comprehensive metrics to evaluate strategy robustness beyond simple returns.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {['Sharpe Ratio', 'Max Drawdown', 'CAGR', 'Sortino Ratio', 'Skewness', 'Kurtosis', 'Volatility', 'Calmar Ratio'].map((metric) => (
              <div key={metric} className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                <span className="text-emerald-400 font-bold text-xl mb-1">■</span>
                <span className="text-sm font-medium text-zinc-300">{metric}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Disclaimers */}
      <section className="w-full py-16 bg-zinc-950 border-t border-zinc-800/50">
        <div className="container max-w-4xl px-4 md:px-6">
          <h3 className="text-xl font-bold mb-6 text-zinc-100 flex items-center">
            <svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Important Disclaimers
          </h3>
          <div className="space-y-4 text-sm text-zinc-400">
            <p><strong className="text-zinc-300">Research Use Only:</strong> This platform is intended strictly for educational and research purposes. It does not provide investment advice, financial advice, trading signals, or recommendations to buy or sell securities.</p>
            <p><strong className="text-zinc-300">Hypothetical Results:</strong> All simulations are hypothetical backtests using historical data and assumptions. Hypothetical results have inherent limitations and do not represent actual trading. Past performance does not guarantee future results.</p>
            <p><strong className="text-zinc-300">Data Limitations:</strong> Market data used in simulations is sourced from free public sources. These sources may contain inaccuracies, survivorship bias, missing data, or delays.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
