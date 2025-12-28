import "dotenv/config"
import { PrismaClient } from '@prisma/client'

const mysqlSourceDatabaseUrl = process.env.MYSQL_SOURCE_DATABASE_URL
if (!mysqlSourceDatabaseUrl) {
    throw new Error('MYSQL_SOURCE_DATABASE_URL is not defined')
}

const prismaRead = new PrismaClient({
    datasources: {
        db: {
            url: mysqlSourceDatabaseUrl,
        },
    },
})

declare global {
    var prismaReadGlobal: undefined | typeof prismaRead
}

const prisma = globalThis.prismaReadGlobal ?? prismaRead

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaReadGlobal = prisma
