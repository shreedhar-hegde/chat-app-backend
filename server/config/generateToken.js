const jwt = require("jsonwebtoken");
require("dotenv");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};
module.exports = { generateToken };
