import optionalChainingPlugin from '@babel/plugin-proposal-optional-chaining'
import pipelineOperatorPlugin from '@babel/plugin-proposal-pipeline-operator'
import importAssertionsPlugin from '@babel/plugin-syntax-import-assertions'
import envPreset from '@babel/preset-env'
import typescriptPreset from '@babel/preset-typescript'
import jsxPreset from '@vue/babel-preset-jsx'
import addModuleExportsPlugin from 'babel-plugin-add-module-exports'
import macrosPlugin from 'babel-plugin-macros'
import moduleResolverPlugin, { resolvePath } from 'babel-plugin-module-resolver'
import transformImportsPlugin from 'babel-plugin-transform-imports'
import wildcardPlugin from 'babel-plugin-wildcard'
import packageName from 'depcheck-package-name'
import { findUpSync } from 'find-up'
import loadPkg from 'load-pkg'
import { paramCase } from 'param-case'
import P from 'path'

export default () => {
  const packageConfig = loadPkg.sync() || {}

  return {
    plugins: [
      optionalChainingPlugin,
      [pipelineOperatorPlugin, { proposal: 'fsharp' }],
      ...(packageConfig.type === 'module' ? [] : [addModuleExportsPlugin]),
      [
        moduleResolverPlugin,
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
        transformImportsPlugin,
        {
          [packageName`@dword-design/functions`]: {
            transform: importName =>
              `@dword-design/functions/dist/${importName |> paramCase}.js`,
          },
        },
      ],
      [wildcardPlugin, { exts: [] }],
      macrosPlugin,
      importAssertionsPlugin,
    ],
    presets: [
      [
        envPreset,
        packageConfig.type === 'module'
          ? { modules: false, targets: { node: 14 } }
          : { targets: { node: 10 } },
      ],
      jsxPreset,
      typescriptPreset,
    ],
  }
}
