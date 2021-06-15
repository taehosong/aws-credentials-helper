const fs = require('fs');
const path = require('path');
const { homedir } = require('os');

const credTempFilePath = path.resolve(homedir(), '.aws/.aws-credentials-cache');

function write(key, roleResponse) {
  const data = read() ?? {};
  data[key] = roleResponse;

  fs.writeFileSync(credTempFilePath, JSON.stringify(data));
}

function read() {
  try {
    return JSON.parse(fs.readFileSync(credTempFilePath, 'utf8')) ?? {};
  } catch (e) {
    return null;
  }
}

function load(key) {
  const data = read();
  
  return data === null
    ? null
    : data[key];
}

module.exports.write = write;
module.exports.load = load;