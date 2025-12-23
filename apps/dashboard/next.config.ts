import type { NextConfig } from "next";
import { existsSync } from "fs";
import path from "path";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const resolvePackageDir = (pkgName: string): string => {
  const workspacePath = path.resolve(__dirname, `node_modules/${pkgName}`)
  if (existsSync(workspacePath)) return workspacePath

  const rootPath = path.resolve(__dirname, `../../node_modules/${pkgName}`)
  if (existsSync(rootPath)) return rootPath

  throw new Error(`Cannot resolve ${pkgName} from workspace or root node_modules`)
}

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Externalize Prisma for serverless compatibility
  serverExternalPackages: ['@prisma/client', '@prisma/client-write', '@prisma/client-indexer'],
  // Webpack config
  webpack: (config, { isServer }) => {
    config.resolve = config.resolve ?? {}
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Ignore optional wagmi connector dependencies
    config.externals = config.externals || [];

    config.resolve.alias = {
      ...config.resolve.alias,
      'porto/internal': false,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
      '@metamask/sdk': resolvePackageDir('@metamask/sdk'),
      '@walletconnect/ethereum-provider': resolvePackageDir('@walletconnect/ethereum-provider'),
    };

    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@gemini-wallet/core': false,
        'porto': false,
      };
    }

    return config;
  },
};

export default withNextIntl(nextConfig);
