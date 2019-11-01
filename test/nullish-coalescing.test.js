const expect = require('expect')
const withLocalTmpDir = require('with-local-tmp-dir')
const { spawn } = require('child-process-promise')
const { outputFile } = require('fs-extra')
const { resolve } = require('path')
const endent = require('endent')

it('nullish coalescing', () => withLocalTmpDir(__dirname, async () => {
  await outputFile('src/index.js', endent`
    const foo = undefined
    export default foo?.bar
  `)
  await spawn('babel', ['--out-dir', 'dist', '--config-file', require.resolve('@dword-design/babel-config'), 'src'])
  expect(require(resolve('dist'))).toBeUndefined()
}))
