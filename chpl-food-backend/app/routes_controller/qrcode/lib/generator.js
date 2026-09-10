const QRCode = require('qrcode');

const generateQrCode = async (url) => {
  try {
    const dataUrl = await QRCode.toDataURL(url); 
    return dataUrl;
  } catch (error) {
    throw new Error('QR code generation failed');
  }
};

module.exports = { generateQrCode };
