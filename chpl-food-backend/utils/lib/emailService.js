const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const { enums, status } = require('..');
const db = require('../../app/db/models');
const { Status } = require('./enums');
const fs = require('fs').promises;
const { addThirdPartyLog } = require('../../utils/lib/common-function');
const { v4: uuidv4 } = require('uuid');
const { google } = require('googleapis');
const moment = require('moment');
const { logger } = require('./logger');

const getAccessToken = async (emailConfig) => {
    try {
        const oauth2Client = new google.auth.OAuth2(process.env.GMAIL_CLIENT_ID, process.env.GMAIL_CLIENT_SECRET, emailConfig.redirectUri);
        oauth2Client.setCredentials({
            refresh_token: emailConfig.refreshToken,
        });

        const { token } = await oauth2Client.getAccessToken();
        if (!token) throw new Error('Access token not generated');
        return token;
    } catch (err) {
        console.error('Error getting access token:', err);
        return { status: status.InternalServerError, message: err.message };
    }
};

exports.sendEmail = async (data, emailConfig) => {
    try {
        let transporter;
        let accessToken;

        if (emailConfig.emailType === enums.EmailType.Gmail) {
            accessToken = await getAccessToken(emailConfig);
        }

        switch (emailConfig.emailType) {
            case enums.EmailType.Gmail:
                transporter = nodemailer.createTransport({
                    service: emailConfig.service,
                    auth: {
                        type: 'OAuth2',
                        user: emailConfig.emailId,
                        clientId: process.env.GMAIL_CLIENT_ID,
                        clientSecret: process.env.GMAIL_CLIENT_SECRET,
                        refreshToken: emailConfig.refresh_token,
                        accessToken: accessToken,
                    },
                });
                break;
            case enums.EmailType.SendGrid:
                sgMail.setApiKey(emailConfig.apiKey);
                transporter = sgMail;
                break;
            default:
                transporter = nodemailer.createTransport({
                    service: emailConfig.service,
                    host: emailConfig.host,
                    port: emailConfig.port,
                    auth: {
                        user: emailConfig.emailId,
                        pass: emailConfig.password,
                    },
                });
        }
        for (const recipient of data) {
            let attachments = [];
            if (recipient.attachments && recipient.attachments.length > 0) {
                for (const attachment of recipient.attachments) {
                    var fileContent = await fs.readFile(attachment.path, { encoding: 'base64' });

                    if (emailConfig.emailType === enums.EmailType.Gmail || emailConfig.emailType === enums.EmailType.Other) {
                        fileContent = Buffer.from(fileContent, 'base64');
                    }

                    attachments.push({
                        content: fileContent,
                        filename: attachment.originalname,
                        type: attachment.mimetype,
                        disposition: 'attachment',
                        content_id: 'mytext',
                    });
                }
            }
            const mailOptions = {
                from: emailConfig.emailId,
                to: recipient.sendTo,
                subject: recipient.subject,
                html: recipient.html,
                cc: recipient.cc ? recipient.cc.split(',') : [],
                bcc: recipient.bcc ? recipient.bcc.split(',') : [],
                attachments: attachments,
            };
            let response;
            if (emailConfig.emailType === enums.EmailType.SendGrid) {
                mailOptions.customArgs = {
                    emailsId: recipient.emailsId,
                };
                response = await transporter.send(mailOptions);

                const logThirdPartyData = {
                    operatorType: 'sendgrid',
                    link: 'https://sendgrid.com/',
                    method: 'POST',
                    action: 'Send sendgrid email',
                    request: recipient,
                    response: response[0],
                    createdAt: new Date(),
                    createdBy: recipient.userId,
                };
                await addThirdPartyLog(logThirdPartyData, { db });
            } else {
                response = await transporter.sendMail(mailOptions);
                const logThirdPartyData = {
                    operatorType: 'smtp',
                    link: emailConfig.host,
                    method: 'POST',
                    action: 'Send smtp email',
                    request: recipient,
                    response: response,
                    createdAt: new Date(),
                    createdBy: recipient.userId,
                };
                await addThirdPartyLog(logThirdPartyData, { db });
            }
            await db.Emails.update(
                {
                    messageId: response.messageId ? response.messageId : uuidv4(),
                },
                {
                    where: { id: recipient.emailsId, deletedAt: null },
                }
            );
        }
        return { status: status.OK, message: 'Ok' };
    } catch (err) {
        return { status: status.InternalServerError, message: err.message };
    }
};

