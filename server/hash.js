import bcrypt from "bcrypt";

const generateHash = async () => {
  const hash = await bcrypt.hash("R@jT@nk@97891912", 10);

  console.log(hash);
};

generateHash();