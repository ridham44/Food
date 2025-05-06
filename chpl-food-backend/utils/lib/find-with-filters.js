const { Op } = require('sequelize');
const _ = require('lodash');
const db = require('../../app/db/models');

const createdByFullName = db.Sequelize.fn(
    'concat',
    db.Sequelize.col('CreatedByUser.firstName'),
    ' ',
    db.Sequelize.col('CreatedByUser.lastName')
);

const updatedByFullName = db.Sequelize.fn(
    'concat',
    db.Sequelize.col('UpdatedByUser.firstName'),
    ' ',
    db.Sequelize.col('UpdatedByUser.lastName')
);

const sequelizeOperators = {
    contains: { key: Op.like, starts: '%', ends: '%' },
    notcontains: { key: Op.notLike, starts: '%', ends: '%' },
    startswith: { key: Op.startsWith, starts: '', ends: '%' },
    endswith: { key: Op.endsWith, starts: '%', ends: '' },
    '=': { key: Op.eq, starts: '', ends: '' },
    '!=': { key: Op.ne, starts: '', ends: '' },
    '<>': { key: Op.ne, starts: '', ends: '' },
    '>=': { key: Op.gte, starts: '', ends: '' },
    '>': { key: Op.gt, starts: '', ends: '' },
    '<=': { key: Op.lte, starts: '', ends: '' },
    '<': { key: Op.lt, starts: '', ends: '' },
};

// conditional symbols
const groupSymbols = ['and', 'or'];

// grouping array to be used for date fields
const dateGroup = ['year', 'month', 'day'];

// grouping array to be used for summary
const summaryGroup = ['sum', 'min', 'max', 'avg', 'count'];

// check if given field is a fk field
const checkFK = (value) => String(value).includes('.');

// check if field has Multilevel fk
const checkMultilevelFK = (value) => String(value).split('.').length - 1 >= 2;

// ** Pagination
const pagination = (query) => {
    // Default Skip and Take.
    //? For Sequelize Skip = Offset.
    let skipAndTake = {
        offset: 0,
        limit: null,
    };

    // Take Skip from query.
    if (query?.skip) {
        skipAndTake.offset = Number(query.skip);
    }
    // Take Limit from query.
    if (query?.take) {
        skipAndTake.limit = Number(query.take);
    }

    return skipAndTake;
};

//* get selectors options if available
const getColOpt = (columnOptions, selector) => {
    let colOpt = columnOptions[selector];
    return colOpt;
};

/**
 *
 * @param {*} item selector object.
 * @param {*} str selector name.
 * @param {*} model model name for which sorting is applied.
 * @returns literal for sorting
 */
const sortWithLiteral = (item, str, model, colOpt = null) => {
    let isFK = checkFK(item.selector);

    // str = str.replace(/["`]/g, '');

    let selector = str;

    if (colOpt && colOpt.isCustom) {
        selector = colOpt.value;
        return [colOpt.value, item?.desc == true ? 'DESC' : 'ASC'];
    }

    if (!isFK) {
        selector = `\`${model}\`.\`${str}\``;
        if (item.groupInterval) selector = `${item.groupInterval}(\`${model}\`.\`${str}\`)`;
    } else {
        if (item.groupInterval) selector = `${item.groupInterval}(${str})`;
    }

    return [db.Sequelize.literal(`${selector}`), item?.desc == true ? 'DESC' : 'ASC'];
};

// Convert multilevel FK selector. Example SKU.Quality.Name to `Sku->Quality`.`Name`
const formatMultilevelFK = (input) => {
    let fkSelector = '';
    let tableNames = String(input).split('.');

    let fieldName = tableNames.splice(-1, 1).toString();

    fkSelector = '`' + tableNames.join('->') + '`.`' + fieldName + '`';

    return fkSelector;
};

// Convert single FK selector. Example Quality.Name to `Quality`.`Name`
const formatFK = (input) => {
    let fkSelector = '';

    if (input.includes('.')) {
        let parts = input.split('.');
        fkSelector = `\`${parts[0]}\`.\`${parts[1]}\``;
    } else {
        fkSelector = `\`${input}\``;
    }

    return fkSelector;

    // eslint-disable-next-line no-unreachable
    let splittedInput = String(input).split('.');

    if (splittedInput.length === 1) {
        fkSelector = '`' + splittedInput[0] + '`';
    } else {
        fkSelector = splittedInput.map((i) => '`' + i + '`').join('.');
    }

    return fkSelector;
};

