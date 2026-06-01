import bcrypt from "bcrypt";

const generateHash = async () => {
  const hash = await bcrypt.hash("admin@123", 10);

  console.log(hash);
};

generateHash();