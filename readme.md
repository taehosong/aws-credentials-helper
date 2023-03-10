### Usage

```
$ npm install -g aws-credentials-helper
$ awscreds-custom login --profile=PROFILE
```

~/.aws/config
```
[profile YYYYY]
credential_process=awscreds-custom get --profile PROFILE
region=ap-northeast-2
```

```
export AWS_PROFILE=YYYYY
```
