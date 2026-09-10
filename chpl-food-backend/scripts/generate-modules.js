const db = require('../app/db/models');
const fs = require('fs');

const createJSFile = async (data, fileName, filePath = './') => {
    return new Promise((resolve, reject) => {
        try {
            const json = JSON.stringify(data, null, 4);
            const moduleExports = `module.exports = ${json};\n`;
            fs.writeFile(filePath + fileName, moduleExports, (err) => {
                if (err) throw err;
                console.log(`${fileName} has been saved`);
                return resolve();
            });
        } catch (err) {
            console.error(err);
            return reject();
        }
    });
};

const formatHierarchy = async (modules, parentId) => {
    const children = modules.filter((module) => module.parentId === parentId);
    const result = [];
    for (const child of children) {
        const { id, name, type, parentName } = child;
        const grandchildren = await formatHierarchy(modules, id);
        result.push({ id, name, type, parentName, children: grandchildren });
    }
    return result;
};

const formatModule = (module, prefix) => {
    const key = (prefix ? `${prefix}_${module.name}` : module.name).toLowerCase().replace(/[^a-zA-Z]+/g, '_');

    const value = module.id;
    const result = { [key]: value };
    if (module.children && module.children.length > 0) {
        for (const child of module.children) {
            const childResult = formatModule(child, key);
            Object.assign(result, childResult);
        }
    }
    return result;
};

const generateJSONData = async (modules) => {
    const data = await formatHierarchy(modules, null);

    const result = {};
    for (const module of data) {
        const moduleResult = formatModule(module, null);
        Object.assign(result, moduleResult);
    }
    return result;
};

// Function to fetch data from the Menu Order model
const getModuleData = async () => {
    try {
        var modules = await db.MenuOrder.findAll({
            attributes: ['id', 'name', 'type', 'parentId', [db.Sequelize.col('Parent.name'), 'parentName']],
            include: [
                {
                    model: db.MenuOrder,
                    as: 'Parent',
                },
            ],
            order: ['type', ['createdAt', 'ASC']],
            // raw: true,
            nest: true,
        });

        console.log('modules', modules);

        if (modules?.length == 0) {
            console.error('=====================================================');
            console.error('No modules available to generate modules.js file!');
            console.error('=====================================================');
            return process.exit();
        }

        // Location to store new file
        const filePath = __dirname + '/../utils/lib/';

        // Transforming Data to writable data
        const jsonData = await generateJSONData(modules);

        // Function to create and store file
        await createJSFile(jsonData, 'modules.js', filePath);
        return process.exit();
    } catch (err) {
        console.error('=====================================================');
        console.error('Failed to generate modules.js');
        console.error('Error:', err?.message);
        console.error('=====================================================');
        return process.exit();
    }
};

getModuleData();
