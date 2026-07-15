import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.API_SECRET_KEY;
const ENCRYPTION_EXPIRY_MS = 60 * 1000; // 1 minute

const AES_KEY_SIZE = 256; // bits
const AES_KEY_LENGTH = AES_KEY_SIZE / 8; // 32 bytes

const getKey = () => {
    if (!SECRET_KEY || SECRET_KEY.length !== AES_KEY_LENGTH) {
        throw new Error(
            `API_SECRET_KEY must be exactly ${AES_KEY_LENGTH} characters for AES-${AES_KEY_SIZE}`
        );
    }

    return CryptoJS.enc.Utf8.parse(SECRET_KEY);
};

export const encryptData = (data) => {
    const key = getKey();
    const iv = CryptoJS.lib.WordArray.random(16);

    const payload = {
        data,
        expiresAt: Date.now() + ENCRYPTION_EXPIRY_MS,
    };

    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(payload), key, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });

    const combined = iv.clone().concat(encrypted.ciphertext);

    return {
        data: CryptoJS.enc.Base64.stringify(combined),
    };
};

export const decryptData = (payload) => {
    const key = getKey();

    const combined = CryptoJS.enc.Base64.parse(payload);

    const iv = CryptoJS.lib.WordArray.create(
        combined.words.slice(0, 4),
        16
    );

    const encryptedData = CryptoJS.lib.WordArray.create(
        combined.words.slice(4),
        combined.sigBytes - 16
    );

    const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: encryptedData,
    });

    const bytes = CryptoJS.AES.decrypt(cipherParams, key, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });

    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (!decrypted) {
        throw new Error("Decrypt failed");
    }

    const payloadData = JSON.parse(decrypted);

    if (!payloadData.expiresAt || Date.now() > payloadData.expiresAt) {
        throw new Error("Encrypted data expired");
    }

    return payloadData.data;
};

export const splitEncryptedPayloadForTesting = (payload) => {
    if (process.env.NODE_ENV === "production") {
        throw new Error("Testing helper disabled in production");
    }

    const combined = CryptoJS.enc.Base64.parse(payload);

    const iv = CryptoJS.lib.WordArray.create(
        combined.words.slice(0, 4),
        16
    );

    const encryptedData = CryptoJS.lib.WordArray.create(
        combined.words.slice(4),
        combined.sigBytes - 16
    );

    return {
        iv: iv.toString(CryptoJS.enc.Base64),
        encryptedData: encryptedData.toString(CryptoJS.enc.Base64),
    };
};