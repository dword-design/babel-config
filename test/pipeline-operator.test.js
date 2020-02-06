import withLocalTmpDir from 'with-local-tmp-dir'
import { spawn } from 'child-process-promise'
import { outputFile } from 'fs-extra'
import { resolve } from 'path'

export default () => withLocalTmpDir(__dirname, async () => {
  await outputFile('src/index.js', 'export default 1 |> x => x * 2')
  await spawn('babel', ['--out-dir', 'dist', '--config-file', require.resolve('@dword-design/babel-config'), 'src'])
  expect(require(resolve('dist'))).toEqual(2)
})
