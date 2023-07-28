// Implements https://www.npmjs.com/package/googleapis
// Hosting https://firebase.google.com/docs/hosting/quickstart
console.log("running");

// Required Packages
const {google} = require("googleapis");
const configs = require("./configs");

// Global Variables and Constants
const GOOGLE_API_KEY = configs.Google.API_KEY;
const GOOGLE_CLIENT_ID = configs.Google.CLIENT_ID;
const GOOGLE_CLIENT_SECRET = configs.Google.CLIENT_SECRET;

const apis = google.getSupportedAPIs();
console.log(apis);

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_API_KEY,
  GOOGLE_CLIENT_ID,
  "http://localhost:3000"
);

// generate a url that asks permissions for Blogger and Google Calendar scopes
const scopes = [
  "https://www.googleapis.com/auth/youtube"
];

const url = oauth2Client.generateAuthUrl({
  // 'online' (default) or 'offline' (gets refresh_token)
  access_type: "offline",

  // If you only need one scope you can pass it as a string
  scope: scopes,
});
console.log(url)