/**
 *
 * @param {*} query query object from request.
 * @param {*} model model name.
 * @returns sortable array.
 */
const generateSortable = (query, model, columnOptions) => {
    let modelSortable = [];

    // fields to be sorted with. Default [].
    let mainSort = query.sort ? query.sort : [];

    // fields to be sorted when group is used. Default [].
    let groupSort = query?.group ? query?.group : [];

    // common array which can be used for regular sorting as well as sorting present in the group.
    let sortables = [...mainSort, ...groupSort];

    sortables.forEach((item) => {
        // check if selector is Foreign Key.
        let isFK = checkFK(item.selector);

        let colOpt = getColOpt(columnOptions, item.selector);

        // For Normal Fields
        if (!isFK || colOpt) {
            let result = sortWithLiteral(item, item.selector, model, colOpt);
            modelSortable.push(result);
            return true;
        }
        // For Foreign Keys
        else {
            let IsMultilevelFk = checkMultilevelFK(item.selector);
            let fkSelector = item.selector;

            if (IsMultilevelFk) {
                fkSelector = formatMultilevelFK(item.selector);
            } else {
                fkSelector = formatFK(item.selector);
            }

            let result = sortWithLiteral(item, fkSelector, model, colOpt);
            modelSortable.push(result);
            return true;
        }
    });

    if (!modelSortable.length) {
        modelSortable.push(['createdAt', 'DESC']);
    }

    return modelSortable;
};

/**
 *
 * @param {*} query query object from request.
 * @param {*} model model name.
 * @returns grouping array
 */
const generateGroupObject = (groupData, model, columnOptions = []) => {
    let attributes = {};

    let groupBy = [];

    let colOpt = getColOpt(columnOptions, groupData[0].selector);

    if (colOpt && colOpt.isCustom) {
        attributes = [
            [db.Sequelize.fn('DISTINCT', colOpt.value), 'key'],
            [db.Sequelize.fn('COUNT', db.Sequelize.literal('*')), 'count'],
        ];
        groupBy = [colOpt.value];
    } else if (groupData.length === 1) {
        // check if any FK is present in item
        let isFK = checkFK(groupData[0].selector);

        if (!isFK) {
            attributes = [
                [db.Sequelize.fn('DISTINCT', db.Sequelize.col(`\`${model}\`.\`${groupData[0].selector}\``)), 'key'],
                [db.Sequelize.fn('COUNT', db.Sequelize.literal('*')), 'count'],
            ];
            groupBy = [`\`${model}\`.\`${groupData[0].selector}\``];
        }
        // when selector is foreign key.
        else {
            let IsMultilevelFk = checkMultilevelFK(groupData[0].selector);
            if (IsMultilevelFk) {
                let fkSelector = formatMultilevelFK(groupData[0].selector);
                attributes = [
                    [db.Sequelize.fn('DISTINCT', db.Sequelize.col(fkSelector)), 'key'],
                    [db.Sequelize.fn('COUNT', db.Sequelize.col(groupData[0].selector)), 'count'],
                ];
            } else {
                let fieldName = groupData[0].selector;
                attributes = [
                    [db.Sequelize.fn('DISTINCT', db.Sequelize.col(fieldName)), 'key'],
                    [db.Sequelize.fn('COUNT', db.Sequelize.col(fieldName)), 'count'],
                ];
            }

            let myGroupBy = groupData[0].selector;
            groupBy = [myGroupBy];
        }
    }

    let groupingObj = {
        attributes: attributes,
        group: groupBy,
    };

    return groupingObj;
};

/**
 *
 * @param {*} fieldName field name
 * @param {*} operatorName operator
 * @param {*} fieldValue filter value
 * @param {*} columnOptions column options
 * @param {*} model model name
 * @returns formatted field with sequelize conditions
 */
