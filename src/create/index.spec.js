import { transformAsync } from '@babel/core'
import chdir from '@dword-design/chdir'
import { endent, property } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import packageName from 'depcheck-package-name'
import { ESLint } from 'eslint'
import { execaCommand } from 'execa'
import fs from 'fs-extra'
import jiti from 'jiti'
import outputFiles from 'output-files'
import P from 'path'

import self from './index.js'

export default tester(
  {
    'alias: package.json': async () => {
      await fs.outputFile(
        P.join('src', 'package.json'),
        JSON.stringify({ type: 'module' }),
      )
      expect(
        transformAsync("import '@/foo'", {
          filename: P.join('src', 'index.js'),
          ...self(),
        })
          |> await
          |> property('code'),
      ).toEqual('import "./foo";')
    },
    'alias: root': async () => {
      await fs.outputFile('.root', '')
      expect(
        transformAsync("import '@/foo'", {
          filename: 'index.js',
          ...self(),
        })
          |> await
          |> property('code'),
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
            |> property('code'),
        ).toEqual('import "../a/foo";'),
      )
    },
    'alias: valid': async () =>
      expect(
        transformAsync("import '@/src/bar'", {
          filename: P.join('foo', 'index.js'),
          ...self(),
        })
          |> await
          |> property('code'),
      ).toEqual('import "../src/bar";'),
    cli: async () => {
      await fs.outputFile('index.js', 'export default 1')
      await fs.outputFile(
        '.babelrc.json',
        JSON.stringify({ extends: '../src/index.js' }),
      )
      await execaCommand('babel index.js')
    },
    commonjs: async () => {
      await fs.outputFile('package.json', JSON.stringify({}))
      expect(
        transformAsync(
          endent`
            import foo from '@/src/foo'

            export default foo
          `,
          {
            filename: 'index.js',
            ...self(),
          },
        )
          |> await
          |> property('code'),
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
    'eslint parser': async () => {
      const eslint = new ESLint({
        overrideConfig: {
          parser: packageName`@babel/eslint-parser`,
          parserOptions: {
            babelOptions: {
              configFile: '..',
            },
          },
        },
      })
      expect((eslint.lintText('') |> await)[0].messages).toEqual([])
    },
    functions: async () =>
      expect(
        transformAsync("import { endsWith } from '@dword-design/functions'", {
          filename: 'index.js',
          ...self(),
        })
          |> await
          |> property('code'),
      ).toEqual(
        'import endsWith from "@dword-design/functions/dist/ends-with.js";',
      ),
    'import assertion': async () => {
      await fs.outputFile('foo.json', JSON.stringify({}))
      expect(
        transformAsync("import './foo.json' assert { type: 'json' }", {
          filename: 'index.js',
          ...self(),
        })
          |> await
          |> property('code'),
      ).toEqual('import "./foo.json" assert { type: \'json\' };')
    },
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
          |> property('code'),
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
          |> property('code'),
      ).toEqual('import * as foo from "./foo";')
    },
    jiti: async () => {
      await fs.outputFile('index.js', "export default 'foo'")
      expect(
        jiti(process.cwd(), {
          interopDefault: true,
          transformOptions: {
            babel: self(),
          },
        })('./index.js'),
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
          { filename: 'index.js', ...self() },
        )
          |> await
          |> property('code'),
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
          { filename: 'index.js', ...self() },
        )
          |> await
          |> property('code'),
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
      await fs.outputFile('package.json', JSON.stringify({}))
      await fs.outputFile(
        'foo.macro.js',
        endent`
          const { createMacro } = require('babel-plugin-macros')

          module.exports = createMacro(context =>
            context.references.default[0].replaceWith(context.babel.types.numericLiteral(1))
          )
        `,
      )
      expect(
        transformAsync(
          endent`
            import macro from './foo.macro'

            export default macro
          `,
          { filename: 'index.js', ...self() },
        )
          |> await
          |> property('code'),
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
          |> property('code'),
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
          |> property('code'),
      ).toEqual(endent`
        var _;
        export default (_ = 1, _ * 2);
      `),
    'subdir and esm': async () => {
      await fs.ensureDir('sub')
      await chdir('sub', async () => {
        expect(
          transformAsync('export default 1', {
            filename: 'index.js',
            ...self(),
          })
            |> await
            |> property('code'),
        ).toEqual('export default 1;')
      })
    },
    typescript: async () =>
      expect(
        transformAsync('export default (x: number) => x * 2', {
          filename: 'index.ts',
          ...self(),
        })
          |> await
          |> property('code'),
      ).toEqual('export default (x => x * 2);'),
  },
  [
    testerPluginTmpDir(),
    {
      before: () => execaCommand('base prepublishOnly'),
      beforeEach: () =>
        fs.outputFile('package.json', JSON.stringify({ type: 'module' })),
    },
  ],
)
