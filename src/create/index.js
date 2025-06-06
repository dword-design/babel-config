import P from 'node:path';

import { loadConfigSync } from '@dword-design/base';
import { resolvePath } from 'babel-plugin-module-resolver';
import packageName from 'depcheck-package-name';
import { findUpSync } from 'find-up';
import loadPkg from 'load-pkg';

export default () => {
  const packageConfig = loadPkg.sync() || {};
  const baseConfig = loadConfigSync() || {};

  const pipelineOperatorProposal =
    baseConfig.pipelineOperatorProposal || 'fsharp';

  const pipelineOperatorTopicToken =
    baseConfig.pipelineOperatorTopicToken || '%';

  return {
    plugins: [
      [
        packageName`@babel/plugin-proposal-pipeline-operator`,
        {
          proposal: pipelineOperatorProposal,
          topicToken: pipelineOperatorTopicToken,
        },
      ],
      packageName`@babel/plugin-proposal-partial-application`,
      ...(packageConfig.type === 'module'
        ? []
        : [packageName`babel-plugin-add-module-exports`]),
      [
        'babel-plugin-module-resolver',
        {
          alias: { '@': '.' },
          resolvePath: (sourcePath, currentFile, options) => {
            const rootPath = findUpSync(['package.json', '.root'], {
              cwd: P.dirname(currentFile),
            });

            const rootDir = rootPath ? P.dirname(rootPath) : undefined;
            return resolvePath(sourcePath, currentFile, {
              ...options,
              cwd: rootDir,
            });
          },
        },
      ],
      [packageName`babel-plugin-wildcard`, { exts: [] }],
      packageName`babel-plugin-macros`,
      packageName`@babel/plugin-syntax-import-assertions`,
    ],
    presets: [
      [
        packageName`@babel/preset-env`,
        {
          ...(packageConfig.type === 'module' ? { modules: false } : {}),
          targets: { node: 18 },
        },
      ],
    ],
  };
};
