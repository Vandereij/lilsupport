const nextConfig = {
experimental: {
serverActions: {
allowedOrigins: [process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000']
}
},
images: {
remotePatterns: [
{ protocol: 'https', hostname: '**.supabase.co' }
]
}
}
module.exports = nextConfig