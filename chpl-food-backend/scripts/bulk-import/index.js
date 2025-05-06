'use strict';

const db = require('../../app/db/models/');
const data = require('./data');

async function bulkImport() {
    const transaction = await db.sequelize.transaction();
    try {
        if (data.data.length === 0) return console.log('No data to insert!');

        if (data.references.length > 0) {
            for (const ref of data.references) {
                const model = db[ref.model];

                if (model) {
                    const refData = await model.findAll({
                        attributes: ['id', ref.column, ...ref.attributes],
                        where: {
                            deletedAt: null,
                        },
                        raw: true,
                    });

                    ref.data = refData;
                    // references.push({
                    //     model: model.name,
                    //     data: refData,
                    // });
                }
            }
        }
        const total = data.data.length;
        data.data = data.data.filter((row, index) => {
            var canImport = true;
            data.references.forEach((ref) => {
                if (Object.prototype.hasOwnProperty.call(row, ref.selector)) {
                    const fkId = getRefRow(ref, row);
                    if (!fkId) {
                        console.log('----------------------------------------');
                        console.log('Missing', ref.model, ':', row[ref.selector]);
                        console.log('For:', row.name, 'Index:', index + 1);
                        row[ref.selector] = null;
                        return (canImport = false);
                    } else {
                        row[`${ref.selector}-Original`] = row[ref.selector];
                        row[ref.selector] = fkId.id;
                    }
                } else {
                    console.log('----------------------------------------');
                    console.log('No Value for :', ref.model);
                    console.log('For:', row.name, 'Index:', index + 1);
                    console.log('----------------------------------------');
                    return (canImport = false);
                }
            });

            if (canImport) return row;
            return false;
        });

        const importedTotal = data.data.length;

        console.log('==========> Total:', total);
        console.log('==========> Importing:', importedTotal);

        console.log('Insert Started!');
        // const dataCreated = await db[data.model].bulkCreate(data.data, { transaction });
        // console.log(dataCreated.length);
        // await transaction.commit();
        console.log('Insert Completed!');
        // await transaction.rollback();
    } catch (error) {
        await transaction.rollback();
        console.log(error.message);
    }
}

const getRefRow = (ref, row) => {
    try {
        return ref.data.find((r) => {
            const nameCondition = r[ref.column].trim().toLowerCase() === row[ref.selector].trim().toLowerCase();
            if (ref.conditions && ref.conditions.length > 0) {
                if (ref.conditions.every((column) => row[column] === r[column]) && nameCondition) {
                    return r;
                }
            } else if (nameCondition) {
                return r;
            }
            return null;
        });
    } catch (error) {
        console.log(error.message);
    }
};

bulkImport();