exports.cronSendEmail = async (data, transaction) => {
    try {
        const emailConfigs = await db.EmailConfiguration.findAll({
            where: {
                deletedAt: null,
                status: Status.Active.value,
            },
            order: [['createdAt', 'DESC']],
            transaction,
            disableTenantCheck: true,
        });
        if (!emailConfigs.length) {
            return { status: status.NotFound, message: 'No email configuration found' };
        }
        for (const recipient of data) {
            let attachments = [];
            const emailConfig = emailConfigs.find((item) => item.tenantId === recipient.tenantId);
            if (emailConfig) {
                if (recipient.attachments && recipient.attachments.length > 0) {
                    for (const attachment of recipient.attachments) {
                        var fileContent = await fs.readFile(attachment.path, { encoding: 'base64' });

                        if (emailConfig.emailType === enums.EmailType.Gmail || emailConfig.emailType === enums.EmailType.Other) {
                            fileContent = Buffer.from(fileContent, 'base64');
                        }

                        attachments.push({
                            content: fileContent,
                            filename: attachment.originalname,
                            type: attachment.mimetype,
                            disposition: 'attachment',
                            content_id: 'mytext',
                        });
                    }
                }

                logger.error(
                    `emailConfig: ${JSON.stringify(emailConfig)}, LoginTime: ${moment(new Date()).format('MMM-DD-YYYY HH:mm:ss')}`
                );
                logger.error(`recipient: ${JSON.stringify(recipient)}, LoginTime: ${moment(new Date()).format('MMM-DD-YYYY HH:mm:ss')}`);
                const mailOptions = {
                    from: emailConfig.emailId,
                    to: recipient.sendTo,
                    subject: recipient.subject,
                    html: recipient.html,
                    cc: recipient.cc ? recipient.cc.split(',') : [],
                    bcc: recipient.bcc ? recipient.bcc.split(',') : [],
                    attachments: attachments,
                };
                let transporter;
                let accessToken;

                if (emailConfig.emailType === enums.EmailType.Gmail) {
                    accessToken = await getAccessToken(emailConfig);
                }

                switch (emailConfig.emailType) {
                    case enums.EmailType.Gmail:
                        transporter = nodemailer.createTransport({
                            service: emailConfig.service,
                            auth: {
                                type: 'OAuth2',
                                user: emailConfig.emailId,
                                clientId: process.env.GMAIL_CLIENT_ID,
                                clientSecret: process.env.GMAIL_CLIENT_SECRET,
                                refreshToken: emailConfig.refresh_token,
                                accessToken: accessToken,
                            },
                        });
                        break;
                    case enums.EmailType.SendGrid:
                        sgMail.setApiKey(emailConfig.apiKey);
                        transporter = sgMail;
                        break;
                    default:
                        transporter = nodemailer.createTransport({
                            service: emailConfig.service,
                            host: emailConfig.host,
                            port: emailConfig.port,
                            auth: {
                                user: emailConfig.emailId,
                                pass: emailConfig.password,
                            },
                        });
                }
                let response;
                if (emailConfig.emailType === enums.EmailType.SendGrid) {
                    mailOptions.customArgs = {
                        emailsId: recipient.emailsId,
                    };
                    response = await transporter.send(mailOptions);
                    const logThirdPartyData = {
                        operatorType: 'sendgrid',
                        link: 'https://sendgrid.com/',
                        method: 'POST',
                        action: 'Send schedule sendgrid email',
                        request: recipient,
                        response: response[0],
                        createdAt: new Date(),
                        createdBy: null,
                        tenantId: recipient.tenantId,
                    };
                    await addThirdPartyLog(logThirdPartyData, { db, transaction });
                } else {
                    response = await transporter.sendMail(mailOptions);
                    const logThirdPartyData = {
                        operatorType: 'smtp',
                        link: emailConfig.host,
                        method: 'POST',
                        action: 'Send schedule smtp email',
                        request: recipient,
                        response: response,
                        createdAt: new Date(),
                        createdBy: null,
                        tenantId: recipient.tenantId,
                    };
                    await addThirdPartyLog(logThirdPartyData, { db, transaction });
                }
                await db.Emails.update(
                    {
                        emailType: enums.SentEmailType.Sent,
                        sentDate: db.Sequelize.literal('CURRENT_TIMESTAMP'),
                        from: emailConfig.emailId,
                        messageId: response.messageId ? response.messageId : uuidv4(),
                    },
                    {
                        where: { id: recipient.emailsId, deletedAt: null },
                        transaction,
                    }
                );
            }
        }
        return { status: status.OK, message: 'Ok' };
    } catch (err) {
        return { status: status.InternalServerError, message: err.message };
    }
};

