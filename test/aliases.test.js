import expect from 'expect'
import withLocalTmpDir from 'with-local-tmp-dir'
import { spawn } from 'child_process'
import { outputFile } from 'fs'
import { resolve } from 'path'
import { endent } from '@functions'

export const it = () => withLocalTmpDir(__dirname, async () => {
  await outputFile('src/index.js', endent`
    import map from '@dword-design/functions/dist/map'
    export default [1, 2] |> map(x => x * 2)
  `)
  await spawn('babel', ['--out-dir', 'dist', '--config-file', require.resolve('@dword-design/babel-config'), 'src'])
  expect(require(resolve('dist'))).toEqual([2, 4])
})

export const timeout = 5000
