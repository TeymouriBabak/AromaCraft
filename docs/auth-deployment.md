## SMS and Avatar Storage Configuration

This document describes how to wire a real SMS provider (Twilio or AWS SNS) and S3 avatar storage.

Environment variables

- `SMS_PROVIDER`: `mock` (default), `twilio`, or `sns`.
- `SMS_MOCK_ENDPOINT`: URL used when `mock` provider is selected.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`: required for Twilio.
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`: required for SNS or S3.
- `AVATAR_STORAGE`: `local` (default) or `s3`.
- `AVATAR_S3_BUCKET`, `AVATAR_S3_REGION`: required when `AVATAR_STORAGE=s3`.

Twilio example

1. Set `SMS_PROVIDER=twilio` and fill `TWILIO_*` values.
2. No additional packages are required — the code uses the Twilio HTTP API directly.

AWS SNS / S3 example

1. Set `SMS_PROVIDER=sns` and set AWS credentials and `AWS_REGION`.
2. To store avatars in S3, set `AVATAR_STORAGE=s3`, `AVATAR_S3_BUCKET`, and `AVATAR_S3_REGION`.
3. Install the AWS SDK if you plan to use SNS or S3:

```bash
npm install @aws-sdk/client-sns @aws-sdk/client-s3
```

Local development

- For local SMS testing leave `SMS_PROVIDER=mock` and run a simple server to accept POST requests to `SMS_MOCK_ENDPOINT`.
- Avatars default to `public/uploads` when `AVATAR_STORAGE=local`.
