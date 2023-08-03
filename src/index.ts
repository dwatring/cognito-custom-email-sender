import { buildClient, CommitmentPolicy, KmsKeyringNode } from '@aws-crypto/client-node';
import { toByteArray } from 'base64-js';
import { CustomEmailSenderTriggerEvent } from 'aws-lambda';
import sendgrid from '@sendgrid/mail';
import { MailDataRequired } from '@sendgrid/helpers/classes/mail';
import { StringMap } from 'aws-lambda/trigger/cognito-user-pool-trigger/_common';

// GO LIBRARY: github.com/sendgrid/sendgrid-go

async function getPlainTextCode(event: CustomEmailSenderTriggerEvent) {
    if (!event.request.code) {
        throw Error('Could not find code');
    }

    if (!process.env.KEY_ID) {
        throw Error('Cannot decrypt code');
    }

    const client = buildClient(CommitmentPolicy.REQUIRE_ENCRYPT_ALLOW_DECRYPT);
    const generatorKeyId = process.env.KEY_ALIAS;
    const keyIds = [process.env.KEY_ID];
    const keyring = new KmsKeyringNode({ generatorKeyId, keyIds });

    let plainTextCode: string | undefined = undefined;
    const decryptOutput = await client.decrypt(keyring, toByteArray(event.request.code));
    plainTextCode = decryptOutput.plaintext.toString();

    return plainTextCode;
}

function createMessageObject(toEmail: string, plainTextCode: string, subject: string): MailDataRequired {
    return {
        from: 'webmaster@badtrader.app',
        subject: 'Confirmation Code',
        personalizations: [
            {
                to: [
                    {
                        email: toEmail
                    }
                ],
                dynamicTemplateData: {
                    code: plainTextCode
                }
            }
        ],
        templateId: 'd-ecfc21b583864eee893d01ef12ccc575'
    };
}

function generateMessageToSend(event: CustomEmailSenderTriggerEvent, plainTextCode: string, toEmail: string) {
    let subject = '';

    const maskedEmail = toEmail.replace(/^(.)(.*)(.@.*)$/, (_, a, b, c) => a + b.replace(/./g, '*') + c);

    if (event.triggerSource == 'CustomEmailSender_SignUp') {
        console.info(`Sending sign up email to ${maskedEmail}`);
    } else if (event.triggerSource == 'CustomEmailSender_ForgotPassword') {
        console.info(`Sending forgotten password email to ${maskedEmail}`);
    } else if (event.triggerSource == 'CustomEmailSender_ResendCode') {
        console.info(`Resending confirmation code to ${maskedEmail}`);
    } else {
        console.info(`Unhandled event type: ${event.triggerSource}`);
        return;
    }

    return createMessageObject(toEmail, plainTextCode, templateId, subject);
}

export async function handler(event: CustomEmailSenderTriggerEvent): Promise<void> {
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

    const plainTextCode = await getPlainTextCode(event);
    const toEmail = (event.request.userAttributes as StringMap)['email'];
    const messageToSend: MailDataRequired | undefined = generateMessageToSend(event, plainTextCode, toEmail);

    if (messageToSend) {
        const response = await sendgrid.send(messageToSend);
        console.info(`Response Code: ${response[0].statusCode}, Message-ID: ${response[0].headers['x-message-id']}, Body: ${response[0].body}}`);
    }
}
