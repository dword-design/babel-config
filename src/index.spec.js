import withLocalTmpDir from 'with-local-tmp-dir'
import execa from 'execa'
import outputFiles from 'output-files'
import { resolve } from 'path'
import { endent, mapValues } from '@dword-design/functions'

const runTest = config => () => withLocalTmpDir(async () => {
  await outputFiles({
    'package.json': JSON.stringify({}),
    ...config.files,
  })
  await execa('babel', ['--out-dir', 'dist', '--config-file', require.resolve('.'), 'src'])
  await config.test()
})
export default {
  'alias: valid': {
    files: {
      src: {
        'bar/index.js': 'export default 1',
        'foo/index.js': endent`
          import bar from '@/src/bar'

          export default bar
        `,
      },
    },
    test: () => expect(require(resolve('dist', 'foo'))).toEqual(1),
  },
  'alias: multiple roots': {
    files: {
      src: {
        'foo.js': 'export default 1',
        'package.json': JSON.stringify({}),
        'index.js': endent`
          import value from '@/foo'

          export default value
        `,
      },
    },
    test: () => expect(require(resolve('dist'))).toEqual(1),
  },
  functions: {
    files: {
      'src/index.js': endent`
        import { endsWith } from '@dword-design/functions'
        export default 'foobar' |> endsWith('bar')
      `,
    },
    test: () => expect(require(resolve('dist'))).toBeTruthy(),
  },
  'optional chaining': {
    files: {
      'src/index.js': endent`
        const foo = undefined
        export default foo?.bar
      `,
    },
    test: () => expect(require(resolve('dist'))).toBeUndefined(),
  },
  'pipeline operator': {
    files: {
      'src/index.js': 'export default 1 |> x => x * 2',
    },
    test: () => expect(require(resolve('dist'))).toEqual(2),
  },
}
  |> mapValues(runTest)
