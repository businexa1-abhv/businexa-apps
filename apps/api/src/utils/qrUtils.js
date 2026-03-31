/**
 * QR code image generation (PNG / data URL) using `qrcode`.
 * Business URLs (e.g. shop landing) are built in services; this module only encodes text.
 *
 * @see NODEJS_API_GENERATION_PROMPT.md — QR Code Generation
 */
const QRCode = require('qrcode');

const defaultOptions = {
  width: 256,
  margin: 2,
  errorCorrectionLevel: 'M',
  color: { dark: '#000000', light: '#FFFFFF' },
};

/**
 * @param {string} text Payload (e.g. https://…/shop/my-slug)
 * @param {object} [options] QRCode options (width, margin, errorCorrectionLevel, color)
 * @returns {Promise<string>} data:image/png;base64,…
 */
async function generateQrDataUrl(text, options = {}) {
  const opts = { ...defaultOptions, ...options };
  return QRCode.toDataURL(text, opts);
}

/**
 * @param {string} text
 * @param {object} [options]
 * @returns {Promise<Buffer>} PNG bytes
 */
async function generateQrBuffer(text, options = {}) {
  const opts = { ...defaultOptions, ...options, type: 'png' };
  return QRCode.toBuffer(text, opts);
}

/**
 * Write PNG to disk (qrcode: path, text, options).
 * @param {string} filePath
 * @param {string} text
 * @param {object} [options]
 */
async function generateQrFile(filePath, text, options = {}) {
  const opts = { ...defaultOptions, ...options };
  return QRCode.toFile(filePath, text, opts);
}

module.exports = {
  generateQrDataUrl,
  generateQrBuffer,
  generateQrFile,
  defaultOptions,
};
