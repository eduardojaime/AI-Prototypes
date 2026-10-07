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
      LLMZIMAGE: "./input/workflows/zimage/YT_LLM_ZIMAGE_API.json",
      QWEN3TTS: "./input/workflows/qwen3tts/YT_AUDIO_API.json",
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
