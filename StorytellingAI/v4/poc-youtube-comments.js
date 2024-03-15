require("dotenv").config();
const { google } = require("googleapis");
const express = require("express");
const open = require("open"); // Version 8.4.2 works with this code

const OAuth2 = google.auth.OAuth2;
const YOUTUBE_VIDEO_TEST = process.env.YOUTUBE_VIDEO_TEST;

const oauth2Client = new OAuth2(
  process.env.YOUTUBE_OAUTH_CLIENT_ID,
  process.env.YOUTUBE_OAUTH_CLIENT_SECRET,
  process.env.YOUTUBE_OAUTH_REDIRECT_URI
);

const app = express();
const port = 3000; // Make sure this matches the port in your .env redirect URI

app.get("/auth/youtube/callback", async (req, res) => {
  const { code } = req.query;
  if (code) {
    try {
      const { tokens } = await oauth2Client.getToken(code);
      await oauth2Client.setCredentials(tokens);
      console.log("Authentication successful. You can now make API calls.");
      // Example function call:
      await listComments(YOUTUBE_VIDEO_TEST);
    } catch (error) {
      console.error("Error retrieving access token", error);
    }
  }
  res.send("Authentication successful! You can close this tab.");
  process.exit(); // Close the server after authentication
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
  const SCOPES = ["https://www.googleapis.com/auth/youtube.force-ssl"];
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("Authorize this app by visiting this url:", url);
  open(url); // Automatically open the authorization URL in the default browser
});

// Function to list comments (example usage)
async function listComments(videoId) {
  const youtube = google.youtube({
    version: "v3",
    auth: oauth2Client,
  });

  const response = await youtube.commentThreads.list({
    part: "snippet",
    videoId: videoId,
    maxResults: 10, // Specify the number of comments you want to retrieve
  });

  const comments = response.data.items;
  console.log(`Fetched ${comments.length} comments`);
  console.log(`Comments: ${JSON.stringify(comments)}`);

  for (const comment of comments) {
    const commentId = comment.id;
    const text = "TESTING AUTOMATION VIA API"; // Replace with your desired reply text

    const response = await youtube.comments.insert({
        part: "snippet",
        requestBody: {
          snippet: {
            parentId: commentId,
            textOriginal: text,
          },
        },
      });    
      console.log(`Replied to comment: as  ${response.data.authorDisplayName}`);
  }
}