/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Ensure that trailing slashes are appended to matches, matching Hugo's directory-based structure
  trailingSlash: true,
};

export default nextConfig;
