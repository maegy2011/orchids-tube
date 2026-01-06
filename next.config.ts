import type { NextConfig } from "next";
import path from "node:path";

const LOADER = path.resolve(__dirname, 'src/visual-edits/component-tagger-loader.js');

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'youtubei.js',
    'youtube-sr',
    'youtube-search-api',
    'youtube-search-without-api-key',
    'yt-search',
    'youtube-dl-exec',
    'ruhend-scraper',
    'jocles',
    'distube',
    'node-fetch',
    'youtube-po-token-generator'
  ],
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
  outputFileTracingRoot: path.resolve(__dirname, '../../'),
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  turbopack: {
    rules: {
      "*.{jsx,tsx}": {
        loaders: [LOADER]
      }
    }
  }
};

export default nextConfig;
// Orchids restart: 1767732217326
