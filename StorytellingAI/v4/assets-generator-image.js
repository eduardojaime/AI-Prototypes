// debug flags
// https://www.npmjs.com/package/axios#example
const configs = require("./configs");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function GenerateImage(imgPrompt, idx, isShort, isVideoClip) {
  try {
    let imgPath = `input/image-${idx.toString().padStart(2, 0)}.png`;
    let videoPath = `input/video-${idx.toString().padStart(2, 0)}.mp4`;
    // TODO fix this check
    if (fs.existsSync(imgPath) && !isVideoClip) {
      console.log(`File Exists: ${imgPath}`);
    } else if (fs.existsSync(videoPath) && isVideoClip) {
      console.log(`File Exists: ${videoPath}`);
    } else {
      let selectedWidth = 0;
      let selectedHeight = 0;

      if (isShort) {
        selectedWidth = configs.StabilityAI.ShortWidth;
        selectedHeight = configs.StabilityAI.ShortHeight;
      } else {
        selectedWidth = configs.StabilityAI.Width;
        selectedHeight = configs.StabilityAI.Height;
      }

      if (isVideoClip) {
        // currently API only works with 1024x576 or 576x1024 combinations
        if (isShort) {
          selectedWidth = configs.StabilityAI.ShortVideoWidth;
          selectedHeight = configs.StabilityAI.ShortVideoHeight;
        } else {
          selectedWidth = configs.StabilityAI.VideoWidth;
          selectedHeight = configs.StabilityAI.VideoHeight;
        }
      } else {
        // legacy code
        if (isShort) {
          selectedWidth = configs.StabilityAI.ShortWidth;
          selectedHeight = configs.StabilityAI.ShortHeight;
        } else {
          selectedWidth = configs.StabilityAI.Width;
          selectedHeight = configs.StabilityAI.Height;
        }
      }
      await GeneratePNG(
        imgPath,
        imgPrompt,
        selectedHeight,
        selectedWidth,
        isVideoClip
      );

      if (isVideoClip) {
        await sleep(3000);
        await GenerateVideoClip(
          imgPath,
          videoPath,
          selectedHeight,
          selectedWidth
        );
      }
    }
  } catch (ex) {
    console.log(
      "Error in Stability AI - Ex: " + axios.isAxiosError(ex) ? ex.response : ex
    );
  }
}

async function GeneratePNG(
  imgPath,
  imgPrompt,
  selectedHeight,
  selectedWidth,
  isVideoClip
) {
  // Query StableDiffusion API with img prompt > get images
  // https://stability.ai/
  // https://www.pixelconverter.com/aspect-ratio-to-pixels-converter/
  // Use XL if not video clip to generate better images
  // Legacy endpoint supports width x height combinations for ImageToVideo conversion
  const StabilityAIEndpoint = isVideoClip
    ? configs.StabilityAI.EndpointLegacy
    : configs.StabilityAI.EndpointXL;
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
      width: selectedWidth,
      height: selectedHeight,
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
  // TODO Use sharp to resize an img created with SD XL
  // const desiredWidth = 100; // New desired width from configs
  // const desiredHeight = 100; // New desired height from configs

  // sharp(binaryData)
  //   .resize(desiredWidth, desiredHeight)
  //   .toBuffer()
  //   .then((resizedImageBuffer) => {
  //     fs.writeFileSync(imgPath, resizedImageBuffer);
  //     console.log("Img Asset Generated and Resized");
  //   })
  //   .catch((error) => {
  //     console.error("Error resizing the image:", error);
  //   });
    
  fs.writeFileSync(imgPath, binaryData);
  console.log("Img Asset Generated");
}

async function GenerateVideoClip(imgPath, videoPath) {
  console.log("Generating Video Clip");
  const StabilityAISecret = configs.StabilityAI.Secret;

  // if (fs.existsSync(sourceImg)) console.log("File Exists!");
  const filePath = path.resolve(__dirname, imgPath);
  const fileStream = fs.createReadStream(filePath);

  // instructions on https://www.npmjs.com/package/form-data
  const form = new FormData();
  form.append("image", fileStream);
  // form.append("image", imgPath); // another option
  form.append("seed", "0");
  form.append("cfg_scale", "2.5");
  form.append("motion_bucket_id", configs.StabilityAI.MotionBucketId); // default is 40 from example but 127 from documentation
  const formHeaders = form.getHeaders();
  formHeaders.Authorization = `${StabilityAISecret}`;

  const optPost = {
    method: "POST",
    url: `${configs.StabilityAI.EndpointImg2VideoGeneration}`,
    // pull headers from form-data getHeaders() method
    headers: { ...formHeaders },
    data: form,
  };

  let idResp = await axios.request(optPost);
  let id = idResp.data.id;
  // console.log(id);

  await sleep(90000);
  // TODO improve with retry strategy and while loops
  // if video is not ready it'll return
  // {
  //     "id": "23d7bdbb0fb4e78b8d25388439241cb6c7e1bf2d740e26636f31b0f1955bb55c",
  //     "status": "in-progress"
  // }
  // so we need to wait

  const optGet = {
    method: "GET",
    url: `${configs.StabilityAI.EndpointImg2VideoResult}/${id}`,
    headers: {
      authorization: `${StabilityAISecret}`,
      Accept: "application/json",
    },
  };
  let vidResp = await axios.request(optGet);
  // console.log(vidResp.data);
  base64String = vidResp.data.video;
  let binaryData = Buffer.from(base64String, "base64");
  fs.writeFileSync(videoPath, binaryData);
  console.log("Video Asset Generated");
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

module.exports = GenerateImage;
