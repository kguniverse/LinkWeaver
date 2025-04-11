'use client'
import Link from 'next/link'

export function Sidebar() {
    return (
        <aside className="w-64 bg-gray-100 p-4 space-y-4 border-r">
            <h2 className="text-xl font-semibold">LinkWeaver</h2>
            <nav className="space-y-2">
                <Link href="/" className="block hover:text-blue-600">Home</Link>
                <Link href="/graph" className="block hover:text-blue-600">Graph</Link>
            </nav>
        </aside>
    )
}