/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...existing config...
  images: {
    // ...existing images config...
    remotePatterns: [
      // ...existing patterns...
      { protocol: 'https', hostname: 'ipfs.io', pathname: '/ipfs/**' },
      { protocol: 'https', hostname: 'cloudflare-ipfs.com', pathname: '/ipfs/**' },
      { protocol: 'https', hostname: 'gateway.pinata.cloud', pathname: '/ipfs/**' },
      { protocol: 'https', hostname: 'nftstorage.link', pathname: '/ipfs/**' },
      { protocol: 'https', hostname: 'dweb.link', pathname: '/ipfs/**' },
      // Storacha subdomain gateway: https://<CID>.ipfs.storacha.link/<path>
      { protocol: 'https', hostname: '*.ipfs.storacha.link', pathname: '/**' },
      { protocol: 'https', hostname: 'ipfs.storacha.link', pathname: '/**' },
    ],
  },
};

module.exports = nextConfig;