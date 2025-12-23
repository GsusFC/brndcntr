import { NextResponse } from "next/server"
import { unstable_cache } from "next/cache"
import prisma from "@/lib/prisma"
import prismaIndexer from "@/lib/prisma-indexer"

// Función cacheada que obtiene los stats
const getCachedStats = unstable_cache(
    async () => {
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const todayStartSec = Math.floor(todayStart.getTime() / 1000)
        const daySec = 60 * 60 * 24
        const weekStartSec = todayStartSec - 7 * daySec
        const monthStartSec = todayStartSec - 30 * daySec
        const twoWeeksAgoSec = todayStartSec - 14 * daySec

        // Ejecutar queries en paralelo para mayor velocidad
        const [
            monthVotes,
            weekVotes,
            lastWeekVotes,
            newUsersThisWeek,
            newUsersLastWeek,
            totalUsers,
        ] = await Promise.all([
            // Votos últimos 30 días (indexer)
            prismaIndexer.indexerVote.findMany({
                where: { timestamp: { gte: monthStartSec } },
                select: { fid: true, timestamp: true },
            }),
            // Votos esta semana (indexer)
            prismaIndexer.indexerVote.findMany({
                where: { timestamp: { gte: weekStartSec } },
                select: { fid: true, timestamp: true },
            }),
            // Votos semana pasada (retención) (indexer)
            prismaIndexer.indexerVote.findMany({
                where: { timestamp: { gte: twoWeeksAgoSec, lt: weekStartSec } },
                select: { fid: true },
            }),
            // Nuevos usuarios: primer voto dentro de los últimos 7 días (indexer)
            prismaIndexer.indexerVote.groupBy({
                by: ["fid"],
                _min: { timestamp: true },
                having: { timestamp: { _min: { gte: weekStartSec } } },
                _count: { _all: true },
            }),
            // Nuevos usuarios semana pasada: primer voto en (twoWeeksAgo, weekStart) (indexer)
            prismaIndexer.indexerVote.groupBy({
                by: ["fid"],
                _min: { timestamp: true },
                having: { timestamp: { _min: { gte: twoWeeksAgoSec, lt: weekStartSec } } },
                _count: { _all: true },
            }),
            // Total usuarios (indexer)
            prismaIndexer.indexerUser.count(),
        ])

        let trendingBrands: Array<{ id: number; name: string; imageUrl: string | null; scoreWeek: number }> = []
        let categories: Array<{ name: string; _count: { brands: number } }> = []

        try {
            ;[trendingBrands, categories] = await Promise.all([
                prisma.brand.findMany({
                    where: { banned: 0 },
                    orderBy: { scoreWeek: "desc" },
                    take: 5,
                    select: { id: true, name: true, imageUrl: true, scoreWeek: true },
                }),
                prisma.category.findMany({
                    select: { name: true, _count: { select: { brands: true } } },
                }),
            ])
        } catch {
            trendingBrands = []
            categories = []
        }

        // Procesar datos
        const votesPerDayMap = new Map<string, number>()
        monthVotes.forEach(v => {
            const timestampSec = Number(String(v.timestamp))
            if (!Number.isFinite(timestampSec)) {
                throw new Error("Invalid vote timestamp")
            }
            const dateStr = new Date(timestampSec * 1000).toISOString().split('T')[0]
            votesPerDayMap.set(dateStr, (votesPerDayMap.get(dateStr) || 0) + 1)
        })
        const votesPerDay = Array.from(votesPerDayMap.entries()).map(([date, count]) => ({ date, count }))

        // Top votantes
        const voterCounts = new Map<number, number>()
        weekVotes.forEach(v => {
            voterCounts.set(v.fid, (voterCounts.get(v.fid) || 0) + 1)
        })
        const topFids = Array.from(voterCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)

        let topUsers: Array<{ id: number; fid: number; username: string; photoUrl: string | null; points: number }> = []
        try {
            topUsers = await prisma.user.findMany({
                where: { fid: { in: topFids.map(([fid]) => fid) } },
                select: { id: true, fid: true, username: true, photoUrl: true, points: true },
            })
        } catch {
            topUsers = []
        }

        const topVoters = topFids.map(([fid, voteCount]) => {
            const user = topUsers.find(u => u.fid === fid)
            return {
                userId: user?.id ?? 0,
                voteCount,
                username: user?.username ?? `fid:${fid}`,
                photoUrl: user?.photoUrl ?? null,
                points: user?.points ?? 0,
            }
        })

        // Trending
        const trending = trendingBrands.map(b => ({
            id: b.id, name: b.name, imageUrl: b.imageUrl,
            thisWeek: b.scoreWeek, lastWeek: 0, growth: 100
        }))

        // Categorías
        const categoryDistribution = categories
            .filter(c => c._count.brands > 0)
            .map(c => ({ name: c.name, count: c._count.brands }))
            .sort((a, b) => b.count - a.count)

        // Engagement
        const activeUsersWeek = new Set(weekVotes.map(v => v.fid)).size
        const totalVotesWeek = weekVotes.length

        // Retención
        const lastWeekUsers = new Set(lastWeekVotes.map(v => v.fid))
        const thisWeekUsers = new Set(weekVotes.map(v => v.fid))
        const retained = Array.from(lastWeekUsers).filter(u => thisWeekUsers.has(u)).length
        const retentionRate = lastWeekUsers.size > 0 ? Math.round((retained / lastWeekUsers.size) * 100) : 0

        // Horas pico
        const hourCounts = new Map<number, number>()
        weekVotes.forEach(v => {
            const timestampSec = Number(String(v.timestamp))
            if (!Number.isFinite(timestampSec)) {
                throw new Error("Invalid vote timestamp")
            }
            const hour = new Date(timestampSec * 1000).getHours()
            hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
        })
        const votesByHour = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: hourCounts.get(i) || 0 }))

        return {
            votesPerDay,
            topVoters,
            trending,
            categoryDistribution,
            newUsers: {
                thisWeek: newUsersThisWeek.length,
                lastWeek: newUsersLastWeek.length,
                growth: newUsersLastWeek.length > 0
                    ? Math.round(((newUsersThisWeek.length - newUsersLastWeek.length) / newUsersLastWeek.length) * 100)
                    : newUsersThisWeek.length > 0 ? 100 : 0,
            },
            engagement: {
                totalUsers,
                activeUsersWeek,
                activeRate: totalUsers > 0 ? Math.round((activeUsersWeek / totalUsers) * 100) : 0,
                avgVotesPerUser: activeUsersWeek > 0 ? Math.round((totalVotesWeek / activeUsersWeek) * 10) / 10 : 0,
                retentionRate,
            },
            votesByHour,
        }
    },
    ['dashboard-stats'],
    { revalidate: 300, tags: ['dashboard'] }
)

export async function GET() {
    try {
        const stats = await getCachedStats()
        return NextResponse.json({
            ...stats,
            updatedAt: new Date().toISOString()
        })
    } catch (error) {
        console.error("Dashboard stats API error:", error)
        return NextResponse.json(
            { error: "Failed to fetch stats", details: error instanceof Error ? error.message : "Unknown" },
            { status: 500 }
        )
    }
}
