'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function Navigation() {
    const router = useRouter()
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        // Check if user is logged in
        const token = localStorage.getItem('token')
        if (token) {
            setIsAuthenticated(true)
        }
    }, [])

    if (!isMounted) return <div className="w-[200px] h-9 ml-4"></div>

    const handleLogout = () => {
        localStorage.removeItem('token')
        setIsAuthenticated(false)
        router.push('/')
    }

    return (
        <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">
                Dashboard
            </Link>
            <div className="flex items-center gap-4 ml-4">
                {isAuthenticated ? (
                    <>
                        <Link href="/dashboard/profile" className="text-zinc-400 hover:text-white transition-colors mr-2">
                            Profile
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="text-zinc-400 hover:text-red-400 transition-colors"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link href="/auth/login" className="text-zinc-400 hover:text-white transition-colors">
                            Login
                        </Link>
                        <Link href="/auth/register" className="h-9 px-4 inline-flex items-center justify-center rounded-md bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition-colors">
                            Sign Up
                        </Link>
                    </>
                )}
            </div>
        </nav>
    )
}
