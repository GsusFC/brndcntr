"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import html2canvas from "html2canvas"
import { Download, Loader2, RefreshCw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface LeaderboardEntry {
    id: number
    name: string
    imageUrl: string | null
    channel: string | null
    score: number
    gold: number
    silver: number
    bronze: number
    totalPodiums: number
}
const REFRESH_INTERVAL = 300000 // 300 segundos

const getRankSvgMarkup = (rank: number): string => {
    const segmentRects = {
        a: { x: 20, y: 6, w: 60, h: 14, rx: 7 },
        b: { x: 76, y: 18, w: 14, h: 50, rx: 7 },
        c: { x: 76, y: 78, w: 14, h: 50, rx: 7 },
        d: { x: 20, y: 124, w: 60, h: 14, rx: 7 },
        e: { x: 10, y: 78, w: 14, h: 50, rx: 7 },
        f: { x: 10, y: 18, w: 14, h: 50, rx: 7 },
        g: { x: 20, y: 66, w: 60, h: 14, rx: 7 },
    } as const

    type SegmentKey = keyof typeof segmentRects

    const digitSegments: Record<string, SegmentKey[]> = {
        0: ["a", "b", "c", "d", "e", "f"],
        1: ["b", "c"],
        2: ["a", "b", "g", "e", "d"],
        3: ["a", "b", "g", "c", "d"],
        4: ["f", "g", "b", "c"],
        5: ["a", "f", "g", "c", "d"],
        6: ["a", "f", "g", "e", "c", "d"],
        7: ["a", "b", "c"],
        8: ["a", "b", "c", "d", "e", "f", "g"],
        9: ["a", "b", "c", "d", "f", "g"],
    }

    const digits = String(rank).split("")
    const digitWidth = 100
    const digitHeight = 144
    const gap = 12
    const viewBoxWidth = digits.length * digitWidth + Math.max(0, digits.length - 1) * gap

    const svgHeight = 18
    const svgWidth = Math.max(10, Math.round((svgHeight * viewBoxWidth) / digitHeight))

    const svgContent = digits
        .map((digit, index) => {
            const segments = digitSegments[digit] ?? []
            const xOffset = index * (digitWidth + gap)

            const rects = segments
                .map((segmentKey) => {
                    const rect = segmentRects[segmentKey]
                    return `<rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" rx="${rect.rx}" fill="currentColor" />`
                })
                .join("")

            return `<g transform="translate(${xOffset} 0)">${rects}</g>`
        })
        .join("")

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${viewBoxWidth} ${digitHeight}" preserveAspectRatio="xMidYMid meet" style="display:block">${svgContent}</svg>`
}

const toSafeNumber = (value: unknown): number => {
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "bigint") return Number(value)
    if (typeof value === "string") {
        const n = Number(value)
        if (Number.isFinite(n)) return n
    }
    return 0
}

