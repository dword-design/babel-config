import withLocalTmpDir from 'with-local-tmp-dir'
import execa from 'execa'
import { outputFile } from 'fs-extra'
import outputFiles from 'output-files'
import { resolve } from 'path'
import { endent } from '@dword-design/functions'

export default {
  alias: () => withLocalTmpDir(async () => {
    await outputFiles({
      src: {
        'bar/index.js': 'export default 1',
        'foo/index.js': endent`
          import bar from '@/src/bar'

          export default bar
        `,
      },
    })
    await execa('babel', ['--out-dir', 'dist', '--config-file', require.resolve('.'), 'src'])
    expect(require(resolve('dist', 'foo'))).toEqual(1)
  }),
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
