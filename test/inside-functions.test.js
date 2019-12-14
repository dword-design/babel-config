import expect from 'expect'
import withLocalTmpDir from 'with-local-tmp-dir'
import { spawn } from 'child-process-promise'
import outputFiles from 'output-files'
import { resolve } from 'path'
import { endent } from '@dword-design/functions'
import moduleAlias from 'module-alias'
import stealthyRequire from 'stealthy-require'

export const it = () => withLocalTmpDir(__dirname, async () => {
  await outputFiles({
    'package.json': JSON.stringify({ name: '@dword-design/functions' }),
    src: {
      'index.js': endent`
        import { abs } from '@dword-design/functions'

        export default abs
      `,
      'abs.js': 'module.exports = 1',
    },
  })
  await spawn(
    'babel',
    ['--out-dir', 'dist', '--config-file', require.resolve('@dword-design/babel-config'), 'src'],
    { env: { ...process.env, NODE_ENV: 'test' } },
  )
  moduleAlias.addAliases(stealthyRequire(require.cache, () => require('@dword-design/test-aliases')))
  expect(require(resolve('dist'))).toEqual(1)
})

export const timeout = 5000