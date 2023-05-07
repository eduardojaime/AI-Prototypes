require("dotenv").config();

const configs = {
  OpenAI: {
    Endpoint: "https://api.openai.com/v1/chat/completions",
    Secret: process.env.OPENAI_SECRET,
    ChatPrompt: "chat/prompt.txt",
    SystemPrompt: "chat/system.txt",
  },
  StabilityAI: {
    Endpoint:
      "https://api.stability.ai/v1/generation/stable-diffusion-512-v2-1/text-to-image",
    Secret: process.env.STABILITYAI_SECRET,
    StylePreset: "cinematic",
    Sampler: "K_DPM_2_ANCESTRAL",
    AdditionalPrompt: "intricate detail, detailed faces",
    NegativePrompt:
      "disfigured, bad art, deformed, poorly drawn, extra limbs, blurry, bad anatomy, disfigured, poorly drawn face, poorly drawn hands, missing limbs, floating limbs, disjointed limbs, deformed hands, blurred, out of focus, long neck, long body, distorted, bad hands, error, extra digit, fewer digits, Lots of hands, extra limbs, extra fingers, conjoined fingers, deformed fingers, imperfect eyes, skewed eyes, unnatural face, unbalanced body, unnatural body, fused hand, missing hand, disappearing arms, disappearing thigh, disappearing calf, disappearing legs, missing fingers, (close up), face portrait, self portrait, signature, watermark, jpeg artifacts, username, nudity, nsfw",
    Width: 768,
    Height: 384,
    Samples: 1,
    Steps: 75,
    Seed: 0,
    CFGScale: 7,
    ClipGuidancePreset: "FAST_BLUE"
  },
  ElevenLabs: {
    Endpoint:
      "https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB",
    Secret: process.env.ELEVENLABS_SECRET,
    ModelId: "eleven_monolingual_v1"
  },
};

module.exports = configs;
