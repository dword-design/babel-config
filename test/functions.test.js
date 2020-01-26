import expect from 'expect'
import withLocalTmpDir from 'with-local-tmp-dir'
import { spawn } from 'child-process-promise'
import { outputFile } from 'fs-extra'
import { resolve } from 'path'
import { endent } from '@dword-design/functions'

export default () => withLocalTmpDir(__dirname, async () => {
  await outputFile('src/index.js', endent`
    import { endsWith } from '@dword-design/functions'
    export default 'foobar' |> endsWith('bar')
  `)
  await spawn('babel', ['--out-dir', 'dist', '--config-file', require.resolve('@dword-design/babel-config'), 'src'])
  expect(require(resolve('dist'))).toBeTruthy()
})
