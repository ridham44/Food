const data = {
    model: 'ModelName',
    references: [
        {
            model: 'Referencing Model',
            column: 'column name for model',
            selector: 'selector column from data',
            attributes: ['Other required attributes'],
            conditions: ['cascading condition'],
        },
    ],
    data: [],
};

module.exports = data;
