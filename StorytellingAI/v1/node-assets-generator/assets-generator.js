// debug flags
// https://www.npmjs.com/package/axios#example
const configs = require("./configs");
const axios = require("axios");
const fs = require("fs");

async function GenerateAssets(skipCSV, skipImg, skipAudio) {
//   const skipCSV = true;
//   const skipImg = false;
//   const skipAudio = false;
  // Pipeline starts
  // Query OpenAI text generation > get img prompt and script
  let csv = "";
  const OpenAIEndpoint = configs.OpenAI.Endpoint;
  const OpenAISecret = configs.OpenAI.Secret;
  const ChatPrompt = fs.readFileSync(configs.OpenAI.ChatPrompt, "utf-8");
  const SystemPrompt = fs.readFileSync(configs.OpenAI.SystemPrompt, "utf-8");

  console.log("Generating CSV");

  if (!skipCSV) {
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
  } else {
    csv = fs.readFileSync("output/response.csv", "utf-8");
  }
  // Process CSV
  console.log("CSV created, now processing");
  let arr = csv.split(/\r\n|\r|\n/);
  let idx = 1;
  for (const val of arr) {
    if (val.includes("---") || val.includes("STORY-")) {
      console.log("skipping");
    } else {
      let row = val.split("|");

      if (!skipImg) {
        let imgPrompt = row[1]; // "A dark and eerie factory with smoke billowing out of the chimneys in the middle of a deserted town.";
        console.log("Generating Img Asset " + idx);
        await GenerateImage(imgPrompt, idx);
      } else {
        console.log("Skipping Image Generation " + idx);
      }

      if (!skipAudio) {
        let audioPrompt = row[0]; // "There was a young man named Jorge who lived in a small town on the outskirts of Ciudad Juarez.";
        console.log("Generating Audio Asset " + idx);
        await GenerateAudio(audioPrompt, idx);
      } else {
        console.log("Skipping Audio Generation " + idx);
      }
      idx++;
    }
  }
  // Query fluent-ffmpeg
  // Query YouTube API and upload video
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
        cfg_scale: 7,
        clip_guidance_preset: "FAST_BLUE",
        width: 512,
        height: 512,
        sampler: configs.StabilityAI.Sampler,
        samples: 1,
        seed: 0,
        steps: 75,
        style_preset: configs.StabilityAI.StylePreset,
        text_prompts: [
          {
            text: imgPrompt,
            weight: 1,
          },
          {
            text: "disfigured, bad art, deformed, poorly drawn, extra limbs, blurry, bad anatomy, disfigured, poorly drawn face, poorly drawn hands, missing limbs, floating limbs, disjointed limbs, deformed hands, blurred, out of focus, long neck, long body, distorted, bad hands, error, extra digit, fewer digits, Lots of hands, extra limbs, extra fingers, conjoined fingers, deformed fingers, imperfect eyes, skewed eyes, unnatural face, unbalanced body, unnatural body, fused hand, missing hand, disappearing arms, disappearing thigh, disappearing calf, disappearing legs, missing fingers, (close up), face portrait, self portrait, signature, watermark, jpeg artifacts, username, nudity, nsfw",
            weight: -1,
          },
        ],
      },
    };
    let imgResp = await axios.request(options);
    base64String = imgResp.data.artifacts[0].base64;
    let binaryData = Buffer.from(base64String, "base64");
    fs.writeFileSync(`output/image-${idx.toString().padStart(2,0)}.png`, binaryData);
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
      url: `${ElevenLabsEndpoint}`,
      headers: {
        "xi-api-key": `${ElevenLabsSecret}`, // Set the API key in the headers.
        accept: "audio/mpeg", // Set the expected response type to audio/mpeg.
        "content-type": "application/json", // Set the content type to application/json.
      },
      data: {
        text: audioPrompt, // Pass in the inputText as the text to be converted to speech.
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0,
          similarity_boost: 0,
        },
      },
      responseType: "arraybuffer", // Set the responseType to arraybuffer to receive binary data as response.
    };
    // Send the API request using Axios and wait for the response.
    const audioResp = await axios.request(options);
    fs.writeFileSync(`output/audio-${idx.toString().padStart(2,0)}.mpeg`, audioResp.data);
    console.log("Audio Asset Generated");
  } catch (ex) {
    console.log("Error in Eleven Labs: " + ex.response.data);
  }
}

// Initiate process
// main(true, true, true);

module.exports = GenerateAssets;
