/**
 * 목적 - 클라이언트 TypeScript/React 코드가 lint를 통과하도록 ESLint 구성을 보강하기 위해 수정됨
 * 설명 - TypeScript parser와 규칙을 추가하고, 현재 파일 구조에서 불필요한 react-refresh 경고를 끄도록 조정한다.
 */
module.exports = {
  root: true,
  env: { browser: true, es2021: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint', 'react-refresh'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  settings: { react: { version: 'detect' } },
  ignorePatterns: ['dist'],
  rules: {
    'react-refresh/only-export-components': 'off',
  },
};