const formatField = (fieldName, operator, fieldValue, columnOptions, model) => {
    // Replace $*$ with %. As junk value is generated from req.query.
    if (operator == 'contains') {
        fieldValue = String(fieldValue).replace('$*$', '\\%');
    } else {
        fieldValue = String(fieldValue).replace('$*$', '%');
    }

    let obj = {};

    let columnOpt = getColOpt(columnOptions, fieldName);

    // check if selector is fk.
    let isFK = checkFK(fieldName);

    let fieldKey = fieldName;
    if (isFK) {
        fieldKey = '$' + `${fieldName}` + '$';
    }

    if (operator === '!=' || operator === 'ne') {
        obj[fieldKey] = {
            [Op.or]: [{ [Op.ne]: fieldValue }, { [Op.is]: null }],
        };
    } else {
        if (columnOpt && columnOpt.isCustom) {
            if (!obj[Op.and] || !Array.isArray(obj[Op.and])) obj[Op.and] = [];
            obj[Op.and].push(
                db.Sequelize.where(columnOpt.value, {
                    [sequelizeOperators[operator].key]:
                        sequelizeOperators[operator].starts + `${fieldValue}` + sequelizeOperators[operator].ends,
                })
            );
        } else {
            obj[fieldKey] = {
                [sequelizeOperators[operator].key]:
                    sequelizeOperators[operator].starts + `${fieldValue}` + sequelizeOperators[operator].ends,
            };
        }
    }
    return obj;
};

/**
 *
 * @param {*} queryFilters filters from query.
 * @param {*} model model name
 * @param {*} columnOptions column options
 * @returns sequelize converted filters
 */
const generateFilters = (queryFilters, model, columnOptions) => {
    //? For DevExpress [0] is field, [1] is operator, and [2] is value.
    const operator = queryFilters[1];

    const conditions = queryFilters
        .filter((i) => !groupSymbols.includes(i)) // filter out (or, and) field
        .map((condition) => {
            // check if it is an array
            if (Array.isArray(condition)) {
                // if child is also array then do recursion
                if (condition.find((f1) => Array.isArray(f1))) {
                    return generateFilters(condition, model, columnOptions);
                } else {
                    if (condition.length == 3) {
                        let fieldName = condition[0];
                        let operatorName = condition[1];
                        let fieldValue = condition[2];

                        // creating conditions as per the sequelize requirement
                        return formatField(fieldName, operatorName, fieldValue, columnOptions, model);
                    }
                }
            } else {
                return condition;
            }
        });

    if (operator === 'and' || operator === 'or') {
        if (operator == 'and') {
            return { [Op.and]: conditions };
        } else if (operator == 'or') {
            return { [Op.or]: conditions };
        }
    } else {
        if (conditions.length === 1) {
            return conditions[0];
        } else {
            return conditions;
        }
    }
};

//* Accessing nested property of any object by its key path
function accessPropertyByPath(obj, path) {
    const keys = path.split('.');
    let result = obj;
    for (let key of keys) {
        if (Object.prototype.hasOwnProperty.call(result, key)) {
            result = result[key];
        } else {
            // eslint-disable-next-line no-console
            console.log(`Property '${path}' not found`);
            return null;
        }
    }
    return result;
}

//* Formatting Dates for date group in header
/**
 *
 * @param {*} allData all data from findAll.
 * @param {*} queryGroup group from query.
 * @returns group of Year -> Month -> Day
 */
const convertDates = (allData, queryGroup) => {
    let dateFieldName = queryGroup[0].selector;
    const output = [];

    // Group dates by year
    const groupedByYear = allData.reduce((acc, item) => {
        const yearValue = accessPropertyByPath(item, dateFieldName);
        const year = new Date(yearValue).getFullYear();

        if (!acc[year]) {
            acc[year] = [];
        }

        acc[year].push(item);
        return acc;
    }, {});

    // Convert grouped dates to the desired nested format
    for (const year in groupedByYear) {
        const months = groupedByYear[year].reduce((acc, item) => {
            const monthValue = accessPropertyByPath(item, dateFieldName);

            const month = new Date(monthValue).getMonth() + 1; // Months are 0-indexed

            if (!acc[month]) {
                acc[month] = [];
            }

            const dateKeyValue = accessPropertyByPath(item, dateFieldName);

            const dateKey = new Date(dateKeyValue).getDate();
            if (!acc[month].some((dateItem) => dateKeyValue === dateKey)) {
                let checkRepetition = acc[month].map((m1) => m1.key).includes(dateKey);

                // avoiding date repetition in same month
                if (!checkRepetition) {
                    acc[month].push({ key: dateKey, items: null });
                }
            }

            return acc;
        }, {});

        const yearObj = {
            key: parseInt(year),
            items: Object.keys(months).map((month) => ({
                key: parseInt(month),
                items: months[month],
            })),
        };

        output.push(yearObj);
    }

    return output;
};

