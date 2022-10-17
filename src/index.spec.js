import { endent } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginBabelConfig from '@dword-design/tester-plugin-babel-config'
import { readFile } from 'fs-extra'
import P from 'path'

export default tester(
  {
    'alias: package.json': {
      files: {
        src: {
          'foo.js': 'export default 1',
          'index.js': endent`
          import foo from '@/foo'

          export default foo
        `,
          'package.json': JSON.stringify({}),
        },
      },
      test: () => expect(require(P.resolve('dist'))).toEqual(1),
    },
    'alias: root': {
      files: {
        src: {
          '.root': '',
          'foo.js': 'export default 1',
          'index.js': endent`
          import foo from '@/foo'

          export default foo
        `,
        },
      },
      test: () => expect(require(P.resolve('dist'))).toEqual(1),
    },
    'alias: root behind cwd': {
      cwd: 'sub',
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
      test: () => expect(require(P.resolve('sub', 'dist'))).toEqual(1),
    },
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
      test: () => expect(require(P.resolve('dist', 'foo'))).toEqual(1),
    },
    esm: {
      files: {
        'package.json': JSON.stringify({ type: 'module' }),
        'src/index.js': endent`
        import foo from '@/src/foo'

        export default foo
      `,
      },
      test: async () =>
        expect(await readFile(P.join('dist', 'index.js'), 'utf8'))
          .toEqual(endent`
        import foo from "./foo";
        export default foo;
      `),
    },
    functions: {
      files: {
        'src/index.js': endent`
        import { endsWith } from '@dword-design/functions'
        export default 'foobar' |> endsWith('bar')
      `,
      },
      test: () => expect(require(P.resolve('dist'))).toBeTruthy(),
    },
    'import: wildcard directory': {
      files: {
        src: {
          foo: {
            'bar.js': 'export default 1',
            'baz.js': 'export default 2',
          },
          'index.js': endent`
          import * as foo from './foo'

          export default foo
        `,
        },
      },
      test: () =>
        expect(require(P.resolve('dist'))).toEqual({ Bar: 1, Baz: 2 }),
    },
    'import: wildcard index.js': {
      files: {
        src: {
          foo: {
            'bar.js': 'export default 1',
            'baz.js': 'export default 2',
            'index.js': endent`
            import Bar from './bar'

            export { Bar }
          `,
          },
          'index.js': endent`
          import * as foo from './foo'

          export default foo
        `,
        },
      },
      test: () => expect(require(P.resolve('dist'))).toEqual({ Bar: 1 }),
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
        expect(await readFile(P.join('dist', 'index.js'), 'utf8'))
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
        expect(await readFile(P.join('dist', 'index.js'), 'utf8'))
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
        expect(await readFile(P.join('dist', 'index.js'), 'utf8'))
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
    macro: {
      files: {
        src: {
          'foo.macro.js': endent`
          import { createMacro } from 'babel-plugin-macros'

          export default createMacro(context =>
            context.references.default[0].replaceWith(context.babel.types.numericLiteral(1))
          )
        `,
          'index.js': endent`
          import macro from './foo.macro'

          export default macro
        `,
        },
      },
      test: () => expect(require(P.resolve('dist'))).toEqual(1),
    },
    'optional chaining': {
      files: {
        'src/index.js': endent`
        const foo = undefined
        export default foo?.bar
      `,
      },
      test: () => expect(require(P.resolve('dist'))).toBeUndefined(),
    },
    'pipeline operator': {
      files: {
        'src/index.js': 'export default 1 |> x => x * 2',
      },
      test: () => expect(require(P.resolve('dist'))).toEqual(2),
    },
    typescript: {
      files: {
        src: {
          'index.ts': 'export default (x: number) => x * 2',
        },
      },
      test: () => expect(require(P.resolve('dist'))(2)).toEqual(4),
    },
  },
  [testerPluginBabelConfig(require.resolve('.'))]
)
