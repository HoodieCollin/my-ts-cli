import {} from 'fs-extra';
import {} from 'inquirer';

export const command = 'main';

export const describe = '__my-ts-cli__ is the going to be something great';

export const handler = async () => {
  console.log(describe);
};

export default handler;
