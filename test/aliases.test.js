const expect = require('expect')
const withLocalTmpDir = require('with-local-tmp-dir')
const { spawn } = require('child-process-promise')
const { outputFile } = require('fs-extra')
const { resolve } = require('path')
const endent = require('endent')

it('aliases', () => withLocalTmpDir(__dirname, async () => {
  await outputFile('src/index.js', endent`
    import map from '@dword-design/functions/dist/map'
    export default [1, 2] |> map(x => x * 2)
  `)
  await spawn('babel', ['--out-dir', 'dist', '--config-file', require.resolve('@dword-design/babel-config'), 'src'])
  expect(require(resolve('dist'))).toEqual([2, 4])
})).timeout(5000)
