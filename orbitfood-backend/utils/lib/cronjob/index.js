const { CronJob } = require('cron');
const { dailyReportMail } = require('./daily-report-email');

new CronJob(
    '* * * * *',
    function () {
        dailyReportMail();
    },
    null,
    true,
    'Asia/Kolkata'
);
