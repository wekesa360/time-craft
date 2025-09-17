import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Node modules chunking strategy
          if (id.includes('node_modules')) {
            // Core React and routing - most stable, cache longest
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            
            // UI libraries
            if (id.includes('@headlessui/react') || id.includes('lucide-react') || 
                id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'ui-vendor';
            }
            
            // Data fetching and state management
            if (id.includes('@tanstack/react-query') || id.includes('axios') || id.includes('zustand')) {
              return 'data-vendor';
            }
            
            // Localization - dynamic loading friendly
            if (id.includes('react-i18next') || id.includes('i18next') || 
                id.includes('i18next-browser-languagedetector')) {
              return 'localization';
            }
            
            // Form handling
            if (id.includes('react-hook-form') || id.includes('@hookform/resolvers') || id.includes('zod')) {
              return 'forms';
            }
            
            // Date and utility libraries
            if (id.includes('date-fns') || id.includes('lz-string')) {
              return 'utils';
            }
            
            // Toast notifications
            if (id.includes('react-hot-toast')) {
              return 'notifications';
            }
            
            // Remaining node_modules as shared vendor
            return 'vendor';
          }
          
          // App code chunking by feature
          if (id.includes('/src/pages/')) {
            const page = id.split('/src/pages/')[1].split('/')[0].replace('.tsx', '').replace('.ts', '');
            return `page-${page}`;
          }
          
          if (id.includes('/src/components/')) {
            const component = id.split('/src/components/')[1].split('/')[0];
            return `comp-${component}`;
          }
          
          if (id.includes('/src/hooks/')) {
            return 'hooks';
          }
          
          if (id.includes('/src/utils/')) {
            return 'app-utils';
          }
          
          if (id.includes('/src/stores/') || id.includes('/src/store/')) {
            return 'stores';
          }
          
          if (id.includes('/src/i18n/')) {
            return 'i18n';
          }
          
          // Default chunk for remaining app code
          return 'app';
        },
        // Optimize chunk naming for better caching
        chunkFileNames: (chunkInfo) => {
          const name = chunkInfo.name;
          
          // Vendor chunks with longer cache periods
          if (name.includes('vendor') || name.includes('react-vendor')) {
            return `assets/vendor/${name}-[hash].js`;
          }
          
          // Page chunks
          if (name.startsWith('page-')) {
            return `assets/pages/${name}-[hash].js`;
          }
          
          // Component chunks
          if (name.startsWith('comp-')) {
            return `assets/components/${name}-[hash].js`;
          }
          
          // Localization chunks
          if (name === 'localization' || name === 'i18n') {
            return `assets/i18n/${name}-[hash].js`;
          }
          
          return `assets/${name}-[hash].js`;
        },
        // Optimize entry file names
        entryFileNames: 'assets/entry/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name || '')) {
            return `assets/images/[name]-[hash].${ext}`;
          }
          
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
            return `assets/fonts/[name]-[hash].${ext}`;
          }
          
          if (/\.(css)$/i.test(assetInfo.name || '')) {
            return `assets/css/[name]-[hash].${ext}`;
          }
          
          return `assets/misc/[name]-[hash].${ext}`;
        }
      },
      // Tree shaking optimizations
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      }
    },
    // Enhanced build optimizations
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: process.env.NODE_ENV === 'development',
    // Smaller chunks for better loading
    chunkSizeWarningLimit: 500,
    assetsInlineLimit: 4096, // 4kb
    // CSS code splitting
    cssCodeSplit: true,
    // Enable build reporting
    reportCompressedSize: true,
    // Remove external dependencies configuration as it's not valid for rollup.build
  },
  // Enhanced dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'react-i18next',
      'i18next',
      'i18next-browser-languagedetector',
      'axios',
      'zustand',
      'date-fns',
      'react-hook-form',
      'zod'
    ],
    // Exclude large or dynamic modules
    exclude: [
      'virtual:localization-chunks',
      '@testing-library/react',
      '@testing-library/jest-dom',
      'vitest'
    ],
    // Force optimization of problematic packages
    force: true
  },
  // Enable modern browser optimizations
  esbuild: {
    // Remove console logs in production
    pure: process.env.NODE_ENV === 'production' ? ['console.log', 'console.debug'] : [],
    // Drop debug code in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    // Enable tree shaking for modern syntax
    treeShaking: true,
    // Use modern JS features for smaller bundles
    target: 'esnext'
  },
  // Performance optimizations
  server: {
    // Warm up frequently used files
    warmup: {
      clientFiles: [
        './src/App.tsx',
        './src/main.tsx',
        './src/pages/Dashboard.tsx',
        './src/components/**/*'
      ]
    }
  }
})
