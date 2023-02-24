const { fromIni } = require("@aws-sdk/credential-provider-ini");
const { isMFAConfig, getAWSConfig } = require('./aws-config');
const { getMFACredentials } = require('./aws-mfa-credentials');
const cache = require('./aws-credentials-cache');
async function getCredentials({
  profile = 'default', region
}) {

  const awsConfig = getAWSConfig(profile);
  if (region === undefined && awsConfig.region) {
    region = awsConfig.region
  }

  if (isMFAConfig(awsConfig)) {
    const cacheCredentials = cache.load(profile);
    if (cacheCredentials) {
      const isExpireCache = Date.now() >= new Date(cacheCredentials.expiration).getTime();

      if (isExpireCache === false) {
        return cacheCredentials;
      }
    }

    const repsCredentials = await getMFACredentials(region, awsConfig);
    const credentials = {
      Version: 1,
      AccessKeyId: repsCredentials.AccessKeyId,
      SecretAccessKey: repsCredentials.SecretAccessKey,
      SessionToken: repsCredentials.SessionToken,
      Expiration: repsCredentials.Expiration
    }

    cache.write(profile, credentials);

    return credentials;
  } else {
    return fromIni({ profile });
  }
}

module.exports.getCredentials = getCredentials;