exports.cronNotificationSendEmail = async (data, transaction) => {
    try {
        const emailConfigs = await db.EmailConfiguration.findAll({
            where: {
                deletedAt: null,
                status: Status.Active.value,
            },
            order: [['createdAt', 'DESC']],
            transaction,
            disableTenantCheck: true,
        });
        if (!emailConfigs.length) {
            return { status: status.NotFound, message: 'No email configuration found' };
        }
        for (const recipient of data) {
            let attachments = [];
            const emailConfig = emailConfigs.find((item) => item.tenantId === recipient.tenantId);
            if (emailConfig) {
                if (recipient.attachments && recipient.attachments.length > 0) {
                    for (const attachment of recipient.attachments) {
                        var fileContent = await fs.readFile(attachment.path, { encoding: 'base64' });

                        if (emailConfig.emailType === enums.EmailType.Gmail || emailConfig.emailType === enums.EmailType.Other) {
                            fileContent = Buffer.from(fileContent, 'base64');
                        }

                        attachments.push({
                            content: fileContent,
                            filename: attachment.originalname,
                            type: attachment.mimetype,
                            disposition: 'attachment',
                            content_id: 'mytext',
                        });
                    }
                }
                const mailOptions = {
                    from: emailConfig.emailId,
                    to: recipient.sendTo,
                    subject: recipient.subject,
                    html: recipient.html,
                    cc: recipient.cc ? recipient.cc.split(',') : [],
                    bcc: recipient.bcc ? recipient.bcc.split(',') : [],
                    attachments: attachments,
                };
                let transporter;
                let accessToken;

                if (emailConfig.emailType === enums.EmailType.Gmail) {
                    accessToken = await getAccessToken(emailConfig);
                }

                switch (emailConfig.emailType) {
                    case enums.EmailType.Gmail:
                        transporter = nodemailer.createTransport({
                            service: emailConfig.service,
                            auth: {
                                type: 'OAuth2',
                                user: emailConfig.emailId,
                                clientId: process.env.GMAIL_CLIENT_ID,
                                clientSecret: process.env.GMAIL_CLIENT_SECRET,
                                refreshToken: emailConfig.refresh_token,
                                accessToken: accessToken,
                            },
                        });
                        break;
                    case enums.EmailType.SendGrid:
                        sgMail.setApiKey(emailConfig.apiKey);
                        transporter = sgMail;
                        break;
                    default:
                        transporter = nodemailer.createTransport({
                            service: emailConfig.service,
                            host: emailConfig.host,
                            port: emailConfig.port,
                            auth: {
                                user: emailConfig.emailId,
                                pass: emailConfig.password,
                            },
                        });
                }
                if (emailConfig.emailType === enums.EmailType.SendGrid) {
                    mailOptions.customArgs = {
                        emailsId: recipient.emailsId,
                    };
                    const response = await transporter.send(mailOptions);
                    const logThirdPartyData = {
                        operatorType: 'sendgrid',
                        link: 'https://sendgrid.com/',
                        method: 'POST',
                        action: 'Send sendgrid email',
                        request: recipient,
                        response: response[0],
                        createdAt: new Date(),
                        createdBy: null,
                        tenantId: recipient.tenantId,
                    };
                    await addThirdPartyLog(logThirdPartyData, { db, transaction });
                } else {
                    const response = await transporter.sendMail(mailOptions);
                    const logThirdPartyData = {
                        operatorType: 'smtp',
                        link: emailConfig.host,
                        method: 'POST',
                        action: 'Send smtp email',
                        request: recipient,
                        response: response,
                        createdAt: new Date(),
                        createdBy: null,
                        tenantId: recipient.tenantId,
                    };
                    await addThirdPartyLog(logThirdPartyData, { db, transaction });
                }
            }
        }
        return { status: status.OK, message: 'Ok' };
    } catch (err) {
        return { status: status.InternalServerError, message: err.message };
    }
};

