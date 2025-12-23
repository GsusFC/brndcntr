"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import html2canvas from "html2canvas"
import { Download, Loader2, RefreshCw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getRankSvgString } from "@/utils/rank-badges"

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

const EXPORT_WIDTH = 1150
const EXPORT_HEIGHT = 960

const escapeHtml = (value: string): string => {
    return value.replace(/[&<>"']/g, (char) => {
        switch (char) {
            case "&":
                return "&amp;"
            case "<":
                return "&lt;"
            case ">":
                return "&gt;"
            case '"':
                return "&quot;"
            case "'":
                return "&#39;"
            default:
                return char
        }
    })
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
        setExporting(true)

        try {
            const padding = 32
            const headerMinHeight = 54
            const rowMinHeight = 52
            const contentMinHeight = headerMinHeight + data.length * rowMinHeight
            const exportHeight = Math.max(EXPORT_HEIGHT, padding * 2 + contentMinHeight)

            const tempContainer = document.createElement("div")
            tempContainer.style.position = "absolute"
            tempContainer.style.left = "-9999px"
            tempContainer.style.width = `${EXPORT_WIDTH}px`
            tempContainer.style.height = `${exportHeight}px`
            tempContainer.style.backgroundColor = "#09090b" // zinc-950
            tempContainer.style.padding = `${padding}px`
            tempContainer.style.fontFamily = "system-ui, -apple-system, sans-serif"
            tempContainer.style.boxSizing = "border-box"
            document.body.appendChild(tempContainer)

            tempContainer.innerHTML = `
                <div style="width: 100%; height: 100%; display: flex; flex-direction: column; box-sizing: border-box;">
                    <div style="border: 1px solid #27272a; border-radius: 16px; overflow: hidden; background: #09090b;">
                        <div style="display: grid; grid-template-columns: 70px 1fr 130px 220px 110px; gap: 16px; padding: 18px 28px; background: rgba(24, 24, 27, 0.5); border-bottom: 1px solid #27272a; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #71717a;">
                            <div>Rank</div>
                            <div>Brand</div>
                            <div style="text-align: center;">Score</div>
                            <div style="text-align: center;">Podium Breakdown</div>
                            <div style="text-align: right;">Total Podiums</div>
                        </div>
                        ${data
                            .map((entry, idx) => {
                                const safeName = escapeHtml(entry.name)
                                const safeImageUrl = entry.imageUrl ? escapeHtml(entry.imageUrl) : null
                                const safeInitial = escapeHtml(entry.name.charAt(0).toUpperCase())

                                const rankSvg = encodeURIComponent(getRankSvgString(idx + 1, 36))
                                const scoreColor = idx === 0 ? "#facc15" : idx === 1 ? "#d4d4d8" : idx === 2 ? "#fbbf24" : "#ffffff"
                                const borderBottom = idx < data.length - 1 ? "border-bottom: 1px solid rgba(39, 39, 42, 0.5);" : ""
                                const rowBg = idx < 3 ? "background: rgba(24, 24, 27, 0.3);" : ""

                                return `
                                    <div style="display: grid; grid-template-columns: 70px 1fr 130px 220px 110px; gap: 16px; padding: 16px 28px; align-items: center; ${borderBottom} ${rowBg} box-sizing: border-box;">
                                        <div style="display: flex; align-items: center; justify-content: flex-start;">
                                            <img src="data:image/svg+xml;charset=utf-8,${rankSvg}" style="width: 36px; height: 36px; display: block;" />
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                                            ${safeImageUrl
                                                ? `<img src="${safeImageUrl}" style="width: 36px; height: 36px; border-radius: 8px; border: 1px solid #27272a;" crossorigin="anonymous" />`
                                                : `<div style="width: 36px; height: 36px; border-radius: 8px; background: #27272a; display: flex; align-items: center; justify-content: center; color: #71717a; font-weight: 700; font-size: 14px;">${safeInitial}</div>`}
                                            <div style="min-width: 0; flex: 1;">
                                                <p style="font-weight: 700; color: #ffffff; margin: 0; font-size: 14px; line-height: 1.2; overflow-wrap: break-word; word-break: break-word;">${safeName}</p>
                                            </div>
                                        </div>
                                        <div style="text-align: center;">
                                            <span style="font-size: 16px; font-weight: 900; color: ${scoreColor};">${entry.score.toLocaleString()}</span>
                                        </div>
                                        <div style="display: flex; align-items: center; justify-content: center; gap: 14px; font-size: 13px;">
                                            <span style="display: flex; align-items: center; gap: 4px;">
                                                <span>🥇</span>
                                                <span style="color: #d4d4d8;">${entry.gold.toLocaleString()}</span>
                                            </span>
                                            <span style="display: flex; align-items: center; gap: 4px;">
                                                <span>🥈</span>
                                                <span style="color: #a1a1aa;">${entry.silver.toLocaleString()}</span>
                                            </span>
                                            <span style="display: flex; align-items: center; gap: 4px;">
                                                <span>🥉</span>
                                                <span style="color: #71717a;">${entry.bronze.toLocaleString()}</span>
                                            </span>
                                        </div>
                                        <div style="text-align: right;">
                                            <span style="color: #a1a1aa; font-weight: 600; font-size: 13px;">${entry.totalPodiums.toLocaleString()}</span>
                                        </div>
                                    </div>
                                `
                            })
                            .join("")}
                    </div>
                </div>
            `

            await new Promise((resolve) => setTimeout(resolve, 500))

            const measuredHeight = Math.max(exportHeight, tempContainer.scrollHeight)
            tempContainer.style.height = `${measuredHeight}px`

            const canvas = await html2canvas(tempContainer, {
                width: EXPORT_WIDTH,
                height: measuredHeight,
                scale: 2,
                backgroundColor: "#09090b",
                useCORS: true,
                allowTaint: true,
            })

            const link = document.createElement("a")
            link.download = `brnd-leaderboard-${new Date().toISOString().split("T")[0]}.png`
            link.href = canvas.toDataURL("image/png")
            link.click()

            document.body.removeChild(tempContainer)
        } catch (error) {
            console.error("Error exporting:", error)
        } finally {
            setExporting(false)
        }
    }

    const getRankBadge = (rank: number) => {
        const baseClasses = "w-8 h-8 rounded-full flex items-center justify-center font-display font-black text-sm"
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
        <Card className="rounded-xl p-6 bg-[#212020]/50 border-[#484E55]/50">
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
                                    <span aria-hidden="true" className="leading-none">
                                        {index + 1}
                                    </span>
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