export function LiveLeaderboard() {
    const [data, setData] = useState<LeaderboardEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    const [seasonId, setSeasonId] = useState<number | null>(null)
    const [roundNumber, setRoundNumber] = useState<number | null>(null)
    const exportRef = useRef<HTMLDivElement>(null)

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch("/api/leaderboard", {
                cache: "no-store",
            })
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`)
            }
            const json = await res.json()
            if (json.data) {
                // Mapear totalVotes a totalPodiums para compatibilidad
                const mappedData: LeaderboardEntry[] = json.data.map((entry: Record<string, unknown>) => ({
                    id: toSafeNumber(entry.id),
                    name: typeof entry.name === "string" ? entry.name : "",
                    imageUrl: typeof entry.imageUrl === "string" ? entry.imageUrl : null,
                    channel: typeof entry.channel === "string" ? entry.channel : null,
                    score: toSafeNumber(entry.score),
                    gold: toSafeNumber(entry.gold),
                    silver: toSafeNumber(entry.silver),
                    bronze: toSafeNumber(entry.bronze),
                    totalPodiums: toSafeNumber(entry.totalVotes ?? entry.totalPodiums),
                }))
                setData(mappedData)
                setLastUpdated(new Date(json.updatedAt))
                setSeasonId(typeof json.seasonId === "number" ? json.seasonId : null)
                setRoundNumber(typeof json.roundNumber === "number" ? json.roundNumber : null)
            }
        } catch (error) {
            console.error("Failed to fetch leaderboard:", error)
            // No mostrar error en UI, simplemente mantener datos anteriores o vacíos
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, REFRESH_INTERVAL)
        return () => clearInterval(interval)
    }, [fetchData])

    const handleExportPNG = async () => {
        const element = exportRef.current
        if (!element) return
        setExporting(true)

        try {
            await document.fonts?.ready

            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: "#09090b",
                useCORS: true,
                allowTaint: true,
                ignoreElements: (node) => node.closest?.('[data-export-ignore="true"]') !== null,
            })

            const link = document.createElement("a")
            link.download = `brnd-leaderboard-${new Date().toISOString().split("T")[0]}.png`
            link.href = canvas.toDataURL("image/png")
            link.click()
        } catch (error) {
            console.error("Error exporting:", error)
        } finally {
            setExporting(false)
        }
    }

    const getRankBadge = (rank: number) => {
        const baseClasses = "w-8 h-8 rounded-full flex items-center justify-center font-black text-sm"
        switch (rank) {
            case 1:
                return `${baseClasses} bg-gradient-to-br from-yellow-400 to-yellow-600 text-black`
            case 2:
                return `${baseClasses} bg-gradient-to-br from-zinc-300 to-zinc-500 text-black`
            case 3:
                return `${baseClasses} bg-gradient-to-br from-amber-600 to-amber-800 text-white`
            default:
                return `${baseClasses} bg-zinc-800 text-zinc-400`
        }
    }

    if (loading) {
        return (
            <Card className="rounded-xl p-6 bg-[#212020]/50 border-[#484E55]/50">
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                </div>
            </Card>
        )
    }

    return (
        <Card ref={exportRef} className="rounded-xl p-6 bg-[#212020]/50 border-[#484E55]/50">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <span className="text-xl">🏆</span>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">BRND Week Leaderboard</h3>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-mono text-green-400">LIVE</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {seasonId !== null && (
                        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                            Season {String(seasonId).padStart(2, "0")}
                            {roundNumber !== null ? `  •  Round ${roundNumber}` : ""}
                        </span>
                    )}
                    {lastUpdated && (
                        <span className="text-[10px] font-mono text-zinc-600">
                            Updated {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                    <Button
                        onClick={fetchData}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-white"
                        title="Refresh"
                        data-export-ignore="true"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                        onClick={handleExportPNG}
                        disabled={exporting}
                        variant="secondary"
                        size="sm"
                        className="bg-white text-black hover:bg-zinc-200 font-bold text-xs"
                        data-export-ignore="true"
                    >
                        {exporting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <Download className="w-3 h-3" />
                        )}
                        PNG
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-zinc-800 overflow-hidden">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-zinc-900/50 border-b border-zinc-800 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    <div className="col-span-1">Rank</div>
                    <div className="col-span-4">Brand</div>
                    <div className="col-span-2 text-center">Score</div>
                    <div className="col-span-3 text-center">Vote Breakdown</div>
                    <div className="col-span-2 text-right">Total Votes</div>
                </div>

                {/* Data Rows */}
                <div className="divide-y divide-zinc-800/50">
                    {data.map((entry, index) => (
                        <Link
                            key={entry.id}
                            href={`/dashboard/brands/${entry.id}`}
                            className={`grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-zinc-900/50 transition-colors ${index < 3 ? "bg-zinc-900/30" : ""}`}
                        >
                            <div className="col-span-1">
                                <div className={getRankBadge(index + 1)}>
                                    <span className="sr-only">{index + 1}</span>
                                    <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: getRankSvgMarkup(index + 1) }} />
                                </div>
                            </div>
                            <div className="col-span-4 flex items-center gap-2">
                                {entry.imageUrl ? (
                                    <Image
                                        src={entry.imageUrl}
                                        alt={entry.name}
                                        width={28}
                                        height={28}
                                        className="rounded-md ring-1 ring-zinc-800"
                                    />
                                ) : (
                                    <div className="w-7 h-7 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-600 text-xs font-bold">
                                        {entry.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="text-sm text-white font-medium truncate">{entry.name}</p>
                                    {entry.channel && (
                                        <p className="text-[10px] font-mono text-zinc-600 truncate">/{entry.channel}</p>
                                    )}
                                </div>
                            </div>
                            <div className="col-span-2 text-center">
                                <span className={`text-sm font-black font-mono ${
                                    index === 0 ? "text-yellow-400" : 
                                    index === 1 ? "text-zinc-300" : 
                                    index === 2 ? "text-amber-500" : 
                                    "text-white"
                                }`}>
                                    {entry.score.toLocaleString()}
                                </span>
                            </div>
                            <div className="col-span-3 flex items-center justify-center gap-3 text-xs font-mono">
                                <span className="flex items-center gap-1 min-w-[40px]">
                                    <span>🥇</span>
                                    <span className="text-zinc-400">{entry.gold.toLocaleString()}</span>
                                </span>
                                <span className="flex items-center gap-1 min-w-[40px]">
                                    <span>🥈</span>
                                    <span className="text-zinc-500">{entry.silver.toLocaleString()}</span>
                                </span>
                                <span className="flex items-center gap-1 min-w-[40px]">
                                    <span>🥉</span>
                                    <span className="text-zinc-600">{entry.bronze.toLocaleString()}</span>
                                </span>
                            </div>
                            <div className="col-span-2 text-right">
                                <span className="text-sm text-zinc-400 font-mono">
                                    {entry.totalPodiums.toLocaleString()}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </Card>
    )
}