/* exports.replacePlaceholders = (template, data) => {
    try {
        return template
            .replace(/{{firstName}}/g, data?.firstName || '-')
            .replace(/{{lastName}}/g, data?.lastName || '-')
            .replace(/{{email}}/g, data?.email || '-')
            .replace(/{{mobile}}/g, data?.mobile || '-')
            .replace(/{{phone}}/g, data?.phone || '-')
            .replace(/{{title}}/g, data?.title || '-')
            .replace(/{{dueDate}}/g, data?.formattedDueDate || '-')
            .replace(/{{priority}}/g, data?.priority || '-')
            .replace(/{{reminder}}/g, data?.formattedReminder || '-')
            .replace(/{{reminderType}}/g, data?.reminderType || '-')
            .replace(/{{startDate}}/g, data?.formattedStartDate || '-')
            .replace(/{{location}}/g, data?.location || '-')
            .replace(/{{fromDate}}/g, data?.formattedFromDate || '-')
            .replace(/{{toDate}}/g, data?.formattedToDate || '-')
            .replace(/{{meetingType}}/g, data?.meetingType || '-')
            .replace(/{{type}}/g, data?.type || '-')
            .replace(/{{priorityClass}}/g, data?.priority?.toLowerCase() || '-')
            .replace(/{{tableBody}}/g, data?.tableBody || '-');
    } catch (err) {
        console.log('Error in Set html replace placeholders', err);
        return null;
    }
}; */

exports.replacePlaceholders = (template, data) => {
    try {
        let result = template
            .replace(/{{firstName}}/g, data?.firstName || '-')
            .replace(/{{lastName}}/g, data?.lastName || '-')
            .replace(/{{email}}/g, data?.email || '-')
            .replace(/{{mobile}}/g, data?.mobile || '-')
            .replace(/{{phone}}/g, data?.phone || '-')
            .replace(/{{title}}/g, data?.title || '-')
            .replace(/{{dueDate}}/g, data?.formattedDueDate || '-')
            .replace(/{{priority}}/g, data?.priority || '-')
            .replace(/{{reminder}}/g, data?.formattedReminder || '-')
            .replace(/{{reminderType}}/g, data?.reminderType || '-')
            .replace(/{{startDate}}/g, data?.formattedStartDate || '-')
            .replace(/{{location}}/g, data?.location || '-')
            .replace(/{{fromDate}}/g, data?.formattedFromDate || '-')
            .replace(/{{toDate}}/g, data?.formattedToDate || '-')
            .replace(/{{meetingType}}/g, data?.meetingType || '-')
            .replace(/{{type}}/g, data?.type || '-')
            .replace(/{{priorityClass}}/g, data?.priority?.toLowerCase() || '-')
            .replace(/{{tableBody}}/g, data?.tableBody || '-');

        if (data?.CustomFieldValue && Array.isArray(data.CustomFieldValue)) {
            const groupedCustomFields = data.CustomFieldValue.reduce((acc, customField) => {
                const fieldName = customField.CustomField.field;
                if (!acc[fieldName]) {
                    acc[fieldName] = [];
                }
                acc[fieldName].push(customField.value || '-');
                return acc;
            }, {});

            for (const field in groupedCustomFields) {
                const fieldPlaceholder = `{{${field}}}`;
                let values = groupedCustomFields[field];

                if (field.toLowerCase().includes('datetime')) {
                    values = values.map((value) => moment(value).tz('Asia/Kolkata').format('MMM DD YYYY HH:mm:ss'));
                } else if (field.toLowerCase().includes('date')) {
                    values = values.map((value) => moment(value).tz('Asia/Kolkata').format('MMM DD YYYY'));
                }
                const formattedValues = values.join(', ');
                result = result.replace(new RegExp(fieldPlaceholder, 'g'), formattedValues);
            }
        }

        return result;
    } catch (err) {
        console.log('Error in Set html replace placeholders', err);
        return null;
    }
};
