'use client'
import dynamic from 'next/dynamic'
const GraphViewer = dynamic(() => import('../../components/GraphViewer'), { ssr: false })

const mockElements = [
    { data: { id: 'a', label: 'Node A' } },
    { data: { id: 'b', label: 'Node B' } },
    { data: { id: 'ab', source: 'a', target: 'b', label: 'Edge A-B' } },
]

export default function GraphPage() {
    return (
        <div className="h-full">
            <GraphViewer elements={mockElements} />
        </div>
    )
}