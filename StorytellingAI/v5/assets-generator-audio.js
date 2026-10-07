// debug flags
// https://www.npmjs.com/package/axios#example
const configs = require("./configs");
const axios = require("axios");
const fs = require("fs");

async function GenerateAudio(audioPrompt, idx, language, isMale) {
  await generateAudioWithComfyUI(audioPrompt, idx, language);
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = { GenerateAudio };
