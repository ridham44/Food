const { generateQrCode } = require('./generator');
const { status } = require('../../../../utils');
exports.generateLoginQr = async (req, res) => {
    try {
        const loginUrl = 'http://dev.my-company.app/india/crm/login';
        const qrImage = await generateQrCode(loginUrl);
        res.status(status.OK).json({
            message: 'QR code generated successfully',
            loginUrl,
            qrImage,
        });
    } catch (error) {
        res.status(status.BadRequest).json({ message: error.message });
    }
};
