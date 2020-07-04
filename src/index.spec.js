import { endent, mapValues } from '@dword-design/functions'
import execa from 'execa'
import { readFile } from 'fs-extra'
import outputFiles from 'output-files'
import { resolve } from 'path'
import withLocalTmpDir from 'with-local-tmp-dir'

const runTest = config => {
  config = { test: () => {}, ...config }
  return () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'package.json': JSON.stringify({}),
        ...config.files,
      })
      await execa(
        'babel',
        ['--out-dir', 'dist', '--config-file', require.resolve('.'), 'src'],
        { cwd: config.cwd }
      )
      await config.test()
    })
}

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
  'alias: root': {
    files: {
      src: {
        'foo.js': 'export default 1',
        '.root': '',
        'index.js': endent`
          import foo from '@/foo'
          
          export default foo
        `,
      },
    },
    test: () => expect(require(resolve('dist'))).toEqual(1),
  },
  'alias: package.json': {
    files: {
      src: {
        'foo.js': 'export default 1',
        'package.json': JSON.stringify({}),
        'index.js': endent`
          import foo from '@/foo'
          
          export default foo
        `,
      },
    },
    test: () => expect(require(resolve('dist'))).toEqual(1),
  },
  'alias: root behind cwd': {
    files: {
      '.root': '',
      'sub/src': {
        'foo.js': 'export default 1',
        'index.js': endent`
          import foo from '@/sub/src/foo'
          
          export default foo
        `,
      },
    },
    cwd: 'sub',
    test: () => expect(require(resolve('sub', 'dist'))).toEqual(1),
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
  'jsx: normal': {
    files: {
      'src/index.js': endent`
        export default {
          render() {
            return <div>Hello world</div>
          },
        }
      `,
    },
    test: async () =>
      expect(await readFile(resolve('dist', 'index.js'), 'utf8'))
        .toEqual(endent`
        "use strict";
        
        Object.defineProperty(exports, "__esModule", {
          value: true
        });
        exports.default = void 0;
        var _default = {
          render() {
            const h = arguments[0];
            return h("div", ["Hello world"]);
          }
        
        };
        exports.default = _default;
        module.exports = exports.default;
      `),
  },
  'jsx: functional: no props': {
    files: {
      'src/index.js': endent`
        export default {
          functional: true,
          render: () => <div>Hello world</div>,
        }
      `,
    },
    test: async () =>
      expect(await readFile(resolve('dist', 'index.js'), 'utf8'))
        .toEqual(endent`
        "use strict";
        
        Object.defineProperty(exports, "__esModule", {
          value: true
        });
        exports.default = void 0;
        var _default = {
          functional: true,
          render: h => h("div", ["Hello world"])
        };
        exports.default = _default;
        module.exports = exports.default;
      `),
  },
  'jsx: functional: context': {
    files: {
      'src/index.js': endent`
        export default {
          functional: true,
          props: {
            foo: {},
          },
          render: context => <div>{ context.props.foo }</div>,
        }
      `,
    },
    test: async () =>
      expect(await readFile(resolve('dist', 'index.js'), 'utf8'))
        .toEqual(endent`
        "use strict";
        
        Object.defineProperty(exports, "__esModule", {
          value: true
        });
        exports.default = void 0;
        var _default = {
          functional: true,
          props: {
            foo: {}
          },
          render: (h, context) => h("div", [context.props.foo])
        };
        exports.default = _default;
        module.exports = exports.default;
      `),
  },
} |> mapValues(runTest)