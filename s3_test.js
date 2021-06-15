const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
const getCredentials = require('./aws-credentials');
const { program } = require('commander');

async function main() {
  program.version('0.0.1');
  program
    .option('--profile <profile>', 'aws profile')
    .option('--region <region>', 'aws region')
  
  program.parse(process.argv);
  
  const options = program.opts();
  const credentials = await getCredentials(options);
  
  const s3Client = new S3Client({
    credentials
  });
  
  const command = new ListBucketsCommand({});
  s3Client.send(command).then(console.log).catch(console.error);
  
}

main().catch(console.log);