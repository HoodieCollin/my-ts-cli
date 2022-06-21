import fs from 'fs-extra';
import { prompt, Separator } from 'inquirer';
import walk from 'klaw';
import {
  camelCase,
  kebabCase,
  snakeCase,
  toLower,
  toUpper,
  upperFirst,
  values,
} from 'lodash';
import ora from 'ora';
import { homedir } from 'os';
import { resolve } from 'path';
import PrettyError from 'pretty-error';
import simpleGit, { CloneOptions, SimpleGit } from 'simple-git';
import packageJson from '../../package.json';

const repoRoot = resolve(__dirname, '../../');
const tmpDirInUserHome = resolve(homedir(), '.my-ts-cli');

const useLocalRepo = '* copy local *';

async function run() {
  PrettyError.start();

  let version: string = `v${packageJson.version}`;

  if (process.env.NODE_ENV === 'development') {
    const { versionToUse } = await prompt<{ versionToUse: string }>([
      {
        type: 'list',
        name: 'versionToUse',
        message: 'Pick which version of `my-ts-cli` you want to use.',
        async choices() {
          const localGit: SimpleGit = simpleGit();

          return [
            useLocalRepo,
            new Separator('- tags --------------'),
            ...(await localGit.tags()).all,
          ];
        },
      },
    ]);

    version = versionToUse;
  }

  const { newName, addDotGit, shouldSetOrigin, remoteRepoUrl } = await prompt<{
    newName: string;
    addDotGit: boolean;
    shouldSetOrigin: boolean;
    remoteRepoUrl: string;
  }>([
    {
      type: 'input',
      name: 'newName',
      message: 'What is the name of your CLI? (as kebab lowercase)',
      validate(input: string = '') {
        if (input !== input.trimStart()) {
          return `Hmmm "${input}" has some leading whitespace.`;
        }

        if (input !== input.trimEnd()) {
          return `Hmmm "${input}" has some trailing whitespace.`;
        }

        const asKebabLower = toLower(kebabCase(input));

        if (input !== asKebabLower) {
          return `Hmmm expected "${input}" to look like "${asKebabLower}".`;
        }

        return true;
      },
    },
    {
      type: 'confirm',
      name: 'addDotGit',
      message: 'Would you like to add a `.git`folder to this CLI?',
    },
    {
      type: 'confirm',
      name: 'shouldSetOrigin',
      message: 'Do you have an existing remote Git repository?',
      when(answers) {
        return answers.addDotGit;
      },
    },
    {
      type: 'input',
      name: 'remoteRepoUrl',
      message: 'Provide the URL for your remote Git repository.',
      when(answers) {
        return answers.shouldSetOrigin;
      },
      validate(input = '') {
        return /(?:git|ssh|https?|git@[-\w.]+):(\/\/)?(.*?)(\.git)(\/?|\#[-\d\w._]+?)$/.test(
          input
        );
      },
    },
  ]);

  const names = {
    kebabLower: {
      placeholder: '__my-ts-cli__',
      value: toLower(kebabCase(newName)),
    },
    snakeUpper: {
      placeholder: '__MY_TS_CLI__',
      value: toUpper(snakeCase(newName)),
    },
    properName: {
      placeholder: '__MyTsCli__',
      value: upperFirst(camelCase(newName)),
    },
  };

  const pathToNewRepo = resolve(process.cwd(), names.kebabLower.value);

  const spinner = ora(`Repo cloning into: ${pathToNewRepo}`).start();

  try {
    if (version === useLocalRepo) {
      const tmpLocation = resolve(tmpDirInUserHome, Date.now().toString());

      await fs.ensureDir(tmpLocation);

      await fs.copy(repoRoot, tmpLocation, {
        filter: (src) => {
          if (/node_modules/.test(src)) {
            return false;
          }

          return true;
        },
      });

      await fs.move(tmpLocation, pathToNewRepo);

      await fs.remove(tmpLocation);

      const tmpDirInUserHomeContents = await fs.readdir(tmpDirInUserHome);

      if (!tmpDirInUserHomeContents.length) {
        await fs.remove(tmpDirInUserHome);
      }
    } else {
      await simpleGit().clone(packageJson.repository, pathToNewRepo, {
        '--branch': version,
        '--single-branch': null,
      } as CloneOptions);
    }

    await fs.remove(resolve(pathToNewRepo, '.git'));

    spinner.succeed(`Repo cloned into: ${pathToNewRepo}`);
  } catch (err) {
    spinner.fail(`Something went wrong while cloning`);

    throw err;
  }

  try {
    spinner.start('Removing ephemeral files');

    await fs.remove(resolve(pathToNewRepo, '__ephemeral'));

    spinner.succeed('Removed ephemeral files');
  } catch (err) {
    spinner.fail('Something when wrong when removing ephemeral files');

    throw err;
  }

  const newRepo: SimpleGit = simpleGit(pathToNewRepo);

  if (addDotGit) {
    try {
      spinner.start('Creating .git folder');

      await newRepo.init();

      spinner.succeed(`Created .git folder`);
    } catch (err) {
      spinner.fail(`Something went wrong when creating .git`);

      throw err;
    }
  }

  if (shouldSetOrigin) {
    try {
      spinner.start(`Setting up remote "origin": ${remoteRepoUrl}`);

      await newRepo.addRemote('origin', remoteRepoUrl);

      spinner.succeed(`Remote "origin" was created: ${remoteRepoUrl}`);
    } catch (err) {
      spinner.fail(`Something went wrong when setting up remote`);

      throw err;
    }
  }

  spinner.start('Replacing identifiers in the source code');

  const fileUpdates: Promise<any>[] = [];

  for await (const item of walk(pathToNewRepo)) {
    if (item.stats.isFile()) {
      let content = await fs.readFile(item.path, 'utf8');

      for (const { placeholder, value } of values(names)) {
        content = content.replace(new RegExp(placeholder, 'g'), value);
      }

      if (/package-lock\.json$/.test(item.path)) {
        const packageLockAsObject = JSON.parse(content);

        delete packageLockAsObject.packages[''].workspaces;
        delete packageLockAsObject.packages['__ephemeral/repackager'];
        delete packageLockAsObject.packages['node_modules/repackager'];
        delete packageLockAsObject.dependencies['repackager'];
      }

      if (/package\.json$/.test(item.path)) {
        const packageJsonAsObject = JSON.parse(content);

        delete packageJsonAsObject.workspaces;
      }

      fileUpdates.push(fs.writeFile(item.path, content, 'utf8'));
    }
  }

  await Promise.all(fileUpdates);

  spinner.succeed('Done!');
}

run().catch((err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});
