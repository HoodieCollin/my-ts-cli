import { defaultConfig } from '@@/default-config';
import { outputFile } from 'fs-extra';
import {} from 'ora';
import { resolve } from 'path';
import { stringify } from 'yaml';

export const command = 'init';

export const describe =
  'create a `.__my-ts-cli__.yml` config file in your current directory';

export const handler = async () => {
  await outputFile(
    resolve(process.cwd(), '.__my-ts-cli__.yml'),
    stringify(defaultConfig),
    'utf8'
  );
};

export default handler;
