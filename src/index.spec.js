import withLocalTmpDir from 'with-local-tmp-dir'
import execa from 'execa'
import { outputFile } from 'fs-extra'
import { resolve } from 'path'
import { endent } from '@dword-design/functions'

export default {
  functions: () => withLocalTmpDir(async () => {
    await outputFile('src/index.js', endent`
      import { endsWith } from '@dword-design/functions'
      export default 'foobar' |> endsWith('bar')
    `)
    await execa('babel', ['--out-dir', 'dist', '--config-file', require.resolve('.'), 'src'])
    expect(require(resolve('dist'))).toBeTruthy()
  }),
  'optional chaining': () => withLocalTmpDir(async () => {
    await outputFile('src/index.js', endent`
      const foo = undefined
      export default foo?.bar
    `)
    await execa('babel', ['--out-dir', 'dist', '--config-file', require.resolve('.'), 'src'])
    expect(require(resolve('dist'))).toBeUndefined()
  }),
  'pipeline operator': () => withLocalTmpDir(async () => {
    await outputFile('src/index.js', 'export default 1 |> x => x * 2')
    await execa('babel', ['--out-dir', 'dist', '--config-file', require.resolve('.'), 'src'])
    expect(require(resolve('dist'))).toEqual(2)
  }),
}
