'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Sparkles, ArrowRight } from 'lucide-react'

export default function TopPicks({ simParams }: { simParams: any }) {
    const [picks, setPicks] = useState<{ ticker: string, weight: number }[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const fetchPicks = async () => {
        setLoading(true)
        setError('')
        try {
            // we pass the current simParams so it uses the same universe, lookback, strategy type
            const res = await api.post('/simulations/top-picks', simParams)
            setPicks(res.data.picks || [])
        } catch (err: any) {
            setError('Could not load top picks')
        } finally {
            setLoading(false)
        }
    }

    // Auto-fetch picks when the component mounts or important params change
    useEffect(() => {
        fetchPicks()
    }, [
        simParams.strategy_type,
        simParams.lookback_period,
        simParams.portfolio_size,
        simParams.universe,
        simParams.weighting_scheme,
        simParams.absolute_momentum_threshold
    ])

    return (
        <div className="bg-zinc-900/40 p-6 rounded-xl border border-zinc-800 mb-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center text-white">
                    <Sparkles className="w-5 h-5 mr-2 text-emerald-400" />
                    Today's Top Picks
                </h2>
                <div className="text-sm text-zinc-400">
                    Based on your active configuration
                </div>
            </div>

            {error ? (
                <div className="text-sm text-red-400">{error}</div>
            ) : loading ? (
                <div className="flex gap-2 animate-pulse">
                    {[...Array(Math.min(simParams.portfolio_size, 5))].map((_, i) => (
                        <div key={i} className="h-8 w-16 bg-zinc-800 rounded"></div>
                    ))}
                </div>
            ) : picks.length > 0 ? (
                <div className="flex flex-wrap gap-3 mt-4">
                    {picks.map((p) => (
                        <div key={p.ticker} className="flex flex-col items-center bg-zinc-800/50 px-4 py-2 rounded-lg border border-zinc-700/50">
                            <span className="text-emerald-400 font-bold text-lg leading-tight">{p.ticker}</span>
                            <span className="text-zinc-400 text-xs mt-1 bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-800">
                                {(p.weight * 100).toFixed(1)}%
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-sm text-zinc-500 italic mt-4">100% Cash Allocation (Absolute Momentum filter triggered)</div>
            )}
        </div>
    )
}