/**
 *
 * @param {*} totalSummary summary object from query
 * @param {*} model model name
 * @returns array of summary objects
 */
const generateSummaries = (totalSummary, model, columnOptions) => {
    let summaryAttributes = [];

    if (totalSummary.length) {
        totalSummary
            .filter((f1) => summaryGroup.includes(f1.summaryType))
            .map((item, index) => {
                let fieldName = item.selector;
                let summaryType = item.summaryType;

                let isFK = checkFK(fieldName);
                if (!isFK) {
                    fieldName = model + '.' + fieldName;
                } else if (checkMultilevelFK(fieldName)) {
                    fieldName = formatMultilevelFK(fieldName);
                }

                let colOpt = getColOpt(columnOptions, item.selector);

                if (colOpt && colOpt.isCustom) {
                    summaryAttributes.push([db.Sequelize.fn(summaryType, colOpt.value), `${summaryType} + ${index}`]);
                } else {
                    summaryAttributes.push([db.Sequelize.fn(summaryType, db.Sequelize.col(fieldName)), `${summaryType} + ${index}`]);
                }
            });
    }

    return summaryAttributes;
};

/**
 *
 * @param {*} queryGroup group data from query.
 * @param {*} allData all records from findAll
 * @returns formatted group data
 */
const formatMultipleGrouping = async (queryGroup, allData) => {
    function groupByRecursive(array, groupingFields) {
        if (groupingFields.length === 0) {
            return array;
        }

        const grouped = _.groupBy(array, groupingFields[0]);

        return _.map(grouped, (group, key) => {
            return {
                key,
                items: groupByRecursive(group, groupingFields.slice(1)),
                count: group.length, // Assuming you want to count the number of items in each group
            };
        });
    }

    const groupingFields = queryGroup.map((m1) => m1.selector);

    const groupedData = await groupByRecursive(allData, groupingFields);

    return groupedData;
};

// it is used to make attributes as empty array in all include joins.
const removeAttributes = (include) => {
    if (Array.isArray(include) && include.length > 0) {
        return include.map((m1) => {
            if (m1.include && m1.include.length > 0) {
                return {
                    ...m1,
                    attributes: [],
                    include: removeAttributes(m1.include),
                };
            } else {
                return {
                    ...m1,
                    attributes: [],
                };
            }
        });
    }
};

/**
 *
 * @param {*} queryGroup group from query.
 * @param {*} allData all records from findAll.
 * @returns
 */
const formattingGroupedData = async (queryGroup, allData) => {
    allData = JSON.parse(JSON.stringify(allData));
    queryGroup = JSON.parse(queryGroup);

    if (!queryGroup.length > 1) {
        return allData.map((m1) => {
            return {
                ...m1,
                items: null,
            };
        });
    } else {
        let responseArr = [...allData];

        if (queryGroup.length > 0 && queryGroup.find((f1) => f1.groupInterval && dateGroup.includes(f1.groupInterval))) {
            responseArr = convertDates(allData, queryGroup);
        } else {
            if (queryGroup.length > 1) {
                responseArr = await formatMultipleGrouping(queryGroup, allData);
            } else {
                responseArr = allData
                    .filter((f1) => f1.key)
                    .map((m1) => {
                        return {
                            ...m1,
                            items: null,
                        };
                    });
            }
        }
        return responseArr;
    }
};

/**
 *
 * @param {*} query req.query which contains DevExtreme filter object.
 * @param {*} model model name on which filters is applied.
 * @param {*} include array of models included in main findAll.
 * @param {*} columnOptions unique column options for usage as per requirements.
 * @returns skipAndTake, whereCondition, include, attributes, order, group, summaryAttributes, includeWithoutAttributes
 */
