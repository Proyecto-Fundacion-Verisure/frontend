import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';

// ESLint no opina del formato: de eso se encarga Prettier. Estas reglas buscan
// errores reales —hooks, dependencias de efectos, accesibilidad y código
// muerto— y dejan fuera lo que este proyecto no usa (TypeScript, PropTypes).
export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}', 'scripts/**/*.mjs', '*.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,

      // El proyecto usa el runtime automático de JSX y no usa PropTypes.
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // El proyecto no usa React Compiler. Esta regla asume su modelo y marca
      // el patrón estándar de cualquier pantalla que carga datos (poner el
      // estado en "cargando" al empezar el efecto y apagarlo al terminar).
      'react-hooks/set-state-in-effect': 'off',

      // Convenciones propias que sí queremos que fallen.
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    files: ['src/**/*.test.{js,jsx}', 'src/**/testing/**/*.{js,jsx}', 'src/**/*.test.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.vitest },
    },
  },
  {
    // Los scripts de la carpeta `scripts/` son herramientas de línea de
    // comandos: hablan con la terminal a propósito.
    files: ['scripts/**/*.{js,mjs}', '*.config.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      'no-console': 'off',
    },
  },
  prettier,
];
