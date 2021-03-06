import updateNotifier from 'update-notifier';
import yargs from 'yargs';

import checkForUpdate from './checkForUpdate';
import { build } from './index';
import generateAppID from './generateAppID';

checkForUpdate(updateNotifier);

yargs
    .help()
    .command(
      // $0 makes this the default command
      ['build', '$0'],
      'Build application',
      args => args
        .option('native-device-component', {
          description: 'Bundle native device component (specify multiple times, once per path)',
          array: true,
          hidden: true,
        }),
      ({ nativeDeviceComponent }) => {
        return build({ nativeDeviceComponentPaths: nativeDeviceComponent }).catch((error) => {
          process.exitCode = 1;
          if (error) console.error(error);
        });
      },
    )
    .command(
      ['generate-appid'],
      'Generate and write a new app ID into your package.json',
      args => args,
      () => generateAppID(),
    )
  .argv;
