import assert from "node:assert";
import prisma from "@/lib/prisma";
import { isQuerySafe, sanitizeSQL } from "./sql-validator";

type QueryRow = Record<string, unknown>;

const isQueryRow = (value: unknown): value is QueryRow => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

export async function executeQuery(sql: string): Promise<{
    success: boolean;
    data?: QueryRow[];
    error?: string;
}> {
    const validation = isQuerySafe(sql);
    if (!validation.safe) {
        return {
            success: false,
            error: validation.reason || "Query is not safe",
        };
    }

    try {
        const cleanSQL = sanitizeSQL(sql);
        const resultsUnknown: unknown = await prisma.$queryRawUnsafe(cleanSQL);

        assert(Array.isArray(resultsUnknown), "Query result must be an array");
        const rowsUnknown = resultsUnknown as unknown[];
        assert(rowsUnknown.every(isQueryRow), "Query result rows must be objects");

        return {
            success: true,
            data: rowsUnknown as QueryRow[],
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Query execution failed";
        return {
            success: false,
            error: message,
        };
    }
}
