const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const db = require('../../app/db/models');
const path = require('path');

const service = async (data, handler = false) => {
    try {
        const resMessage = new Array();
        const promises = data?.sendTo?.map(async (app) => {
            if (app.sendTo) {
                const reqData = new FormData();
                reqData.append('authToken', data.token);
                reqData.append('name', app?.name);
                reqData.append('sendto', app.sendTo);

                if (data.isBulk === 'true' && data.data && data.data?.length > 0) {
                    if (data.modalType === 'lead') {
                        var lead = await db.Lead.findOne({
                            where: {
                                id: app?.id,
                            },
                            include: [
                                {
                                    model: db.Salutation,
                                    as: 'Salutation',
                                    attributes: ['id', 'name'],
                                },
                                {
                                    model: db.BuyingRole,
                                    as: 'BuyingRole',
                                    attributes: ['id', 'name'],
                                },
                                {
                                    model: db.Company,
                                    as: 'Company',
                                    attributes: ['id', 'name', 'state', 'street', 'industryId', 'city', 'pincode', 'country'],
                                    include: [
                                        {
                                            model: db.Industry,
                                            as: 'Industry',
                                            attributes: ['id', 'name'],
                                        },
                                    ],
                                },
                                {
                                    model: db.Department,
                                    as: 'Department',
                                    attributes: ['id', 'name'],
                                },
                                {
                                    model: db.LeadSource,
                                    as: 'LeadSource',
                                    attributes: ['id', 'name'],
                                },
                                {
                                    model: db.DispositionStatus,
                                    as: 'DispositionStatus',
                                    attributes: ['id', 'name'],
                                },
                                {
                                    model: db.User,
                                    as: 'LeadOwner',
                                    attributes: ['id', 'firstName', 'lastName', 'fullName'],
                                },
                            ],
                        });

                        lead = JSON.parse(JSON.stringify(lead));

                        data.data.forEach((item, index) => {
                            const keys = item.split('.');
                            let value = lead;
                            for (const key of keys) {
                                value = value ? value[key] : undefined;
                            }

                            reqData.append(`data[${index}]`, value !== undefined ? value : item);
                        });
                    } else if (data.modalType === 'contact') {
                        var contact = await db.Contact.findOne({
                            where: {
                                id: app?.id,
                            },
                            include: [
                                {
                                    model: db.Salutation,
                                    as: 'Salutation',
                                    attributes: ['id', 'name'],
                                },
                                {
                                    model: db.BuyingRole,
                                    as: 'BuyingRole',
                                    attributes: ['id', 'name'],
                                },
                                {
                                    model: db.Account,
                                    as: 'Account',
                                    attributes: ['id'],
                                    include: [
                                        {
                                            model: db.Company,
                                            as: 'Company',
                                            attributes: ['id', 'name'],
                                        },
                                    ],
                                },
                                {
                                    model: db.Department,
                                    as: 'Department',
                                    attributes: ['id', 'name'],
                                },
                                {
                                    model: db.LeadSource,
                                    as: 'LeadSource',
                                    attributes: ['id', 'name'],
                                },
                                {
                                    model: db.DispositionStatus,
                                    as: 'DispositionStatus',
                                    attributes: ['id', 'name'],
                                },
                                {
                                    model: db.User,
                                    as: 'ContactOwner',
                                    attributes: ['id', 'firstName', 'lastName', 'fullName'],
                                },
                            ],
                        });

                        contact = JSON.parse(JSON.stringify(contact));

                        data?.data?.forEach((item, index) => {
                            const keys = item.split('.');
                            let value = contact;
                            for (const key of keys) {
                                value = value ? value[key] : undefined;
                            }

                            reqData.append(`data[${index}]`, value !== undefined ? value : item);
                        });
                    }
                } else {
                    if (data?.data && data?.data?.length > 0) {
                        data.data.forEach((item, index) => {
                            reqData.append(`data[${index}]`, item);
                        });
                    }
                }

                if (data?.buttonValue) {
                    reqData.append('buttonValue', data?.buttonValue);
                }
                if (data?.carouselCardButtonUrl && data.carouselCardButtonUrl.length > 0) {
                    reqData.append('carouselCardButtonUrl', data?.carouselCardButtonUrl);
                }
                if (data?.carouselCardBody && data.carouselCardBody.length > 0) {
                    reqData.append('carouselCardBody', data?.carouselCardBody);
                }
                if (data?.carouselCardHeader && data.carouselCardHeader.length > 0) {
                    data.carouselCardHeader.forEach((item, index) => {
                        const basePath = path.join(__dirname, '../..');
                        let link = process.env.NODE_ENV === 'production' ? basePath + item : process.env.CLOUDFLARED_URL + item;
                        reqData.append(`carouselCardHeader[${index}]`, link);
                    });
                }

                reqData.append('originWebsite', data?.originWebsite);
                reqData.append('templateName', data?.templateName);
                reqData.append('language', data?.language || 'en');
                if (data.extraData) {
                    data.extraData?.forEach((item) => {
                        for (let key in item) {
                            reqData.append(key, item[key]);
                        }
                    });
                }
                if (data?.filePath) {
                    reqData.append('myfile', fs.createReadStream(data.filePath));
                }

                const config = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url: process.env.ONEONEZA_API_URL,
                    headers: {
                        ...reqData.getHeaders(),
                    },
                    data: reqData,
                };

                try {
                    const response = await axios.request(config);
                    resMessage.push(response.data);
                } catch (error) {
                    console.error('Axios error:', error);
                    resMessage.push(error.response.data);
                    if (handler) return error.response.data;
                }
            } else {
                resMessage.push({
                    Message: 'Message Sent',
                    Status: 200,
                });
            }
        });

        await Promise.all(promises);
        return resMessage;
    } catch (err) {
        console.error('Service error:', err.message);
        if (handler) return err;
    }
};
module.exports = {
    service,
};
