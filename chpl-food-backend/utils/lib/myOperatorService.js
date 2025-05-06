const axios = require('axios');
const { addThirdPartyLog } = require('./common-function');
const myOperatorService = async (data, handler = false) => {
    try {
        const { body, userId, db, transaction } = data.logObject;
        delete data.logObject;
        let bodyData = {
            company_id: data.companyId,
            secret_token: data.secretKey,
            type: '1',
            number: data.number,
            public_ivr_id: data.publicIvrId,
            reference_id: data.referenceId,
        };
        if (data?.myOperatorFlag === '0') {
            bodyData.user_id = data.myOperatorUserId;
        } else {
            bodyData.number_2 = data?.countryCode + data.number_2;
        }

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: process.env.MYOPERATOR_API_URL,
            headers: {
                'x-api-key': data.apiKey,
                'Content-Type': 'application/json',
            },
            data: JSON.stringify(bodyData),
        };

        try {
            const response = await axios.request(config);

            if (Number(response.data.code) === 200) {
                const logThirdPartyData = {
                    operatorType: 'myoperator',
                    link: config.url,
                    method: 'POST',
                    action: 'Schedule myoperator call',
                    request: body,
                    response: response.data,
                    createdAt: new Date(),
                    createdBy: userId,
                };
                await addThirdPartyLog(logThirdPartyData, { db, transaction });
            }
            return response.data;
        } catch (error) {
            // console.error('Axios error:', error?.response?.data);
            return error?.response?.data;
        }
    } catch (err) {
        console.error('Service error:', err.message);
        return err.message;
    }
};

module.exports = {
    myOperatorService,
};
