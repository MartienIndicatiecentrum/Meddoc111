import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { spawn } from "child_process";

// Auto-start services plugin
const autoStartServices = () => {
  let started = false;

  return {
    name: 'auto-start-services',
    configureServer(server) {
      if (!started) {
        started = true;
        console.log('🚀 Checking backend services...');

        const startScript = spawn('node', ['auto-start-services.js'], {
          stdio: 'inherit',
          cwd: process.cwd()
        });

        startScript.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Backend services ready');
          } else {
            console.warn('⚠️  Some services may not have started properly');
            console.log('   Check the logs above for details');
          }
        });

        startScript.on('error', (err) => {
          console.error('❌ Failed to start services:', err.message);
          console.log('   Try running "npm run dev:all" for manual start');
        });
      }
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = [
    autoStartServices(),
    react()
  ];

  return {
    server: {
      host: "::",
      port: 3000,  // Changed from 8080 to 3000 to avoid conflict with backend
      proxy: {
        '/api': {
          target: 'http://localhost:8081',
          changeOrigin: true
        },
        '/rag': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/rag/, '')
        },
        '/mcp': {
          target: 'http://localhost:8081',
          changeOrigin: true
        },
        '/health': {
          target: 'http://localhost:8081',
          changeOrigin: true
        }
      }
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});