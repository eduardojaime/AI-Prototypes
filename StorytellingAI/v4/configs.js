require("dotenv").config();

// Stability AI  https://api.stability.ai/docs#tag/v1generation/operation/textToImage
// Aspect Ratios https://en.wikipedia.org/wiki/16:9_aspect_ratio
// SDXL v0.9 and v1.0 allowed dimensions: 1024x1024, 1152x896, 1216x832, 1344x768, 1536x640, 640x1536, 768x1344, 832x1216, 896x1152
// Legacy 16:9 ratio > 1024x576
// XL 16:90 ratio > 1344x768
// StableVideo 1024x576 or 576x1024
const configs = {
  Settings: {
    ShortIncrement: 4,
  },
  OpenAI: {
    Endpoint: "https://api.openai.com/v1/chat/completions",
    Secret: process.env.OPENAI_SECRET,
    ChatPrompt: "chat/prompt.txt",
    SystemPrompt: "chat/system.txt",
  },
  StabilityAI: {
    EndpointImg2VideoGeneration:
      "https://api.stability.ai/v2alpha/generation/image-to-video",
    EndpointImg2VideoResult:
      "https://api.stability.ai/v2alpha/generation/image-to-video/result",
    EndpointXL:
      "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
    EndpointLegacy:
      "https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image",
    Secret: process.env.STABILITYAI_SECRET,
    StylePreset: "cinematic",
    Sampler: "K_DPM_2_ANCESTRAL",
    AdditionalPrompt:
      "((grotesque)), nightmarish, hellish landscape, terrifying,horrific,terrifying,dark nocturnal atmosphere,2000s atmosphere, (((((gloomy, dark, black))))), (camera noise, grainy texture, textured, glitch effect), dark red, dark green",
    Misc: "((style of H.R. Giger, grotesque)), NIGHTMARISH, ((horror movie)),liminal space",
    AdditionalPromptLegacy:
      "horror movie,scary,spooky,horrific,terrifying,dark nocturnal atmosphere",
    NegativePrompt:
      "(close up), face portrait, self portrait, signature, watermark, jpeg artifacts, username, nudity, nsfw",
    NegativePromptLegacy:
      "disfigured, bad art, deformed, poorly drawn, extra limbs, blurry, bad anatomy, disfigured, poorly drawn face, poorly drawn hands, missing limbs, floating limbs, disjointed limbs, deformed hands, blurred, out of focus, long neck, long body, distorted, bad hands, error, extra digit, fewer digits, Lots of hands, extra limbs, extra fingers, conjoined fingers, deformed fingers, imperfect eyes, skewed eyes, unnatural face, unbalanced body, unnatural body, fused hand, missing hand, disappearing arms, disappearing thigh, disappearing calf, disappearing legs, missing fingers, (close up), face portrait, self portrait, signature, watermark, jpeg artifacts, username, nudity, nsfw",
    Width: 1344, // 1024,
    Height: 768, // 576,
    ShortWidth: 768,
    ShortHeight: 1344,
    VideoWidth: 1024, // only 1024x576 or 576x1024
    VideoHeight: 576,
    ShortVideoWidth: 576,
    ShortVideoHeight: 1024,
    Samples: 1,
    Steps: 50,
    Seed: 0,
    CFGScale: 7,
    ClipGuidancePreset: "SIMPLE",
    MotionBucketId: 127 // default
  },
  ElevenLabs: {
    Endpoint: "https://api.elevenlabs.io/v1/text-to-speech",
    Secret: process.env.ELEVENLABS_SECRET,
    MaleVoiceId: "RMSpIJWPsZD2Oq4s7dTo",
    FemaleVoiceId: "21m00Tcm4TlvDq8ikWAM", // "XgemEVqDkz11K6s6rSgO",
    MonolingualModelId: "eleven_monolingual_v1",
    MultilingualModelId: "eleven_multilingual_v1",
    VoiceSettings: {
      Stability: "1.0",
      Similarity: "1.0",
    },
  },
};

module.exports = configs;
