import getPackageName from 'get-package-name'
import P from 'path'
import safeRequire from 'safe-require'

const packageName = safeRequire(P.join(process.cwd(), 'package.json'))?.name
const functionsPrefix = process.env.NODE_ENV === 'test' && packageName === '@dword-design/functions'
  ? ''
  : '/dist'

export default {
  presets: [
    [getPackageName(require.resolve('@babel/preset-env')), { targets: { node: 10 } }],
  ],
  plugins: [
    getPackageName(require.resolve('@babel/plugin-proposal-optional-chaining')),
    getPackageName(require.resolve('@babel/plugin-proposal-nullish-coalescing-operator')),
    [getPackageName(require.resolve('@babel/plugin-proposal-pipeline-operator')), { proposal: 'fsharp' }],
    getPackageName(require.resolve('babel-plugin-add-module-exports')),
    [getPackageName(require.resolve('babel-plugin-transform-imports')), {
      [getPackageName(require.resolve('@dword-design/functions'))]: {
        transform: `@dword-design/functions${functionsPrefix}/\${member}`,
      },
    }],
  ],
}
