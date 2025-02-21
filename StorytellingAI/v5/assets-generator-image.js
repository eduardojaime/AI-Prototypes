// debug flags
// https://www.npmjs.com/package/axios#example
const configs = require("./configs");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

function GetDimensions(isShort) {
  let selectedWidth = 0;
  let selectedHeight = 0;
  let resizeWidth = 0;
  let resizeHeight = 0;

  if (isShort) {
    selectedWidth = configs.StabilityAI.Dimensions.Image.Vertical.Width;
    selectedHeight = configs.StabilityAI.Dimensions.Image.Vertical.Height;
    resizeWidth = configs.StabilityAI.Dimensions.Video.Vertical.Width;
    resizeHeight = configs.StabilityAI.Dimensions.Video.Vertical.Height;
  } else {
    selectedWidth = configs.StabilityAI.Dimensions.Image.Horizontal.Width;
    selectedHeight = configs.StabilityAI.Dimensions.Image.Horizontal.Height;
    resizeWidth = configs.StabilityAI.Dimensions.Video.Horizontal.Width;
    resizeHeight = configs.StabilityAI.Dimensions.Video.Horizontal.Height;
  }

  return { selectedWidth, selectedHeight, resizeWidth, resizeHeight };
}

async function GeneratePNGAndResize(
  imgPath,
  imgPrompt,
  additionalPrompt,
  negativePrompt,
  dimensions,
  isVideoClip
) {
  const StabilityAIEndpoint = configs.StabilityAI.Endpoints.Text2ImageXL;
  console.log(`Calling StabilityAIEndpoint: ${StabilityAIEndpoint}`);
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
      width: dimensions.selectedWidth,
      height: dimensions.selectedHeight,
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
          text: additionalPrompt,
          weight: 1,
        },
        {
          text: negativePrompt,
          weight: -1,
        },
      ],
    },
  };
  console.log('Retrieving Image');
  let imgResp = await axios.request(options);
  base64String = imgResp.data.artifacts[0].base64;
  let binaryData = Buffer.from(base64String, "base64");

  if (isVideoClip) {
    const tempFilePath = path.join(__dirname, "tmp.png");
    fs.writeFileSync(tempFilePath, binaryData);
    await sharp(tempFilePath)
      .resize(dimensions.resizeWidth, dimensions.resizeHeight)
      .toFile(imgPath);
    fs.unlinkSync(tempFilePath);
    console.log("Img Asset Generated and Resized");
  } else {
    fs.writeFileSync(imgPath, binaryData);
    console.log("Img Asset Generated");
  }
}

async function GenerateVideoClip(imgPath, videoPath) {
  console.log("Generating Video Clip");
  const StabilityAISecret = configs.StabilityAI.Secret;

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
    url: `${configs.StabilityAI.Endpoints.Image2Video}`,
    // pull headers from form-data getHeaders() method
    headers: { ...formHeaders },
    data: form,
  };

  let idResp = await axios.request(optPost);
  let id = idResp.data.id;

  await sleep(90000);

  const optGet = {
    method: "GET",
    url: `${configs.StabilityAI.Endpoints.Image2VideoResult}/${id}`,
    headers: {
      authorization: `${StabilityAISecret}`,
      Accept: "application/json",
    },
  };
  let vidResp = await axios.request(optGet);
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

async function GenerateImage(
  imgPrompt,
  idx,
  isShort,
  isVideoClip,
  selectedTheme
) {
  try {
    let imgPath = `input/image-${idx.toString().padStart(2, 0)}.png`;
    let videoPath = `input/video-${idx.toString().padStart(2, 0)}.mp4`;

    if (fs.existsSync(imgPath) && !isVideoClip) {
      console.log(`File Exists: ${imgPath}`);
    } else if (fs.existsSync(videoPath) && isVideoClip) {
      console.log(`File Exists: ${videoPath}`);
    } else {
      const dimensions = GetDimensions(isShort);

      await GeneratePNGAndResize(
        imgPath,
        imgPrompt,
        selectedTheme.Prompts.Additional,
        selectedTheme.Prompts.Negative,
        dimensions,
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

module.exports = { GenerateImage };
