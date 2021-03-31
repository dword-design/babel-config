import { resolvePath } from 'babel-plugin-module-resolver'
import packageName from 'depcheck-package-name'
import findUp from 'find-up'
import { paramCase } from 'param-case'
import P from 'path'

export default {
  plugins: [
    packageName`@babel/plugin-proposal-optional-chaining`,
    [
      packageName`@babel/plugin-proposal-pipeline-operator`,
      { proposal: 'fsharp' },
    ],
    packageName`babel-plugin-add-module-exports`,
    [
      packageName`babel-plugin-module-resolver`,
      {
        alias: {
          '@': '.',
        },
        resolvePath: (sourcePath, currentFile, options) => {
          const rootPath = findUp.sync(['package.json', '.root'], {
            cwd: P.dirname(currentFile),
          })

          const rootDir = rootPath ? P.dirname(rootPath) : undefined

          return resolvePath(sourcePath, currentFile, {
            ...options,
            cwd: rootDir,
          })
        },
      },
    ],
    [
      packageName`babel-plugin-transform-imports`,
      {
        [packageName`@dword-design/functions`]: {
          transform: importName =>
            `@dword-design/functions/dist/${importName |> paramCase}`,
        },
      },
    ],
    [packageName`babel-plugin-wildcard`, { exts: [] }],
    packageName`babel-plugin-macros`,
  ],
  presets: [
    [packageName`@babel/preset-env`, { targets: { node: 10 } }],
    packageName`@vue/babel-preset-jsx`,
  ],
}
