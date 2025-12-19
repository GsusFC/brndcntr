"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

const DynamicChart = dynamic(
    () => import("./DynamicChart").then(mod => ({ default: mod.DynamicChart })),
    {
        loading: () => (
            <Skeleton className="h-64 rounded-xl bg-zinc-900" />
        ),
        ssr: false
    }
)

interface DynamicChartWrapperProps {
    type: "bar" | "line" | "pie" | "area" | "table"
    data: Record<string, unknown>[]
    xAxisKey?: string
    dataKey?: string
    title?: string
}

export function DynamicChartWrapper(props: DynamicChartWrapperProps) {
    return <DynamicChart {...props} />
}
