// const { Op } = require('sequelize');
const db = require('../../../app/db/models');
const { status } = require('../..');
// const { cronSendEmail, replacePlaceholders } = require('../emailService');
// const moment = require('moment');

exports.dailyReportMail = async () => {
    const transaction = await db.sequelize.transaction();
    try {
        // const currentTime = moment().tz('Asia/Kolkata').format('HH:mm') + ':00';
        // console.log(currentTime);
    } catch (err) {
        console.log(err);
        await transaction.rollback();
        return { status: status.InternalServerError, message: err.message };
    }
};
