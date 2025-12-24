import { PrismaClient } from '@prisma/client'

declare global {
    var prismaWriteGlobal: PrismaClient | undefined
}

const getPrismaWriteClient = (): PrismaClient => {
    const existing = globalThis.prismaWriteGlobal
    if (existing) return existing

    const client = new PrismaClient()

    if (process.env.NODE_ENV !== 'production') globalThis.prismaWriteGlobal = client
    return client
}

const prismaWrite = new Proxy({} as PrismaClient, {
    get(_target, prop) {
        if (!process.env.MYSQL_DATABASE_URL) {
            throw new Error('MYSQL_DATABASE_URL is not defined')
        }

        const client = getPrismaWriteClient() as unknown as Record<PropertyKey, unknown>
        return client[prop]
    },
})

export default prismaWrite
