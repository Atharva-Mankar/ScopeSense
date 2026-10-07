import tseslint from 'typescript-eslint';

export default tseslint.config({
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignores: ['dist', 'node_modules'],
  settings: {
    react: {
      version: 'detect',
    },
  },
});