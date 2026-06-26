import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.NEXT_PUBLIC_API_SECRET_KEY;

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

  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    iv: iv.toString(CryptoJS.enc.Base64),
    encryptedData: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
  };
};

export const decryptData = ({ iv, encryptedData }) => {
  const key = getKey();

  const parsedIv = CryptoJS.enc.Base64.parse(iv);

  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: CryptoJS.enc.Base64.parse(encryptedData),
  });

  const bytes = CryptoJS.AES.decrypt(cipherParams, key, {
    iv: parsedIv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const decrypted = bytes.toString(CryptoJS.enc.Utf8);

  if (!decrypted) {
    throw new Error("Decrypt failed");
  }

  return JSON.parse(decrypted);
};