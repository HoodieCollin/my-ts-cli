import { env } from '@@/helpers';
import PrettyError from 'pretty-error';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

(async function run() {
  await yargs(hideBin(process.argv))
    .usage('__my-ts-cli__ [opts] <cmd> [cmd-opts]')
    .options({
      silent: {
        alias: 'q',
        type: 'boolean',
        description: 'suppresses logging',
        default: env.silent,
      },
      prettyErr: {
        type: 'boolean',
        description: 'use "pretty-error" to render errors',
        default: env.pretty_errors,
      },
    })
    .middleware((argv) => {
      if (argv.prettyErr) {
        PrettyError.start();
      }
    })
    .commandDir('commands')
    .demandCommand()
    .showHelpOnFail(true).argv;
})();
