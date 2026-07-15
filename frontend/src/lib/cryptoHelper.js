import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.NEXT_PUBLIC_API_SECRET_KEY;
const ENCRYPTION_EXPIRY_MS = 60 * 1000;

const getKey = () => {
  if (!SECRET_KEY || SECRET_KEY.length !== 32) {
    throw new Error(
      "NEXT_PUBLIC_API_SECRET_KEY must be exactly 32 characters for AES-256"
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

  const parsedPayload = JSON.parse(decrypted);

  if (!parsedPayload.expiresAt) {
    throw new Error("Expiry missing");
  }

  if (Date.now() > Number(parsedPayload.expiresAt)) {
    throw new Error("Encrypted data expired");
  }

  return parsedPayload.data;
};

export const splitEncryptedPayloadForTesting = (payload) => {
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

if (typeof window !== "undefined") {
  window.testDecryptData = decryptData;
  window.splitEncryptedPayloadForTesting = splitEncryptedPayloadForTesting;
}