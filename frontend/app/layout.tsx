import './globals.css'
import { Inter } from 'next/font/google'
import { Sidebar } from './components/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'LinkWeaver Graph App',
  description: 'A graph visualization frontend powered by Dgraph + Cytoscape.js'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className + ' flex h-screen overflow-hidden'}>
        <Sidebar />
        <main className="flex-1 p-4 overflow-auto">
          {children}
        </main>
      </body>
    </html>
  )
}