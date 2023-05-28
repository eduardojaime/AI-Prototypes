// debug flags
// https://www.npmjs.com/package/axios#example
const configs = require("./configs");
const axios = require("axios");
const fs = require("fs");

async function GenerateAssets(skipCSV, skipImg, skipAudio) {
  // Pipeline starts
  // Query OpenAI text generation > get img prompt and script
  let csv = "";
  const OpenAIEndpoint = configs.OpenAI.Endpoint;
  const OpenAISecret = configs.OpenAI.Secret;
  const ChatPrompt = fs.readFileSync(configs.OpenAI.ChatPrompt, "utf-8");
  const SystemPrompt = fs.readFileSync(configs.OpenAI.SystemPrompt, "utf-8");

  if (!skipCSV) {
    console.log("Generating CSV");
    const options = {
      method: "POST",
      url: `${OpenAIEndpoint}`,
      headers: {
        Authorization: `Bearer ${OpenAISecret}`, // Set the API key in the headers.
        "content-type": "application/json", // Set the content type to application/json.
      },
      data: {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: SystemPrompt },
          { role: "user", content: ChatPrompt },
        ],
      },
    };
    let resp = await axios.request(options);
    csv = resp.data.choices[0].message.content;
    fs.writeFileSync("output/response.csv", csv);
    console.log("CSV created, now processing");
  } else {
    csv = fs.readFileSync("output/response.csv", "utf-8");
  }

  // Process CSV
  let arr = csv.split(/\r\n|\r|\n/);
  let idx = 1;
  for (const val of arr) {
    if (val.includes("---") || val.includes("STORY-")) {
      // console.log("skipping");
    } else {
      let row = val.split("|");

      if (!skipImg) {
        let imgPrompt = row[1]; // "A dark and eerie factory with smoke billowing out of the chimneys in the middle of a deserted town.";
        console.log("Generating Img Asset " + idx);
        await GenerateImage(imgPrompt, idx);
      }

      if (!skipAudio) {
        let audioPrompt = row[0]; // "There was a young man named Jorge who lived in a small town on the outskirts of Ciudad Juarez.";
        console.log("Generating Audio Asset " + idx);
        await GenerateAudio(audioPrompt, idx);
      }

      idx++;
    }
  }
}

async function GenerateImage(imgPrompt, idx) {
  try {
    // Query StableDiffusion API with img prompt > get images
    // https://stability.ai/
    // https://www.pixelconverter.com/aspect-ratio-to-pixels-converter/
    const StabilityAIEndpoint = configs.StabilityAI.Endpoint;
    const StabilityAISecret = configs.StabilityAI.Secret;
    const options = {
      method: "POST",
      url: `${StabilityAIEndpoint}`,
      headers: {
        Authorization: `${StabilityAISecret}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      data: {
        cfg_scale: configs.StabilityAI.CFGScale,
        clip_guidance_preset: configs.StabilityAI.ClipGuidancePreset,
        width: configs.StabilityAI.Width,
        height: configs.StabilityAI.Height,
        sampler: configs.StabilityAI.Sampler,
        samples: configs.StabilityAI.Samples,
        seed: configs.StabilityAI.Seed,
        steps: configs.StabilityAI.Steps,
        style_preset: configs.StabilityAI.StylePreset,
        text_prompts: [
          {
            text: imgPrompt,
            weight: 1,
          },
          {
            text: configs.StabilityAI.AdditionalPrompt,
            weight: 1,
          },
          {
            text: configs.StabilityAI.NegativePrompt,
            weight: -1,
          },
        ],
      },
    };
    let imgResp = await axios.request(options);
    base64String = imgResp.data.artifacts[0].base64;
    let binaryData = Buffer.from(base64String, "base64");
    fs.writeFileSync(
      `output/image-${idx.toString().padStart(2, 0)}.png`,
      binaryData
    );
    console.log("Img Asset Generated");
  } catch (ex) {
    console.log("Error in Stability AI: " + ex.response.data.message);
  }
}

async function GenerateAudio(audioPrompt, idx) {
  try {
    // https://api.elevenlabs.io/docs
    // Query ElevenLabs API with script > get voice recordings
    const ElevenLabsEndpoint = configs.ElevenLabs.Endpoint;
    const ElevenLabsSecret = configs.ElevenLabs.Secret;
    // new code
    const options = {
      method: "POST",
      url: `${ElevenLabsEndpoint}`, // Includes VoiceId
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
      `output/audio-${idx.toString().padStart(2, 0)}.mp3`,
      audioResp.data
    );
    console.log("Audio Asset Generated");
  } catch (ex) {
    console.log("Error in Eleven Labs: " + ex.response.data);
  }
}

module.exports = GenerateAssets;
