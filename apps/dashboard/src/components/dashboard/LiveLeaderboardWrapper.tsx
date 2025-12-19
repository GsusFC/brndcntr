"use client"

import dynamic from "next/dynamic"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const LiveLeaderboard = dynamic(
    () => import("./LiveLeaderboard").then(mod => ({ default: mod.LiveLeaderboard })),
    {
        loading: () => (
            <Card className="rounded-xl p-6 h-[720px] bg-[#212020]/50 border-[#484E55]/50">
                <div className="flex items-center justify-between mb-5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20 bg-zinc-900" />
                </div>
                <div className="space-y-3">
                    {[...Array(10)].map((_, i) => (
                        <Skeleton key={i} className="h-14 rounded-lg bg-zinc-900" />
                    ))}
                </div>
            </Card>
        ),
        ssr: false
    }
)

export function LiveLeaderboardWrapper() {
    return <LiveLeaderboard />
}
