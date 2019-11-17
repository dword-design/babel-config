import aliases from '@dword-design/aliases'

export default {
  presets: [
    [require.resolve('@babel/preset-env'), { targets: { node: 10 } }],
  ],
  plugins: [
    require.resolve('@babel/plugin-proposal-optional-chaining'),
    require.resolve('@babel/plugin-proposal-nullish-coalescing-operator'),
    [require.resolve('@babel/plugin-proposal-pipeline-operator'), { proposal: 'fsharp' }],
    require.resolve('babel-plugin-add-module-exports'),
    [require.resolve('babel-plugin-module-resolver'), { alias: aliases }],
    [require.resolve('babel-plugin-transform-imports'), {
      '@dword-design/functions': { transform: '@dword-design/functions/dist/${member}' },
    }],
  ],
}
