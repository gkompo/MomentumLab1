'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { User, Activity, Clock, Trash2, Edit2 } from 'lucide-react'

export default function ProfilePage() {
    const router = useRouter()
    const [simulations, setSimulations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [userEmail, setUserEmail] = useState('Investor')

    // Simulate an avatar using generic UI or DiceBear
    const avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${userEmail}`

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                // In a real app we'd have a /users/me endpoint, but for now we extract email from token or state
                // We'll just fetch simulations
                const res = await api.get('/simulations/')
                setSimulations(res.data)

                // Decode token to get email if possible, or just default
                const token = localStorage.getItem('token')
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]))
                        if (payload.sub) setUserEmail(payload.sub)
                    } catch (e) { }
                }
            } catch (err: any) {
                if (err.response?.status === 401) {
                    router.push('/auth/login')
                } else {
                    setError('Failed to load history.')
                }
            } finally {
                setLoading(false)
            }
        }

        fetchProfileData()
    }, [router])

    const loadSimulation = (sim: any) => {
        // Mock rebuilding the result object so the Results page can parse it
        const resultData = {
            ...sim,
            // Usually walk_forward and monte_carlo would be here, but we skipped storing them in SQLite to save space
        }
        sessionStorage.setItem('currentSimResult', JSON.stringify(resultData))
        router.push('/dashboard/results')
    }

    const saveName = async (id: number, currentName: string) => {
        const newName = prompt('Enter a name for this simulation:', currentName || '')
        if (newName !== null) {
            try {
                await api.post(`/simulations/save/${id}`, { name: newName })
                setSimulations(sims => sims.map(s => s.id === id ? { ...s, name: newName } : s))
            } catch (err) {
                alert('Failed to save name')
            }
        }
    }

    return (
        <div className="w-full pb-20">
            <div className="mb-10 flex items-center justify-between border-b border-zinc-800 pb-8">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-emerald-500 overflow-hidden flex items-center justify-center">
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold mb-1">Investor Profile</h1>
                        <p className="text-zinc-400 flex items-center">
                            <User className="w-4 h-4 mr-2" /> {userEmail}
                        </p>
                    </div>
                </div>
            </div>

            <h2 className="text-xl font-bold mb-6 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-emerald-500" />
                Simulation History
            </h2>

            {error && <div className="text-red-400 mb-4">{error}</div>}

            {loading ? (
                <div className="text-zinc-400">Loading history...</div>
            ) : simulations.length === 0 ? (
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-10 text-center">
                    <Clock className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No backtests yet</h3>
                    <p className="text-zinc-400 mb-6">Run your first momentum strategy to see it here.</p>
                    <button onClick={() => router.push('/dashboard')} className="text-emerald-400 hover:text-emerald-300 font-medium">
                        Go to Dashboard &rarr;
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {simulations.map((sim) => (
                        <div key={sim.id} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl flex items-center justify-between hover:border-zinc-700 transition-colors">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-bold text-lg text-white">
                                        {sim.name || `${sim.strategy_type.toUpperCase()} Momentum`}
                                    </h3>
                                    <button onClick={() => saveName(sim.id, sim.name)} className="text-zinc-500 hover:text-zinc-300">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-6 text-sm text-zinc-400">
                                    <span>{sim.universe.toUpperCase()}</span>
                                    <span>{sim.lookback_period}M Lookback</span>
                                    <span>{sim.rebalance_frequency} Rebalance</span>
                                    <span>{new Date(sim.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => loadSimulation(sim)}
                                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-md transition-colors"
                                >
                                    View Results
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
