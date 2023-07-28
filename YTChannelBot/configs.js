require("dotenv").config();

const configs = {
  Google: {
    API_KEY: process.env.GOOGLE_API_KEY,
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  },
};

module.exports = configs;
