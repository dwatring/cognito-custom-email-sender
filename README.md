# cognito-custom-email-sender

A lambda which sends out custom emails for Cognito


## Configuration

### Environment variables

| Environment Variable | Description | Required |
| --- | --- | --- |
| KEY_ID | KMS key id to decrypt email code | Yes |
| KEY_ALIAS | Alias of the KMS key | Yes |
| SENDGRID_API_KEY | Api key to send email from sendgrid | Yes |


## Build

To build the lambda function run the following.

```
npm install
npm run build
```

## Test

To run the tests.

```
npm test
```

## Package

The following will package the lambda function into a zip bundle to allow manual deployment.

```
zip -q -r dist/lambda.zip node_modules dist
```

### Further changes to be made?
