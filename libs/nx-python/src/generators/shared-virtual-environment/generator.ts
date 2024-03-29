import type { Tree } from '@nx/devkit';
import { existsSync } from 'fs-extra';
import { formatFiles, generateFiles, installPackagesTask, workspaceLayout } from '@nx/devkit';
import { parse, stringify } from '@iarna/toml';
import { isObject, get, set } from 'lodash';
import path from 'path';
import chalk from 'chalk';

import type { PyProjectToml } from '../../utils/poetry';
import { runPoetry, addSharedDependencies, checkVersionCompatible } from '../../utils/poetry';

export default async function generator(tree: Tree) {
  process.chdir(tree.root);
  console.log(chalk.blue(`\n${chalk.bgBlue(' INFO ')} 🚀 Migrating to a shared virtual environment\n`));
  const config = JSON.parse(tree.read('package.json').toString());

  generateFiles(tree, path.join(__dirname, 'files'), '.', {
    projectName: config.name,
  });

  // Update dependencies in root pyproject.toml
  const rootTomlConfig = parse(tree.read('pyproject.toml').toString()) as PyProjectToml;

  console.log(chalk.dim(`Adding dependencies from ${workspaceLayout().appsDir}`));
  tree.children(workspaceLayout().appsDir).forEach((service) => {
    const projectTomlPath = path.join(workspaceLayout().appsDir, service, 'pyproject.toml');

    if (existsSync(projectTomlPath)) {
      console.log(chalk.dim(`Resolving dependencies for ${service}`));
      const projectTomlConfig = parse(tree.read(projectTomlPath).toString()) as PyProjectToml;
      addSharedDependencies(rootTomlConfig, projectTomlConfig);
    }
  });

  console.log(chalk.dim(`Adding dependencies from ${workspaceLayout().libsDir}`));
  tree.children(workspaceLayout().libsDir).forEach((lib) => {
    const projectTomlPath = path.join(workspaceLayout().libsDir, lib, 'pyproject.toml');

    if (existsSync(projectTomlPath)) {
      console.log(chalk.dim(`Resolving dependencies for ${lib}`));
      const projectTomlConfig = parse(tree.read(projectTomlPath).toString()) as PyProjectToml;
      addWorkspaceDependencies(rootTomlConfig, projectTomlConfig);
    }
  });

  tree.write('pyproject.toml', stringify(rootTomlConfig));

  await formatFiles(tree);
  return () => {
    installPackagesTask(tree);
    runPoetry(['install']);
    console.log(
      chalk.green(`\n${chalk.bgGreen(' SUCCESS ')} 🎉 Successfully migrated to a shared virtual environment`),
    );
  };
}

/**
 * Adds shared dependencies to the root pyproject.toml file.
 *
 * @param {PyProjectToml} rootTomlConfig - Root pyproject.toml file.
 * @param {PyProjectToml} projectTomlConfig - Project pyproject.toml file.
 * @throws {Error} - If dependency version mismatch is detected.
 * @returns {void}
 */
function addWorkspaceDependencies(rootTomlConfig: PyProjectToml, projectTomlConfig: PyProjectToml): void {
  Object.keys(projectTomlConfig.tool.poetry.dependencies).forEach((dependencyName) => {
    const rootDependency = rootTomlConfig.tool.poetry.dependencies[dependencyName];
    const projectDependency = projectTomlConfig.tool.poetry.dependencies[dependencyName];

    if (isObject(projectDependency) && projectDependency.path) {
      if (rootDependency === undefined)
        rootTomlConfig.tool.poetry.dependencies[dependencyName] = {
          develop: true,
          path: path.join(workspaceLayout().libsDir, projectDependency.path.replace(/^(\.\.\/)*/, '')),
        };

      return;
    }

    if (
      rootDependency &&
      projectDependency &&
      !checkVersionCompatible(rootDependency, projectDependency, dependencyName)
    )
      throw new Error(
        `Dependency version mismatch for ${dependencyName}. Got version ${
          isObject(projectDependency) ? projectDependency.version : projectDependency
        } in ${projectTomlConfig.tool.poetry.name} and ${
          isObject(rootDependency) ? rootDependency.version : rootDependency
        } in shared virtual environment. Resolve the dependency conflict before proceeding.`,
      );

    if (rootDependency === undefined) rootTomlConfig.tool.poetry.dependencies[dependencyName] = projectDependency;
  });

  if (get(projectTomlConfig, 'tool.poetry.group.dev.dependencies', null) !== null) {
    if (get(rootTomlConfig, 'tool.poetry.group.dev.dependencies', null) === null)
      set(rootTomlConfig, 'tool.poetry.group.dev.dependencies', {});

    // Add shared dev dependencies
    Object.keys(projectTomlConfig.tool.poetry.group.dev.dependencies).forEach((dependencyName) => {
      const rootDependency = rootTomlConfig.tool.poetry.group.dev.dependencies[dependencyName];
      const projectDependency = projectTomlConfig.tool.poetry.group.dev.dependencies[dependencyName];

      if (isObject(projectDependency) && projectDependency.path) {
        if (rootDependency === undefined)
          rootTomlConfig.tool.poetry.dependencies[dependencyName] = {
            develop: true,
            path: path.join(workspaceLayout().libsDir, projectDependency.path.replace(/^(\.\.\/)*/, '')),
          };

        return;
      }

      if (
        rootDependency &&
        projectDependency &&
        !checkVersionCompatible(rootDependency, projectDependency, dependencyName)
      )
        throw new Error(
          `Dependency version mismatch for ${dependencyName}. Got version ${
            isObject(projectDependency) ? projectDependency.version : projectDependency
          } in ${projectTomlConfig.tool.poetry.name} and ${
            isObject(rootDependency) ? rootDependency.version : rootDependency
          } in shared virtual environment. Resolve the dependency conflict before proceeding.`,
        );

      if (rootDependency === undefined) rootTomlConfig.tool.poetry.dependencies[dependencyName] = projectDependency;
    });
  }
}
