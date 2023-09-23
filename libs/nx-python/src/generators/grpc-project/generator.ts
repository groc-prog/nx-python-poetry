import type { GRPCProjectGeneratorSchema } from './schema.js';

import * as poetryGenerator from '../poetry-project/generator';
import path from 'path';
import { Tree, formatFiles, generateFiles, installPackagesTask, names, workspaceLayout } from '@nx/devkit';

export default async function generator(tree: Tree, schema: GRPCProjectGeneratorSchema) {
  await poetryGenerator.default(tree, {
    ...schema,
    type: 'application',
  });

  const projectName = names(schema.name).fileName;
  const moduleName = projectName.replace('-', '_');

  generateFiles(tree, path.join(__dirname, 'files', 'base'), path.join(workspaceLayout().appsDir, projectName), {
    ...schema,
    projectName,
    moduleName,
  });

  if (schema.includeDockerFile)
    generateFiles(tree, path.join(__dirname, 'files', 'docker'), path.join(workspaceLayout().appsDir, projectName), {
      ...schema,
      projectName,
      moduleName,
    });

  await formatFiles(tree);
  return () => {
    installPackagesTask(tree);
  };
}
