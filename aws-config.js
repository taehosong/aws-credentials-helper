const fs = require('fs');
const path = require('path');
const { homedir } = require('os');
const { parse } = require('ini');
/**
 * Read ~/.aws/config
 *
 * @param { string } profile
 * @returns {{mfa_serial: string, role_arn: string, role_session_name: string}}
 */
function getAWSConfig(profile = 'default') {
  const configFilePath = path.resolve(homedir(), '.aws/config');
  try {
    const content = fs.readFileSync(configFilePath, 'utf8');
    return profile === 'default' 
      ? parse(content)['default']
      : parse(content)[`profile ${profile}`];
  } catch (e) {
    throw new Error(`Cannot read file: ${configFilePath}`);
  }
}

function isMFAConfig(config) {
  return config.mfa_serial && config.role_arn;
}

module.exports.getAWSConfig = getAWSConfig;
module.exports.isMFAConfig = isMFAConfig;
