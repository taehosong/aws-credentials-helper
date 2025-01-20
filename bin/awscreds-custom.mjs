#!/usr/bin/env node

import { STS } from '@aws-sdk/client-sts';
import inquirer from 'inquirer';
import { parse } from 'ini';
import fs from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'path';
import { Command } from 'commander'; // https://www.npmjs.com/package/commander

class AwsCredentialsCustom {
  constructor(profileName) {
    this.profileName = profileName;

    const credentialFile = fs.readFileSync(
      resolve(homedir(), '.aws/credentials'),
      'utf8'
    );
    const configFile = fs.readFileSync(
      resolve(homedir(), '.aws/config'),
      'utf8'
    );

    this.credentialProfile = parse(credentialFile);
    this.configProfile = parse(configFile);

    this.cache = new AwsCredentialsFileCache(
      resolve(homedir(), `.aws/.aws-credentials-cache-${profileName}`)
    );
  }

  async login() {
    const config = this._parseProfile(this.profileName);
    if (config.role_arn && config.mfa_serial) {
      const { tokenCode } = await inquirer.prompt([
        {
          message: `Enter MFA code:`,
          name: 'tokenCode',
        },
      ]);

      const sts = new STS({
        region: config.region,
        credentials: {
          accessKeyId: config.aws_access_key_id,
          secretAccessKey: config.aws_secret_access_key,
        },
      });

      const assumeRole = await sts.assumeRole({
        RoleArn: config.role_arn,
        RoleSessionName: `${this.profileName}-profile-session`,
        SerialNumber: config.mfa_serial,
        TokenCode: tokenCode,
      });

      const credentials = {
        Version: 1,
        ...assumeRole.Credentials,
      };

      this.cache.set(credentials);
      return credentials;
    }    
  }

  async get() {
    return await this.cache.get();
  }

  async getCredentials() {
    const credentials = await this.cache.get();
    if (credentials !== null) {
      return credentials;
    }

    const config = this._parseProfile(this.profileName);
    if (config.role_arn && config.mfa_serial) {
      const { tokenCode } = await inquirer.prompt([
        {
          message: `Enter MFA code:`,
          name: 'tokenCode',
        },
      ]);

      const sts = new STS({
        region: config.region,
        credentials: {
          accessKeyId: config.aws_access_key_id,
          secretAccessKey: config.aws_secret_access_key,
        },
      });

      const assumeRole = await sts.assumeRole({
        RoleArn: config.role_arn,
        RoleSessionName: `${this.profileName}-profile-session`,
        SerialNumber: config.mfa_serial,
        TokenCode: tokenCode,
      });

      const credentials = {
        Version: 1,
        ...assumeRole.Credentials,
      };
      this.cache.set(credentials);
      return credentials;
    } else {
      throw new Error('TODO: implement non-MFA case.');
    }
  }

  _findProfile(profile, profileName) {
    if (profileName === 'default') {
      return profile.default;
    }
    return profile[`profile ${profileName}`] || profile[profileName];
  }

  _parseProfile(profileName) {
    const config = this._findProfile(this.configProfile, profileName);
    const credential = config.source_profile
      ? {
          ...this._findProfile(this.credentialProfile, config.source_profile),
          ...this._findProfile(this.configProfile, config.source_profile),
        }
      : this._findProfile(this.credentialProfile, profileName);

    return {
      ...config,
      ...credential,
    };
  }
}

class AwsCredentialsFileCache {
  constructor(filepath) {
    this.filepath = filepath;
  }

  async get() {
    try {
      const credentials = JSON.parse(
        fs.readFileSync(this.filepath, 'utf8') ?? {}
      );
      if (credentials.Expiration === undefined) {
        return null;
      }

      if (Date.now() >= new Date(credentials.Expiration).getTime()) {
        return null;
      }

      return credentials;
    } catch (e) {
      return null;
    }
  }

  set(credentials) {
    fs.writeFileSync(this.filepath, JSON.stringify(credentials), 'utf8');
  }
}

const program = new Command();
program
  .name('awscreds-custom')
  .description('Sourcing credentials with an external process')
  .version('0.1.0');

program.command('login')
  .requiredOption('--profile <aws profile>', 'AWS profile name')
  .action(async (options) => {
    const awsCredsCache = new AwsCredentialsCustom(options.profile);
    await awsCredsCache.login();
})

program.command('get')
  .requiredOption('--profile <aws profile>', 'AWS profile name')
  .action(async (options) => {
    const awsCredsCache = new AwsCredentialsCustom(options.profile);
    const credentials = await awsCredsCache.get();
    if (credentials === null) {
      console.error('No credentials found.');
      console.error('Please run `awscreds-custom login` first.');
      console.error(`Command: awscreds-custom login --profile ${options.profile}`);
      process.exit(1);
    }
    process.stdout.write(JSON.stringify(credentials, null, 2));
})

// program
//   .requiredOption('--profile <aws profile>', 'AWS profile name')

await program.parseAsync(process.argv);

// https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sourcing-external.html

// const awsCredsCache = new AwsCredentialsCustom(program.opts().profile);
// const credentials = await awsCredsCache.getCredentials();
// process.stdout.write(JSON.stringify(credentials, null, 2));
