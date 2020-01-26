import * as babel from '@babel/core'
import babelConfig from '@dword-design/babel-config'
import { endent } from '@dword-design/functions'

export default () => babel.transformAsync(endent`
  export default {
    render: () => <div>hello world</div>,
  }
`, babelConfig)