'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import TopPicks from '@/components/TopPicks'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)

  const [simParams, setSimParams] = useState({
    strategy_type: 'absolute',
    lookback_period: 6,
    rebalance_frequency: 'monthly',
    portfolio_size: 10,
    universe: 'sp500',
    initial_capital: 100000,
    start_date: '2010-01-01',
    end_date: new Date().toISOString().split('T')[0],
    dca_amount: 0.0,
    dca_frequency: 'monthly',
    leverage: 1.0,
    transaction_cost_pct: 0.001,
    slippage_pct: 0.001,
    weighting_scheme: 'equal',
    absolute_momentum_threshold: 'zero',
    enable_monte_carlo: false,
    enable_walk_forward: false
  })

  // To show status while polling
  const [pollStatus, setPollStatus] = useState('')

  // Ensure logged in
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      router.push('/auth/login')
    }
  }, [router])

  const runSimulation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!disclaimerAccepted) {
      setError('You must accept the disclaimers before running a simulation.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await api.post('/simulations/run', simParams)
      const jobId = res.data.job_id
      setPollStatus('Started engine job ' + jobId.substring(0, 8) + '...')

      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await api.get(`/simulations/status/${jobId}`)
          if (statusRes.data.status === 'Completed') {
            clearInterval(pollInterval)
            sessionStorage.setItem('currentSimResult', JSON.stringify(statusRes.data.result))
            router.push('/dashboard/results')
          } else if (statusRes.data.status === 'Failed') {
            clearInterval(pollInterval)
            setError('Execution failed: ' + (statusRes.data.error || 'Unknown error'))
            setLoading(false)
            setPollStatus('')
          } else {
            setPollStatus(statusRes.data.status + ' (' + statusRes.data.progress + '%)')
          }
        } catch (pollErr: any) {
          clearInterval(pollInterval)
          setError('Error polling status: ' + pollErr.message)
          setLoading(false)
          setPollStatus('')
        }
      }, 2000)

    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit simulation. Check input or try again.')
      setLoading(false)
      setPollStatus('')
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6 border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-zinc-400">Set the parameters for your momentum backtest or view today's strongest signals.</p>
      </div>

      <TopPicks simParams={simParams} />

      <h2 className="text-xl font-bold mb-6">Configure Strategy</h2>

      {error && (
        <div className="p-4 mb-6 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={runSimulation} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
          <h2 className="text-xl font-semibold mb-4 text-emerald-400">Core Logic</h2>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Strategy Type</label>
            <select
              title="strategy"
              className="w-full px-4 py-2 rounded-md bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none appearance-none"
              value={simParams.strategy_type}
              onChange={(e) => setSimParams({ ...simParams, strategy_type: e.target.value })}
            >
              <option value="relative">Relative Momentum</option>
              <option value="absolute">Absolute Momentum</option>
              <option value="dual">Dual Momentum</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Lookback Period (Months)</label>
            <select
              title="lookback"
              className="w-full px-4 py-2 rounded-md bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none appearance-none"
              value={simParams.lookback_period}
              onChange={(e) => setSimParams({ ...simParams, lookback_period: parseInt(e.target.value) })}
            >
              <option value={3}>3 Months</option>
              <option value={6}>6 Months</option>
              <option value={9}>9 Months</option>
              <option value={12}>12 Months</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Rebalance Frequency</label>
            <select
              title="rebalance"
              className="w-full px-4 py-2 rounded-md bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none appearance-none"
              value={simParams.rebalance_frequency}
              onChange={(e) => setSimParams({ ...simParams, rebalance_frequency: e.target.value })}
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
        </div>

        <div className="space-y-6 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400">Portfolio Rules</h2>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Stock Universe</label>
            <select
              title="universe"
              className="w-full px-4 py-2 rounded-md bg-zinc-950 border border-zinc-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none appearance-none"
              value={simParams.universe}
              onChange={(e) => setSimParams({ ...simParams, universe: e.target.value })}
            >
              <option value="sp500">S&P 500</option>
              <option value="sp400">S&P 400 (Mid Cap)</option>
              <option value="sp600">S&P 600 (Small Cap)</option>
              <option value="nasdaq100">NASDAQ-100</option>
              <option value="sp1500">S&P 1500 (500+400+600)</option>
              <option value="combined">Combined All</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Portfolio Size (Top N Stocks)</label>
            <input
              type="number"
              min="1" max="50"
              className="w-full px-4 py-2 rounded-md bg-zinc-950 border border-zinc-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
              value={simParams.portfolio_size}
              onChange={(e) => setSimParams({ ...simParams, portfolio_size: parseInt(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Start Date</label>
            <input
              type="date"
              className="w-full px-4 py-2 rounded-md bg-zinc-950 text-white border border-zinc-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
              value={simParams.start_date}
              onChange={(e) => setSimParams({ ...simParams, start_date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">End Date (Optional)</label>
            <input
              type="date"
              className="w-full px-4 py-2 rounded-md bg-zinc-950 text-white border border-zinc-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
              value={simParams.end_date}
              onChange={(e) => setSimParams({ ...simParams, end_date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Initial Capital ($)</label>
            <input
              type="number"
              min="1000" step="1000"
              className="w-full px-4 py-2 rounded-md bg-zinc-950 border border-zinc-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
              value={simParams.initial_capital}
              onChange={(e) => setSimParams({ ...simParams, initial_capital: parseInt(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">DCA Amount ($)</label>
            <input
              type="number"
              min="0" step="50"
              className="w-full px-4 py-2 rounded-md bg-zinc-950 border border-zinc-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
              value={simParams.dca_amount}
              onChange={(e) => setSimParams({ ...simParams, dca_amount: parseFloat(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">DCA Frequency</label>
            <select
              title="dca_freq"
              className="w-full px-4 py-2 rounded-md bg-zinc-950 border border-zinc-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none appearance-none"
              value={simParams.dca_frequency}
              onChange={(e) => setSimParams({ ...simParams, dca_frequency: e.target.value })}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Portfolio Weighting</label>
            <select
              title="weighting"
              className="w-full px-4 py-2 rounded-md bg-zinc-950 border border-zinc-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none appearance-none"
              value={simParams.weighting_scheme}
              onChange={(e) => setSimParams({ ...simParams, weighting_scheme: e.target.value })}
            >
              <option value="equal">Equal Weight (1/N)</option>
              <option value="market_cap">Market Cap Weighted</option>
              <option value="momentum">Momentum Score Weighted</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Absolute Momentum Filter</label>
            <select
              title="absolute_filter"
              className="w-full px-4 py-2 rounded-md bg-zinc-950 border border-zinc-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none appearance-none"
              value={simParams.absolute_momentum_threshold}
              onChange={(e) => setSimParams({ ...simParams, absolute_momentum_threshold: e.target.value })}
            >
              <option value="zero">&gt; 0% (Positive Return)</option>
              <option value="risk_free">&gt; Risk-Free Rate</option>
            </select>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
          <h2 className="text-xl font-semibold mb-4 text-purple-400">Institutional Assumptions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Leverage Ratio</label>
              <input
                type="number"
                min="0.5" max="3" step="0.1"
                className="w-full px-4 py-2 rounded-md bg-zinc-950 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                value={simParams.leverage}
                onChange={(e) => setSimParams({ ...simParams, leverage: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Transaction Cost (%)</label>
              <input
                type="number"
                min="0" max="0.05" step="0.001"
                className="w-full px-4 py-2 rounded-md bg-zinc-950 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                value={simParams.transaction_cost_pct}
                onChange={(e) => setSimParams({ ...simParams, transaction_cost_pct: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Spread Slippage (%)</label>
              <input
                type="number"
                min="0" max="0.05" step="0.001"
                className="w-full px-4 py-2 rounded-md bg-zinc-950 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                value={simParams.slippage_pct}
                onChange={(e) => setSimParams({ ...simParams, slippage_pct: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4 bg-zinc-900/30 p-6 rounded-xl border border-yellow-500/20">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-yellow-500">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Mandatory Disclaimers
          </h2>

          <div className="text-sm text-zinc-400 space-y-2">
            <p><strong>Research Use Only:</strong> This platform is intended strictly for educational and research purposes. It does not provide investment advice, financial advice, trading signals, or recommendations to buy or sell securities.</p>
            <p><strong>Hypothetical Results:</strong> All simulations are hypothetical backtests using historical data and assumptions. Hypothetical results have inherent limitations and do not represent actual trading.</p>
            <p><strong>Data Limitations & Bias:</strong> Market data used in simulations is sourced from free public sources. These sources may contain inaccuracies, survivorship bias, missing data, or delays.</p>
            <p><strong>No Guarantees:</strong> Past performance does not guarantee future results.</p>
          </div>

          <div className="flex items-center mt-6">
            <input
              type="checkbox"
              id="disclaimer"
              className="w-5 h-5 rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500"
              checked={disclaimerAccepted}
              onChange={(e) => setDisclaimerAccepted(e.target.checked)}
            />
            <label htmlFor="disclaimer" className="ml-3 text-sm font-medium text-zinc-200">
              I have read and acknowledge the limitations and disclaimers above.
            </label>
          </div>
        </div>

        <div className="md:col-span-2 pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading || !disclaimerAccepted}
            className="h-12 px-8 inline-flex items-center font-bold justify-center rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-zinc-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {pollStatus || 'Running Backtest Engine...'}
              </span>
            ) : 'Execute Backtest'}
          </button>
        </div>
      </form>
    </div>
  )
}
