// debug flags
// https://www.npmjs.com/package/axios#example
const configs = require("./configs");
const axios = require("axios");
const fs = require("fs");

async function GenerateImage(imgPrompt, idx) {
  try {
    // Query StableDiffusion API with img prompt > get images
    // https://stability.ai/
    // https://www.pixelconverter.com/aspect-ratio-to-pixels-converter/
    const StabilityAIEndpoint = configs.StabilityAI.EndpointLegacy;
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
    console.log("Error in Stability AI: " + ex.response);
  }
}

module.exports = GenerateImage;
