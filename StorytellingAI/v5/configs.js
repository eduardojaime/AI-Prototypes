require("dotenv").config();

// Stability AI  https://api.stability.ai/docs#tag/v1generation/operation/textToImage
// Aspect Ratios https://en.wikipedia.org/wiki/16:9_aspect_ratio
// SDXL v0.9 and v1.0 allowed dimensions: 1024x1024, 1152x896, 1216x832, 1344x768, 1536x640, 640x1536, 768x1344, 832x1216, 896x1152
// Legacy 16:9 ratio > 1024x576
// XL 16:9 ratio > 1344x768
// StableVideo 1024x576 or 576x1024
const configs = {
  Settings: {
    ShortIncrement: 4,
  },
  Google: {
    VertexAI: {
      ApiKey: process.env.GOOGLE_VERTEX_AI_API_KEY,
    },
  },
  OpenAI: {
    Endpoint: "https://api.openai.com/v1/chat/completions",
    Secret: process.env.OPENAI_SECRET,
    ChatPrompt: "chat/prompt.txt",
    SystemPrompt: "chat/system.txt",
  },
  ComfyUI: {
    Endpoints: {
      Localhost: "http://127.0.0.1:8188/prompt",
    },
    Sampler: {
      Flux: {
        Steps: 5,
      },
      SDXL: {
        Steps: 30,
      },
    },
    Formats: {
      Horizontal: {
        SDXL: {
          Width: 1344,
          Height: 768,
        },
        FHD: {
          Width: 1920,
          Height: 1080,
        },
        ZIT_NATIVE: {
          Width: 1024,
          Height: 768,
        },
        WAN: {
          Width: 1280,
          Height: 704,
        }
      },
      Vertical: {
        SDXL: {
          Width: 768,
          Height: 1344,
        },
        FHD: {
          Width: 1080,
          Height: 1920,
        },
        ZIT_NATIVE: {
          Width: 768,
          Height: 1024,
        },
        WAN: {
          Width: 704,
          Height: 1280,
        }
      },
    },
    Workflows: {
      LLMSDXL: "",
      LLMFlux: "./input/workflows/flux/YT_VIDEO_LLM_API.json",
      LLMZIMAGE: "./input/workflows/zimage/YT_LLM_ZIMAGE_API.json",
      LLMWANVideo: "./input/workflows/wan/YT_LLM_T2VWANTURBO_API.json",
    },
  },
  StabilityAI: {
    Endpoints: {
      Text2Image:
        "https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image",
      Text2ImageXL:
        "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
      Image2Video: "https://api.stability.ai/v2beta/image-to-video",
      Image2VideoResult:
        "https://api.stability.ai/v2beta/image-to-video/result",
    },
    Dimensions: {
      Image: {
        Horizontal: {
          Width: 1344,
          Height: 768,
        },
        Vertical: {
          Width: 768,
          Height: 1344,
        },
      },
      Video: {
        Horizontal: {
          Width: 1024,
          Height: 576,
        },
        Vertical: {
          Width: 576,
          Height: 1024,
        },
      },
    },
    Secret: process.env.STABILITYAI_SECRET,
    StylePreset: "cinematic",
    Sampler: "K_DPM_2_ANCESTRAL",
    Samples: 1,
    Steps: 50,
    Seed: 0,
    CFGScale: 7,
    ClipGuidancePreset: "SIMPLE",
    MotionBucketId: 127, // default
  },
  ElevenLabs: {
    // Legacy REST API implementation (axios)
    Endpoint: "https://api.elevenlabs.io/v1/text-to-speech",
    Secret: process.env.ELEVENLABS_SECRET,
    MaleVoiceId: "UScWkSZVYL6vDaQhY30m", // 2.0, original > "RMSpIJWPsZD2Oq4s7dTo",
    FemaleVoiceId: "eIKNahp1xaNPAxRozkKs", // "XgemEVqDkz11K6s6rSgO",
    MonolingualModelId: "eleven_monolingual_v1", // "eleven_monolingual_v1",
    MultilingualModelId: "eleven_multilingual_v1", // "eleven_multilingual_v1"
    VoiceSettings: {
      Stability: "1.0",
      Similarity: "1.0",
    },
    v2: {
      // v2 from npm package
      ApiKey: process.env.ELEVENLABS_SECRET,
      OutputFormat: "mp3_44100_128",
      Models: {
        Monolingual: "eleven_monolingual_v2",
        Multilingual: "eleven_multilingual_v2", // v2 available but not tested
      },
      Voices: {
        Male: "UScWkSZVYL6vDaQhY30m", // 2.0, original > "RMSpIJWPsZD2Oq4s7dTo",
        Female: "eIKNahp1xaNPAxRozkKs", // "XgemEVqDkz11K6s6rSgO",
        Settings: {
          Stability: "1.0",
          Similarity: "1.0",
        },
      },
    },
  },
  Themes: {
    Horror: {
      AssetsFolderLong: "./input/assets_horror/long",
      AssetsFolderShorts: "./input/assets_horror/shorts",
      OutputFileNamePrefixLong: "VIDEO-HORROR",
      OutputFileNamePrefixShorts: "SHORTS-HORROR",
      BackgroundFile: "background.mp3",
      Prompts: {
        Additional:
          "cinematic scene, intricate detail, dramatic lighting, shadows, horror movie style",
        AdditionalStabilityAI:
          "((style of Ridley Scott)), ((grotesque)), nightmarish, hellish landscape, terrifying, dark nocturnal atmosphere, ((eerie, grim, spooky, gloomy, dark red, dark green))",
        Negative:
          "cartoon, comic strip, (close up), face portrait, self portrait, signature, watermark, jpeg artifacts, username, nudity, nsfw, deformed",
      },
    },
    Motivational: {
      AssetsFolderLong: "./input/assets_motivational/long",
      AssetsFolderShorts: "./input/assets_motivational/shorts",
      OutputFileNamePrefixLong: "VIDEO-MOTIVATION",
      OutputFileNamePrefixShorts: "SHORTS-MOTIVATION",
      BackgroundFile: "background.mp3",
      Prompts: {
        Additional: "epic, uplifting, motivational, bright lights",
        Negative:
          "cartoon, comic strip, (close up), face portrait, self portrait, signature, watermark, jpeg artifacts, username, nudity, nsfw, deformed",
      },
    },
  },
};

module.exports = configs;
