// debug flags
// https://www.npmjs.com/package/axios#example
const configs = require("./configs");
const axios = require("axios");
const fs = require("fs");
// Programmatically add a break at the end of the speech
// https://help.elevenlabs.io/hc/en-us/articles/13416374683665-How-can-I-add-pauses
const breakTime = '<break time="0.5s" />';

async function GenerateAudio(audioPrompt, idx, language, isMale) {
  try {
    audioPrompt = audioPrompt + breakTime;
    if (fs.existsSync(`input/audio-${idx.toString().padStart(2, 0)}-${language}.mp3`)) {
      console.log(
        `File Exists: input/audio-${idx
          .toString()
          .padStart(2, 0)}-${language}.mp3`
      );
    } else {
      // https://api.elevenlabs.io/docs
      // Query ElevenLabs API with script > get voice recordings
      const ElevenLabsEndpoint = configs.ElevenLabs.Endpoint;
      const ElevenLabsSecret = configs.ElevenLabs.Secret;
      const VoiceId = isMale
        ? configs.ElevenLabs.MaleVoiceId
        : configs.ElevenLabs.FemaleVoiceId;
      // new code
      const options = {
        method: "POST",
        url: `${ElevenLabsEndpoint}/${VoiceId}`, // Includes VoiceId
        headers: {
          "xi-api-key": `${ElevenLabsSecret}`, // Set the API key in the headers.
          accept: "audio/mpeg", // Set the expected response type to audio/mpeg.
          "content-type": "application/json", // Set the content type to application/json.
        },
        data: {
          text: audioPrompt, // Pass in the inputText as the text to be converted to speech.
          model_id: configs.ElevenLabs.MultilingualModelId,
          voice_settings: {
            stability: configs.ElevenLabs.VoiceSettings.Stability,
            similarity_boost: configs.ElevenLabs.VoiceSettings.Similarity,
          },
        },
        responseType: "arraybuffer", // Set the responseType to arraybuffer to receive binary data as response.
      };
      // Send the API request using Axios and wait for the response.
      const audioResp = await axios.request(options);
      fs.writeFileSync(
        `input/audio-${idx.toString().padStart(2, 0)}-${language}.mp3`,
        audioResp.data
      );
      console.log("Audio Asset Generated");
    }
  } catch (ex) {
    console.log("Error in Eleven Labs: " + ex.response.data);
  }
}

module.exports = { GenerateAudio };
