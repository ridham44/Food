// const schedule = require('node-schedule');
// const axios = require('axios');
// const rule = new schedule.RecurrenceRule();

// const job2 = schedule.scheduleJob('* * */22 * * *', async function (fireDate) {
//     try {
//         let timeDate = new Date();
//         console.error('Day Shift - current', timeDate, '| fireDate', fireDate);
//         await axios.get(`${process.env.BACKEND_URL}/api/v1/sync-application`, {
//             headers: {
//                 Authorization:
//                     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiZTA2MmYwNGYtMzA0MS0xMWVkLThlY2ItZDg1ZWQzOTY5NWUxIiwiZW1haWwiOiJ2aXNod2FsQGtleXN0b25ldW5pdmVyc2UuY29tIiwic2lnbmF0dXJlIjoiM2Q3ODNmYTE4MWQ1YjE4NiJ9LCJpYXQiOjE2ODAyNDMxODEsImV4cCI6MTY4MDMyOTU4MX0.FbxS1DGjU_hG0Ef4a5NGNmYjPj1fwP4wDuvfQaw88v8',
//             },
//         });
//     } catch (err) {
//         console.error('CRON Error !!', err?.message);
//     }
// });
