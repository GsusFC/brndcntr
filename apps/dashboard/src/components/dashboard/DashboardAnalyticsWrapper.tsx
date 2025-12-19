"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

const DashboardAnalytics = dynamic(
    () => import("./DashboardAnalytics").then(mod => ({ default: mod.DashboardAnalytics })),
    {
        loading: () => (
            <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="rounded-xl bg-zinc-900 h-24" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="rounded-xl bg-zinc-900 h-80" />
                    <Skeleton className="rounded-xl bg-zinc-900 h-80" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="rounded-xl bg-zinc-900 h-64" />
                    <Skeleton className="rounded-xl bg-zinc-900 h-64" />
                    <Skeleton className="rounded-xl bg-zinc-900 h-64" />
                </div>
            </div>
        ),
        ssr: false
    }
)

export function DashboardAnalyticsWrapper() {
    return <DashboardAnalytics />
}
