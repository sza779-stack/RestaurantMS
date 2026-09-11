"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const crypto_1 = require("crypto");
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-default-32-char-encryption-key-for-dev';
const IV_LENGTH = 16;
function encrypt(text) {
    if (!text)
        return text;
    const key = (0, crypto_1.scryptSync)(ENCRYPTION_KEY, 'salt', 32);
    const iv = (0, crypto_1.randomBytes)(IV_LENGTH);
    const cipher = (0, crypto_1.createCipheriv)(ALGORITHM, key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}
function decrypt(text) {
    if (!text || !text.includes(':'))
        return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const key = (0, crypto_1.scryptSync)(ENCRYPTION_KEY, 'salt', 32);
        const decipher = (0, crypto_1.createDecipheriv)(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }
    catch (error) {
        console.error('Decryption failed:', error);
        return text;
    }
}
//# sourceMappingURL=encryption.util.js.map