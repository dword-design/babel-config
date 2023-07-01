import { resolvePath } from 'babel-plugin-module-resolver'
import packageName from 'depcheck-package-name'
import { findUpSync } from 'find-up'
import loadPkg from 'load-pkg'
import { paramCase } from 'param-case'
import P from 'path'

export default () => {
  const packageConfig = loadPkg.sync() || {}

  return {
    plugins: [
      [
        packageName`@babel/plugin-proposal-pipeline-operator`,
        { proposal: 'fsharp' },
      ],
      ...(packageConfig.type === 'module'
        ? []
        : [packageName`babel-plugin-add-module-exports`]),
      [
        'babel-plugin-module-resolver',
        {
          alias: {
            '@': '.',
          },
          resolvePath: (sourcePath, currentFile, options) => {
            const rootPath = findUpSync(['package.json', '.root'], {
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
              `@dword-design/functions/dist/${importName |> paramCase}.js`,
          },
        },
      ],
      [packageName`babel-plugin-wildcard`, { exts: [] }],
      packageName`babel-plugin-macros`,
      packageName`@babel/plugin-syntax-import-assertions`,
    ],
    presets: [
      [
        packageName`@babel/preset-env`,
        {
          ...(packageConfig.type === 'module' ? { modules: false } : {}),
          targets: { node: 14 },
        },
      ],
    ],
  }
}
