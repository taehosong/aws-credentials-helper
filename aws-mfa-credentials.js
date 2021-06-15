const { prompt } = require('inquirer');
const { STSClient, AssumeRoleCommand } = require("@aws-sdk/client-sts");


async function readMfaCodeFromPrompt() {
  const questions = [
    {
      type: 'input',
      name: 'code',
      message: 'input your MFA code:'
    }
  ];
  const answers = await prompt(questions);
  if (!answers.code) {
    throw new Error('MFA code required');
  }
  return answers.code;
}

async function getMFACredentials(region, awsConfig) {
  const tokenCode = await readMfaCodeFromPrompt();

  const stsClient = new STSClient({
    region: region
  });

  const command = new AssumeRoleCommand({
    RoleArn: awsConfig.role_arn,
    RoleSessionName: awsConfig.role_session_name,
    SerialNumber: awsConfig.mfa_serial,
    TokenCode: tokenCode
  });

  return stsClient.send(command).then(res => res.Credentials);
}

module.exports.getMFACredentials = getMFACredentials;