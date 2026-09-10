const fs = require('fs');
const path = require('path');

exports.removeImage = (data) => {
    const basePath = path.join(__dirname, '../..');
    if (Array.isArray(data)) {
        return data.map((i) => {
            try {
                fs.unlinkSync(path.join(basePath, i));
            } catch (err) {
                console.error('File does not exist:', i);
            }
        });
    }
    try {
        if (data) return fs.unlinkSync(path.join(basePath, data));
    } catch (err) {
        console.error('File does not exist:', data);
    }
};
