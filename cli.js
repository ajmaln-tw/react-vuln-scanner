// cli.js
const yargs = require('yargs');
const scanner = require('./src/scanner');

const options = yargs
    .command('scan [directory]', 'Scan a React.js project for vulnerabilities', (yargs) => {
        yargs.positional('directory', {
            describe: 'The directory to scan',
            default: '.',
        });
        yargs.option('type', {
            alias: 't',
            describe: 'Specify the file type (js or ts)',
            choices: ['js', 'ts'],
            default: 'js', // Set the default type to 'js'
        });
    })
    .help()
    .argv;

scanner(options.directory, options.type);
