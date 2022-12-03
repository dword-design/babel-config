import { transformAsync } from '@babel/core'
import chdir from '@dword-design/chdir'
import { endent, property } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import { outputFile } from 'fs-extra'
import jiti from 'jiti'
import outputFiles from 'output-files'
import P from 'path'

import self from '.'

export default tester(
  {
    'alias: package.json': async () => {
      await outputFile(
        P.join('src', 'package.json'),
        JSON.stringify({ type: 'module' })
      )
      expect(
        transformAsync("import '@/foo'", {
          filename: P.join('src', 'index.js'),
          ...self(),
        })
          |> await
          |> property('code')
      ).toEqual('import "./foo";')
    },
    'alias: root': async () => {
      await outputFile('.root', '')
      expect(
        transformAsync("import '@/foo'", {
          filename: 'index.js',
          ...self(),
        })
          |> await
          |> property('code')
      ).toEqual('import "./foo";')
    },
    'alias: root behind cwd': async () => {
      await outputFiles({
        '.root': '',
        'sub/package.json': JSON.stringify({ type: 'module' }),
      })
      await chdir('sub', async () =>
        expect(
          transformAsync("import '@/sub/a/foo'", {
            filename: P.join('sub', 'b', 'index.js'),
            ...self(),
          })
            |> await
            |> property('code')
        ).toEqual('import "../a/foo";')
      )
    },
    'alias: valid': async () =>
      expect(
        transformAsync("import '@/src/bar'", {
          filename: P.join('foo', 'index.js'),
          ...self(),
        })
          |> await
          |> property('code')
      ).toEqual('import "../src/bar";'),
    commonjs: async () => {
      await outputFile('package.json', JSON.stringify({}))
      expect(
        transformAsync(
          endent`
        import foo from '@/src/foo'

        export default foo
      `,
          {
            filename: 'index.js',
            ...self(),
          }
        )
          |> await
          |> property('code')
      ).toEqual(endent`
        "use strict";

        Object.defineProperty(exports, "__esModule", {
          value: true
        });
        exports.default = void 0;
        var _foo = _interopRequireDefault(require("./src/foo"));
        function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
        var _default = _foo.default;
        exports.default = _default;
        module.exports = exports.default;
      `)
    },
    functions: async () =>
      expect(
        transformAsync("import { endsWith } from '@dword-design/functions'", {
          filename: 'index.js',
          ...self(),
        })
          |> await
          |> property('code')
      ).toEqual(
        'import endsWith from "@dword-design/functions/dist/ends-with.js";'
      ),
    'import: wildcard directory': async () => {
      await outputFiles({
        foo: {
          'bar.js': 'export default 1',
          'baz.js': 'export default 2',
        },
      })
      expect(
        transformAsync("import * as foo from './foo'", {
          filename: 'index.js',
          ...self(),
        })
          |> await
          |> property('code')
      ).toEqual(endent`
        const foo = {};
        import _wcImport2 from "./foo/baz.js";
        foo["Baz"] = _wcImport2;
        import _wcImport from "./foo/bar.js";
        foo["Bar"] = _wcImport;
      `)
    },
    'import: wildcard index.js': async () => {
      await outputFiles({
        foo: {
          'bar.js': 'export default 1',
          'baz.js': 'export default 2',
          'index.js': endent`
        import Bar from './bar'

        export { Bar }
      `,
        },
      })
      expect(
        transformAsync("import * as foo from './foo'", {
          filename: 'index.js',
          ...self(),
        })
          |> await
          |> property('code')
      ).toEqual('import * as foo from "./foo";')
    },
    jiti: async () => {
      await outputFile('index.js', "export default 'foo'")
      expect(
        jiti(process.cwd(), {
          interopDefault: true,
          transformOptions: {
            babel: self(),
          },
        })('./index.js')
      ).toEqual('foo')
    },
    'jsx: functional: context': async () =>
      expect(
        transformAsync(
          endent`
      export default {
        functional: true,
        props: {
          foo: {},
        },
        render: context => <div>{ context.props.foo }</div>,
      }
    `,
          { filename: 'index.js', ...self() }
        )
          |> await
          |> property('code')
      ).toEqual(endent`
      export default {
        functional: true,
        props: {
          foo: {}
        },
        render: (h, context) => h("div", [context.props.foo])
      };
    `),
    'jsx: functional: no props': async () =>
      expect(
        transformAsync(
          endent`
    export default {
      functional: true,
      props: {
        foo: {},
      },
      render: context => <div>Hello world</div>,
    }
  `,
          { filename: 'index.js', ...self() }
        )
          |> await
          |> property('code')
      ).toEqual(endent`
    export default {
      functional: true,
      props: {
        foo: {}
      },
      render: (h, context) => h("div", ["Hello world"])
    };
  `),
    macro: async () => {
      await outputFiles({
        'foo.macro.js': endent`
        import { createMacro } from 'babel-plugin-macros'

        export default createMacro(context =>
          context.references.default[0].replaceWith(context.babel.types.numericLiteral(1))
        )
      `,
        'package.json': JSON.stringify({}),
      })
      expect(
        transformAsync(
          endent`
            import macro from './foo.macro'

            export default macro
          `,
          { filename: 'index.js', ...self() }
        )
          |> await
          |> property('code')
      ).toEqual(endent`
        "use strict";

        Object.defineProperty(exports, "__esModule", {
          value: true
        });
        exports.default = void 0;
        var _default = 1;
        exports.default = _default;
        module.exports = exports.default;
      `)
    },
    'optional chaining': async () =>
      expect(
        transformAsync('export default foo?.bar', {
          filename: 'index.js',
          ...self(),
        })
          |> await
          |> property('code')
      ).toEqual(endent`
        var _foo;
        export default (_foo = foo) === null || _foo === void 0 ? void 0 : _foo.bar;
      `),
    'pipeline operator': async () =>
      expect(
        transformAsync('export default 1 |> x => x * 2', {
          filename: 'index.js',
          ...self(),
        })
          |> await
          |> property('code')
      ).toEqual(endent`
        var _;
        export default (_ = 1, _ * 2);
      `),
    typescript: async () =>
      expect(
        transformAsync('export default (x: number) => x * 2', {
          filename: 'index.ts',
          ...self(),
        })
          |> await
          |> property('code')
      ).toEqual('export default (x => x * 2);'),
  },
  [
    testerPluginTmpDir(),
    {
      beforeEach: () =>
        outputFile('package.json', JSON.stringify({ type: 'module' })),
    },
  ]
)
