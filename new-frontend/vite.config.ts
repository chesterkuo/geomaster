import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// CSP Configuration for Security
const cspConfig = {
  defaultSrc: ["'self'"],
  scriptSrc: [
    "'self'",
    "'unsafe-inline'", // Required for Vite HMR and React
    "'unsafe-eval'", // Required for development
    "https://apis.google.com",
    "https://cdn.jsdelivr.net"
  ],
  styleSrc: [
    "'self'",
    "'unsafe-inline'", // Required for CSS-in-JS and styled-components
    "https://fonts.googleapis.com",
    "https://cdn.jsdelivr.net"
  ],
  fontSrc: [
    "'self'",
    "https://fonts.gstatic.com",
    "data:"
  ],
  imgSrc: [
    "'self'",
    "data:",
    "https:",
    "blob:"
  ],
  connectSrc: [
    "'self'",
    "https://api-geo.blitzgame.site",
    "http://localhost:3000",
    "https://api.openai.com",
    "https://api.anthropic.com",
    "wss://api-geo.blitzgame.site",
    "ws://localhost:3000"
  ],
  mediaSrc: ["'self'"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
  upgradeInsecureRequests: []
};

// Convert CSP config to string
const cspString = Object.entries(cspConfig)
  .map(([directive, sources]) => {
    const directiveName = directive.replace(/([A-Z])/g, '-$1').toLowerCase();
    return `${directiveName} ${sources.join(' ')}`;
  })
  .join('; ');

// Security Headers Plugin
function securityHeadersPlugin() {
  return {
    name: 'security-headers',
    transformIndexHtml: {
      order: 'pre',
      handler(html: string, context: any) {
        const isDev = context.server;

        // Only add CSP in production build
        if (!isDev) {
          return html.replace(
            '<head>',
            `<head>
  <meta http-equiv="Content-Security-Policy" content="${cspString}">
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta http-equiv="X-Frame-Options" content="DENY">
  <meta http-equiv="X-XSS-Protection" content="1; mode=block">
  <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
  <meta http-equiv="Permissions-Policy" content="geolocation=(), camera=(), microphone=()">
  <meta name="robots" content="noindex, nofollow" />`
          );
        }

        return html;
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 3001,
  },
  plugins: [
    react(),
    // securityHeadersPlugin(), // Disabled to prevent conflicts with Cloudflare security headers
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Security configurations for production build
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        // Obfuscate chunk names for security
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
}));
