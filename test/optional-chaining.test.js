const expect = require('expect')
const withLocalTmpDir = require('with-local-tmp-dir')
const { spawn } = require('child-process-promise')
const { outputFile } = require('fs-extra')
const { resolve } = require('path')

exports.it = () => withLocalTmpDir(__dirname, async () => {
  await outputFile('src/index.js', 'export default undefined ?? \'foo\'')
  await spawn('babel', ['--out-dir', 'dist', '--config-file', require.resolve('@dword-design/babel-config'), 'src'])
  expect(require(resolve('dist'))).toEqual('foo')
})

exports.timeout = 5000