const findWithFilters = async (query, model, includes, columnOptions = {}) => {
    // adding default column options for createdBy and updatedBy
    columnOptions['CreatedByUser.fullName'] = { isCustom: true, value: createdByFullName, isDefault: true };
    columnOptions['UpdatedByUser.fullName'] = { isCustom: true, value: updatedByFullName, isDefault: true };

    // Models to be included.
    let defaultIncludes = includes;

    // Object with [] applied to all models in include
    let includeWithoutAttributes = await removeAttributes(includes);

    // Check if grouping is applied.
    let groupData = query?.group ? JSON.parse(query?.group) : [];

    //* If group is done than need to includes models with attributes []. For single level of group.
    if (query?.group && groupData.length == 1) {
        defaultIncludes = includeWithoutAttributes;
    }

    //* Skip and Take Object
    let skipAndTake = {};

    //* Order/Sort Object. Default Created Descending.
    let sortOrder = [[`createdAt`, 'DESC']];

    //* Summary Attributes
    let summaryAttributes = {};

    //* ??
    let attributes = {};

    //* Array of Group Objects
    let group = [];

    //* Model Conditions
    let whereCondition = {};

    //* pagination
    if (query?.skip || query?.take) skipAndTake = pagination(query);

    //* Sorting is applied when Sort object is present in query as well as when grouping.
    if (query?.sort || query?.group) sortOrder = await generateSortable(query, model, columnOptions);

    //* Summary
    if (query?.totalSummary) {
        let result = generateSummaries(JSON.parse(query.totalSummary), model, columnOptions);

        if (result.length > 0) {
            summaryAttributes = result;
        }
    }

    // ** search filters
    if (query?.filters) {
        let queryFilters = query.filters ? query.filters : [];

        // Check if filters is array. If not then convert to nested array.
        if (queryFilters && !queryFilters.find((f1) => Array.isArray(f1))) {
            queryFilters = [[...queryFilters]];
        }
        whereCondition = await generateFilters(queryFilters, model, columnOptions);
    }

    // ** grouping
    if (query?.group) {
        let groupData = JSON.parse(query?.group);
        if (groupData.length == 1) {
            let groupRes = generateGroupObject(groupData, model, columnOptions);
            attributes = groupRes.attributes;
            group = groupRes.group;
        }
    }

    if (Object.keys(columnOptions).length > 0 && !query.group) {
        let addCustomCols = [];
        Object.keys(columnOptions).forEach((key) => {
            const colOpt = columnOptions[key];
            if (colOpt.isDefault !== true) {
                addCustomCols.push([colOpt.value, key]);
            }
        });

        if (attributes && attributes?.length > 0 && columnOptions.length > 0) {
            attributes.push(...addCustomCols);
        } else {
            attributes = {
                include: addCustomCols,
            };
        }
    }

    //! Do not remove
    //* Added this to overwrite sequelize default order for id when offset and limit is used.
    if (query.group) {
        if (attributes && Array.isArray(attributes)) {
            attributes.push([db.Sequelize.fn('MAX', db.Sequelize.col(`${model}.id`)), 'id']);
        }
        if (sortOrder && Array.isArray(sortOrder)) {
            sortOrder.push(['id', 'ASC']);
        }
    }

    let result = {
        limit: skipAndTake.limit,
        offset: skipAndTake.offset,
        filterCondition: whereCondition,
        include: defaultIncludes,
        attributes: attributes,
        order: sortOrder,
        group: group,
        summaryAttributes: summaryAttributes,
        includeWithoutAttributes: includeWithoutAttributes,
        mainOptions: {
            limit: skipAndTake.limit,
            offset: skipAndTake.offset,
            where: {
                deletedAt: null,
                ...whereCondition,
            },
            include: defaultIncludes,
            attributes: attributes,
            order: sortOrder,
            group: group,
        },
        summaryOptions: {
            where: {
                deletedAt: null,
                ...whereCondition,
            },
            attributes: summaryAttributes,
            include: includeWithoutAttributes,
            raw: true,
        },
        countOptions: {
            where: {
                deletedAt: null,
                ...whereCondition,
            },
            include: includeWithoutAttributes,
        },
    };
    return result;
};

module.exports = {
    formattingGroupedData,
    findWithFilters,
};
