import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.wgsl": {
        loaders: ["@vgpu/wgsl/loader-webpack"],
        as: "*.js",
      },
    },
  },
  // Keep the same WGSL pipeline available to `next build --webpack`. This is
  // also a useful production-build fallback when Turbopack's loader bridge is
  // unavailable in a restricted environment.
  webpack(config) {
    config.module.rules.push({
      test: /\.wgsl$/,
      loader: "@vgpu/wgsl/loader-webpack",
      options: { minify: true },
    })
    return config
  },
}

export default nextConfig
