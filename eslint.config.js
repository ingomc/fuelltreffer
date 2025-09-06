import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  
  // JavaScript files (including API routes)
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Node.js globals
        process: 'readonly',
        console: 'readonly',
        // Browser/Web API globals
        fetch: 'readonly',
        Response: 'readonly',
        URLSearchParams: 'readonly',
        localStorage: 'readonly',
        document: 'readonly',
        window: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      'prefer-const': 'error',
      'no-var': 'error'
    }
  },

  // TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'prefer-const': 'error'
    }
  },

  // Global ignores
  {
    ignores: [
      // Build outputs
      'dist/',
      'node_modules/',
      '.astro/',
      
      // Public assets
      'public/',
      
      // Config files
      '*.config.*',
      '*.config.js',
      '*.config.mjs',
      '*.config.ts',
      
      // Logs and temp files
      '*.log',
      '.env',
      '.env.local',
      '.env.production',
      
      // Ignore Astro and Svelte files for now due to parser issues
      '**/*.astro',
      '**/*.svelte'
    ]
  }
];
