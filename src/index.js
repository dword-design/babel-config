import { startsWith } from '@dword-design/functions'
import { resolvePath } from 'babel-plugin-module-resolver'
import findUp from 'find-up'
import getPackageName from 'get-package-name'
import { paramCase } from 'param-case'
import P from 'path'

export default {
  presets: [
    [
      getPackageName(require.resolve('@babel/preset-env')),
      { targets: { node: 10 } },
    ],
    getPackageName(require.resolve('@vue/babel-preset-jsx')),
  ],
  plugins: [
    getPackageName(require.resolve('@babel/plugin-proposal-optional-chaining')),
    [
      getPackageName(
        require.resolve('@babel/plugin-proposal-pipeline-operator')
      ),
      { proposal: 'fsharp' },
    ],
    getPackageName(require.resolve('babel-plugin-add-module-exports')),
    [
      getPackageName(require.resolve('babel-plugin-module-resolver')),
      {
        alias: {
          '@': '.',
        },
        resolvePath: (sourcePath, currentFile, options) => {
          const rootPath = findUp.sync('.root', { cwd: P.dirname(currentFile) })
          const rootDir = rootPath ? P.dirname(rootPath) : rootPath
          return resolvePath(sourcePath, currentFile, {
            ...options,
            cwd:
              rootDir && (rootDir |> startsWith(process.cwd()))
                ? rootDir
                : process.cwd(),
          })
        },
      },
    ],
    [
      getPackageName(require.resolve('babel-plugin-transform-imports')),
      {
        [getPackageName(require.resolve('@dword-design/functions'))]: {
          transform: importName =>
            `@dword-design/functions/dist/${importName |> paramCase}`,
        },
      },
    ],
  ],
}
