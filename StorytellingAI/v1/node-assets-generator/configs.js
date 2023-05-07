require("dotenv").config();

const configs = {
  OpenAI: {
    Endpoint: "https://api.openai.com/v1/chat/completions",
    Secret: process.env.OPENAI_SECRET,
    ChatPrompt: "chat/prompt.txt",
    SystemPrompt: "chat/system.txt"
  },
  StabilityAI: {
    Endpoint:
      "https://api.stability.ai/v1/generation/stable-diffusion-512-v2-1/text-to-image",
    Secret: process.env.STABILITYAI_SECRET,
    StylePreset: "cinematic",
    Sampler: "K_DPM_2_ANCESTRAL"
  },
  ElevenLabs: {
    Endpoint:
      "https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB",
    Secret: process.env.ELEVENLABS_SECRET,
  },
};

module.exports = configs;
