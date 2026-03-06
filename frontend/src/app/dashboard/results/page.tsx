'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Download, AlertTriangle, ArrowLeft } from 'lucide-react'

export default function ResultsPage() {
    const router = useRouter()
    const reportRef = useRef<HTMLDivElement>(null)
    const [resultData, setResultData] = useState<any>(null)
    const [isExporting, setIsExporting] = useState(false)

    useEffect(() => {
        const data = sessionStorage.getItem('currentSimResult')
        if (data) {
            setResultData(JSON.parse(data))
        } else {
            router.push('/dashboard')
        }
    }, [router])

    if (!resultData) return <div className="p-8 text-center text-zinc-400">Loading results...</div>

    // Parse stored JSON strings
    const metrics = JSON.parse(resultData.portfolio_metrics)
    const securities = JSON.parse(resultData.selected_securities || '[]')

    // Format history for Recharts
    // { '2020-01-31': 100000, '2020-02-28': 105000 }
    const parsedValues = typeof resultData.portfolio_values === 'string' ? JSON.parse(resultData.portfolio_values) : resultData.portfolio_values || {};
    const equityCurve = Object.entries(parsedValues).map(([date, value]) => ({
        date: String(date).split(' ')[0],
        value: Number(value)
    }))

    const exportPDF = async () => {
        setIsExporting(true)
        // Give a tiny buffer for React state purely for the button loader visual
        setTimeout(() => {
            window.print()
            setIsExporting(false)
        }, 300)
    }

    return (
        <div className="w-full pb-20 print:pb-0 print:bg-zinc-950 print:text-zinc-100">
            <div className="mb-6 flex items-center justify-between border-b border-zinc-800 pb-6 print:hidden">
                <div>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center text-sm text-zinc-400 hover:text-white mb-2 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold mb-2">Simulation Results</h1>
                    <p className="text-zinc-400">Research output for {resultData.strategy_type.toUpperCase()} Momentum ({resultData.lookback_period}-Month Lookback)</p>
                </div>
                <button
                    onClick={exportPDF}
                    disabled={isExporting}
                    className="h-10 px-4 inline-flex items-center justify-center rounded-md bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors border border-zinc-700 disabled:opacity-50"
                >
                    <Download className="w-4 h-4 mr-2" />
                    {isExporting ? 'Preparing...' : 'Print / Export PDF'}
                </button>
            </div>

            <div ref={reportRef} className="bg-zinc-950 p-6 rounded-xl border border-zinc-800/50 print:border-none print:p-0 print:shadow-none">
                {/* Disclaimers inside the PDF view */}
                <div className="mb-8 p-6 bg-red-500/10 border-2 border-red-500/50 rounded-lg flex items-start text-red-500/90 text-sm">
                    <AlertTriangle className="w-8 h-8 mr-4 shrink-0 mt-0.5 text-red-500" />
                    <div>
                        <p className="font-bold text-lg mb-2 text-red-500">CRITICAL LEGAL & RESEARCH DISCLAIMERS</p>
                        <ul className="text-zinc-300 list-disc pl-5 space-y-2 font-medium">
                            <li><strong>SURVIVORSHIP BIAS:</strong> Results might be <strong>INFLATED</strong> due to "today's winners" constituents in indexes and <strong>NO DELISTED STOCKS</strong> being perfectly captured.</li>
                            <li><strong>PERFECT FILLS:</strong> Backtests operate on the assumption of <strong>PERFECT FILLS</strong> at closing prices. Real-world execution will suffer from spread and market impact.</li>
                            <li><strong>ALWAYS ERR ON THE CONSERVATIVE SIDE</strong> when evaluating these hypothetical performance metrics - this does not constitute financial advice!</li>
                            <li><strong>YAHOO LOOPHOLE & DATA USAGE:</strong> To ensure no legal problems, this tool strictly acts as a client-side proxy. Price data is fetched <strong>EPHEMERALLY</strong> via Yahoo Finance endpoints for live calculation and is <strong>NOT PERMANENTLY STORED</strong>. This operates strictly as temporary caching for personal research.</li>
                        </ul>
                    </div>
                </div>

                {/* Analytics Grid */}
                <h2 className="text-xl font-bold mb-4 border-b border-zinc-800 pb-2">Institutional Metrics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <MetricCard title="CAGR" value={`${(metrics.cagr * 100).toFixed(2)}%`} />
                    <MetricCard title="Sharpe Ratio" value={metrics.sharpe_ratio.toFixed(2)} />
                    <MetricCard title="Sortino Ratio" value={metrics.sortino_ratio.toFixed(2)} />
                    <MetricCard title="Max Drawdown" value={`${(metrics.max_drawdown * 100).toFixed(2)}%`} isNegative={true} />

                    <MetricCard title="Volatility (Ann.)" value={`${(metrics.volatility * 100).toFixed(2)}%`} />
                    <MetricCard title="Total Return" value={`${(metrics.total_return * 100).toFixed(2)}%`} />
                    <MetricCard title="Win Rate" value={metrics.win_rate ? `${(metrics.win_rate * 100).toFixed(2)}%` : 'N/A'} />
                    <MetricCard title="Skewness / Kurtosis" value={`${metrics.skewness.toFixed(2)} / ${metrics.kurtosis.toFixed(2)}`} />
                </div>

                {metrics.alpha !== undefined && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <MetricCard title="Alpha vs Benchmark (Ann.)" value={`${(metrics.alpha * 100).toFixed(2)}%`} />
                        <MetricCard title="Beta vs Benchmark" value={metrics.beta ? metrics.beta.toFixed(2) : 'N/A'} />
                        <MetricCard title="Information Ratio" value={metrics.information_ratio ? metrics.information_ratio.toFixed(2) : 'N/A'} />
                    </div>
                )}

                {/* Advanced Analytics / Robustness Grid */}
                {resultData.robustness && (
                    <>
                        <h2 className="text-xl font-bold mb-4 border-b border-zinc-800 pb-2 mt-8 text-indigo-400">Robustness & Stress Tests</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <MetricCard title="Immediate Crash Value (-20%)" value={`$${(resultData.robustness.immediate_20pct_crash_value).toLocaleString()}`} isNegative={true} />
                            <MetricCard title="Start Date Sensitivity (5th Pct)" value={`${(resultData.robustness.cagr_from_random_starts_p5 * 100).toFixed(2)}%`} />
                            <MetricCard title="Start Date Sensitivity (95th Pct)" value={`${(resultData.robustness.cagr_from_random_starts_p95 * 100).toFixed(2)}%`} />
                        </div>
                    </>
                )}

                {/* Regime Analysis & Factor Exposure */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    {metrics.regime_analysis && metrics.regime_analysis.bull && (
                        <div>
                            <h2 className="text-xl font-bold mb-4 border-b border-zinc-800 pb-2 text-emerald-400">Regime Performance (vs. SPY)</h2>
                            <div className="space-y-3">
                                <div className="p-3 bg-zinc-900/50 rounded flex justify-between rounded-lg border border-zinc-800/50">
                                    <span className="font-medium text-emerald-400">Bull Market CAGR / Vol:</span>
                                    <span>{(metrics.regime_analysis.bull.cagr * 100).toFixed(2)}% / {(metrics.regime_analysis.bull.volatility * 100).toFixed(2)}%</span>
                                </div>
                                <div className="p-3 bg-zinc-900/50 rounded flex justify-between rounded-lg border border-zinc-800/50">
                                    <span className="font-medium text-red-400">Bear Market CAGR / Vol:</span>
                                    <span>{(metrics.regime_analysis.bear.cagr * 100).toFixed(2)}% / {(metrics.regime_analysis.bear.volatility * 100).toFixed(2)}%</span>
                                </div>
                                <div className="p-3 bg-zinc-900/50 rounded flex justify-between rounded-lg border border-zinc-800/50">
                                    <span className="font-medium text-yellow-500">Sideways Market CAGR / Vol:</span>
                                    <span>{(metrics.regime_analysis.sideways.cagr * 100).toFixed(2)}% / {(metrics.regime_analysis.sideways.volatility * 100).toFixed(2)}%</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {metrics.factor_exposure && (
                        <div>
                            <h2 className="text-xl font-bold mb-4 border-b border-zinc-800 pb-2 text-cyan-400">Proxy Factor Exposures</h2>
                            <div className="space-y-4 pt-2">
                                <div>
                                    <div className="flex justify-between text-sm mb-1"><span className="text-zinc-400">Market Beta (SPY)</span> <span className="font-mono">{metrics.factor_exposure.market_beta.toFixed(2)}</span></div>
                                    <div className="w-full bg-zinc-800 rounded-full h-2">
                                        <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${Math.min(Math.max((metrics.factor_exposure.market_beta / 2) * 100, 0), 100)}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1"><span className="text-zinc-400">Size Factor Proxy Beta</span> <span className="font-mono">{metrics.factor_exposure.size_smb_beta.toFixed(2)}</span></div>
                                    <div className="w-full bg-zinc-800 rounded-full h-2">
                                        <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${Math.min(Math.max((metrics.factor_exposure.size_smb_beta + 1) * 50, 0), 100)}%` }}></div>
                                    </div>
                                    <p className="text-xs text-zinc-600 mt-1">Right = Small Cap Tilt. Left = Large Cap Tilt.</p>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1"><span className="text-zinc-400">Value Factor Proxy Beta</span> <span className="font-mono">{metrics.factor_exposure.value_hml_beta.toFixed(2)}</span></div>
                                    <div className="w-full bg-zinc-800 rounded-full h-2">
                                        <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${Math.min(Math.max((metrics.factor_exposure.value_hml_beta + 1) * 50, 0), 100)}%` }}></div>
                                    </div>
                                    <p className="text-xs text-zinc-600 mt-1">Right = Value Tilt. Left = Growth Tilt.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Equity Curve Chart */}
                <h2 className="text-xl font-bold mb-4 border-b border-zinc-800 pb-2 flex justify-between items-center">
                    Portfolio Equity Curve
                    <span className="text-sm font-normal text-zinc-500">Initial Capital: ${resultData.initial_capital.toLocaleString()}</span>
                </h2>
                <div className="h-[400px] w-full mb-10 border border-zinc-800/50 rounded-lg p-4 bg-zinc-900/20">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={equityCurve} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#52525b"
                                fontSize={12}
                                tickFormatter={(str) => {
                                    const date = new Date(str);
                                    return `${date.getMonth() + 1}/${date.getFullYear()}`;
                                }}
                            />
                            <YAxis
                                stroke="#52525b"
                                fontSize={12}
                                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                                domain={['auto', 'auto']}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                                formatter={(value: any) => [`$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, 'Equity']}
                            />
                            <ReferenceLine y={resultData.initial_capital} stroke="#52525b" strokeDasharray="3 3" />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6, fill: '#10b981' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Latest Allocation */}
                <h2 className="text-xl font-bold mb-4 border-b border-zinc-800 pb-2">Latest Model Allocation</h2>
                <div className="bg-zinc-900/30 rounded-lg border border-zinc-800 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-zinc-400 bg-zinc-900/80 uppercase">
                            <tr>
                                <th className="px-6 py-4 font-medium">Rank</th>
                                <th className="px-6 py-4 font-medium">Security (Ticker)</th>
                                <th className="px-6 py-4 font-medium text-right">Target Weight</th>
                            </tr>
                        </thead>
                        <tbody>
                            {securities.length > 0 ? (
                                securities.map((ticker: string, idx: number) => (
                                    <tr key={idx} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20">
                                        <td className="px-6 py-3 font-medium text-zinc-300">#{idx + 1}</td>
                                        <td className="px-6 py-3 font-bold text-white">{ticker}</td>
                                        <td className="px-6 py-3 text-right text-emerald-400">{((1 / securities.length) * 100).toFixed(2)}%</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">
                                        Absolute Momentum Filter Triggered — 100% Cash Allocation
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function MetricCard({ title, value, isNegative = false }: { title: string, value: string | number, isNegative?: boolean }) {
    return (
        <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
            <div className="text-sm text-zinc-400 mb-1">{title}</div>
            <div className={`text-2xl font-bold ${isNegative ? 'text-red-400' : 'text-zinc-100'}`}>{value}</div>
        </div>
    )
}
