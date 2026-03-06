'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const formData = new URLSearchParams()
            formData.append('username', email)
            formData.append('password', password)

            const res = await api.post('/users/login', formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })

            localStorage.setItem('token', res.data.access_token)
            router.push('/dashboard')
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-130px)] px-4">
            <div className="w-full max-w-md p-8 rounded-2xl bg-zinc-900 border border-zinc-800">
                <h1 className="text-3xl font-bold text-center mb-6">Welcome Back</h1>
                {error && (
                    <div className="p-3 mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md">
                        {error}
                    </div>
                )}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-2 rounded-md bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-2 rounded-md bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-10 mt-2 flex items-center justify-center rounded-md bg-emerald-500 text-zinc-950 font-medium hover:bg-emerald-400 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Entering...' : 'Login'}
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-zinc-400">
                    Not registered? <Link href="/auth/register" className="text-emerald-400 hover:text-emerald-300">Sign up</Link>
                </p>
            </div>
        </div>
    )
}
