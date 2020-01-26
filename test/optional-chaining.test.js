import expect from 'expect'
import withLocalTmpDir from 'with-local-tmp-dir'
import { spawn } from 'child-process-promise'
import { outputFile } from 'fs-extra'
import { resolve } from 'path'

export default () => withLocalTmpDir(__dirname, async () => {
  await outputFile('src/index.js', 'export default undefined ?? \'foo\'')
  await spawn('babel', ['--out-dir', 'dist', '--config-file', require.resolve('@dword-design/babel-config'), 'src'])
  expect(require(resolve('dist'))).toEqual('foo')
})
