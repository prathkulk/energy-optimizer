/** @type {import('next').NextConfig} */
const nextConfig = {
	output: "standalone",

	// Disable strict checks if needed (remove after fixing issues)
	typescript: {
		ignoreBuildErrors: false, // Set to true temporarily if needed
	},
	eslint: {
		ignoreDuringBuilds: false, // Set to true temporarily if needed
	},

	// Image configuration
	images: {
		unoptimized: false,
	},

	// React strict mode
	reactStrictMode: true,

	// Environment variables validation (optional)
	env: {
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
	},
};

module.exports = nextConfig;
