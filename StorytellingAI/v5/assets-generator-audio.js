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
  // await generateAudioSDK(audioPrompt, idx, language, isMale);
  // Use ElevenLabs API to generate audio
  // await generateAudioAPI(audioPrompt, idx, language, isMale);
  // Use ComfyUI to generate audio
  await generateAudioWithComfyUI(audioPrompt, idx, language);
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

async function generateAudioWithComfyUI(audioPrompt, idx, language) {
  try {
    const path = require("path");
    const audioFileNamePrefix = `audio-${idx.toString().padStart(2, 0)}-${language}`;
    const audioPath = path.join(__dirname, `./input/${audioFileNamePrefix}.mp3`);
    const serverOutputPath = `AUDIOTEMP/${audioFileNamePrefix}`;

    // Check if audio file already exists
    if (fs.existsSync(audioPath)) {
      console.log(`File Exists: ${audioFileNamePrefix}.mp3`);
      return;
    }

    // Load the workflow JSON
    const workflowPath = path.join(
      __dirname,
      "./input/workflows/qwen3tts/YT_AUDIO_API.json"
    );
    console.log(`Loading workflow from: ${workflowPath}`);

    const workflowStringData = fs.readFileSync(workflowPath, "utf8");
    const workflowJson = JSON.parse(workflowStringData);

    console.log(`Saving to output path: ${serverOutputPath}`);

    // Set the filename prefix for audio output (node 13 - SaveAudioMP3)
    workflowJson["13"]["inputs"]["filename_prefix"] = `${serverOutputPath}`;

    // Set the text/script to be converted to speech (node 14 - PrimitiveStringMultiline)
    workflowJson["14"]["inputs"]["value"] = audioPrompt;

    // // Randomize seed for TTS generation (node 10 - Qwen3TTSVoiceClone)
    // workflowJson["10"]["inputs"]["seed"] = getRandomInt(1, 4294967294);

    // Post workflow to ComfyUI
    const comfyUIEndpoint = configs.ComfyUI.Endpoints.Localhost;
    const options = {
      method: "POST",
      url: comfyUIEndpoint,
      headers: {
        "Content-Type": "application/json",
      },
      data: { prompt: workflowJson },
    };

    console.log(`Posting workflow to ComfyUI endpoint: ${comfyUIEndpoint}`);
    const response = await axios.request(options);
    await sleep(3000);
    console.log("Response with prompt_id:", response.data.prompt_id);

    // Wait for processing to complete
    let isProcessing = true;
    while (isProcessing) {
      const statusResponse = await axios.get(`${comfyUIEndpoint}`);
      isProcessing = statusResponse.data.exec_info.queue_remaining > 0;
      console.log("Is processing:", isProcessing);
      await sleep(10000);
    }

    // Copy from serverOutputPath to local input folder
    const comfyUIOutputFolder = "D:\\Programacion\\StableDiffusion\\Outputs\\comfyui";
    const comfyUIAudioFolder = path.join(comfyUIOutputFolder, "AUDIOTEMP");
    const generatedAudioFiles = fs
      .readdirSync(comfyUIAudioFolder)
      .filter(
        (file) =>
          file.startsWith(`${audioFileNamePrefix}_`) &&
          file.toLowerCase().endsWith(".mp3")
      )
      .map((file) => ({
        name: file,
        path: path.join(comfyUIAudioFolder, file),
        modifiedAt: fs.statSync(path.join(comfyUIAudioFolder, file)).mtimeMs,
      }))
      .sort((a, b) => b.modifiedAt - a.modifiedAt);

    if (generatedAudioFiles.length === 0) {
      throw new Error(
        `ComfyUI did not produce an MP3 for prefix ${audioFileNamePrefix} in ${comfyUIAudioFolder}`
      );
    }

    const generatedAudioFile = generatedAudioFiles[0];
    fs.copyFileSync(generatedAudioFile.path, audioPath);
    fs.unlinkSync(generatedAudioFile.path);
    
    console.log("Audio Asset Generated with ComfyUI");
  } catch (error) {
    console.error("Error loading workflow or making POST request:", error);
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = { GenerateAudio };
