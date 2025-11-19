// debug flags
// https://www.npmjs.com/package/axios#example
const configs = require("./configs");
const axios = require("axios");
const fs = require("fs");
// Programmatically add a break at the end of the speech
// https://help.elevenlabs.io/hc/en-us/articles/13416374683665-How-can-I-add-pauses
const breakTime = '<break time="0.5s" />';
// Using new ElevenLabs NPM package
const elevenlabs = require("@elevenlabs/elevenlabs-js");
const elevenlabsClient = new elevenlabs.ElevenLabsClient({
  apiKey: configs.ElevenLabs.v2.ApiKey,
});

async function GenerateAudio(audioPrompt, idx, language, isMale) {
  // Use ElevenLabs SDK to generate audio
  await generateAudioSDK(audioPrompt, idx, language, isMale);
  // Use ElevenLabs API to generate audio
  // await generateAudioAPI(audioPrompt, idx, language, isMale);
}

async function generateAudioAPI(audioPrompt, idx, language, isMale) {
  try {
    audioPrompt = audioPrompt + breakTime;
    if (
      fs.existsSync(
        `input/audio-${idx.toString().padStart(2, 0)}-${language}.mp3`
      )
    ) {
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
    if (ex.response.data)
      console.log("Error in Eleven Labs: " + ex.response.data);
    else console.log("Error in Eleven Labs: " + ex.response);
  }
}

async function generateAudioSDK(audioPrompt, idx, language, isMale) {
  try {
    audioPrompt = audioPrompt + breakTime;
    if (
      fs.existsSync(
        `input/audio-${idx.toString().padStart(2, 0)}-${language}.mp3`
      )
    ) {
      console.log(
        `File Exists: input/audio-${idx
          .toString()
          .padStart(2, 0)}-${language}.mp3`
      );
    } else {
      // Using ElevenLabs SDK to generate audio
      const voiceId = isMale
        ? configs.ElevenLabs.v2.Voices.Male
        : configs.ElevenLabs.v2.Voices.Female;
      const audio = await elevenlabsClient.textToSpeech.convert(
        voiceId,
        {
          text: audioPrompt,
          model: configs.ElevenLabs.v2.Models.Multilingual,
          outputFormat: configs.ElevenLabs.v2.OutputFormat,
          voiceSettings: {
            stability: Number(configs.ElevenLabs.v2.Voices.Settings.Stability),
            similarityBoost: Number(
              configs.ElevenLabs.v2.Voices.Settings.Similarity
            ),
          },
        },
        {
          maxRetries: 5,
        }
      );
      const audioBuffer = await readableStreamToBuffer(audio);
      fs.writeFileSync(
        `input/audio-${idx.toString().padStart(2, 0)}-${language}.mp3`,
        audioBuffer
      );
      console.log("Audio Asset Generated");
    }
  } catch (ex) {
    console.error("Error in Eleven Labs SDK:", ex);
  }
}

async function readableStreamToBuffer(readableStream) {
  const reader = readableStream.getReader();
  const chunks = [];
  let done = false;

  while (!done) {
    const { value, done: streamDone } = await reader.read();
    if (value) {
      chunks.push(value);
    }
    done = streamDone;
  }

  return Buffer.concat(chunks);
}

module.exports = { GenerateAudio };
