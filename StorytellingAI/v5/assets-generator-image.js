const configs = require("./configs");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const googleAi = require("@google/genai");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getDimensions(isShort) {
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

async function generateImageWithComfyUI(
  imgPrompt,
  idx,
  isShort,
  isVideoClip,
  selectedTheme,
  isSDXL
) {
  try {
    const imgFileNamePrefix = `image-${idx.toString().padStart(2, 0)}`;
    const videFileNamePrefix = `video-${idx.toString().padStart(2, 0)}`;
    const imgPath = path.join(__dirname, `./input/${imgFileNamePrefix}-01.png`);
    const videoPath = path.join(__dirname, `/input/${videFileNamePrefix}.mp4`);
    const formats = configs.ComfyUI.Formats;
    // const steps = isSDXL
    //   ? configs.ComfyUI.Sampler.SDXL.Steps
    //   : configs.ComfyUI.Sampler.Flux.Steps;
    // check if exists and return
    const files = fs.readdirSync(path.join(__dirname, "./input"));
    const imgExists = files.some((file) => file.includes(imgFileNamePrefix));
    const videoExists = files.some((file) => file.includes(videFileNamePrefix));
    if (imgExists) {
      console.log(`File Exists: ${imgFileNamePrefix}`);
    } else {
      const positivePrompt = selectedTheme.Prompts.Additional + "," + imgPrompt;
      // const workflowPath = path.join(
      //   __dirname,
      //   isSDXL
      //     ? configs.ComfyUI.Workflows.LLMSDXL
      //     : configs.ComfyUI.Workflows.LLMFlux
      // );
      const workflowPath = path.join(__dirname, configs.ComfyUI.Workflows.LLMZIMAGE);
      console.log(`Loading workflow from: ${workflowPath}`);
      const outputPath = path.join(__dirname, "./input");
      const workflowStringData = fs.readFileSync(workflowPath, "utf8");
      const workflowJson = JSON.parse(workflowStringData);
      // LLM RANDOM SEED
      workflowJson["115"]["inputs"]["seed"] = getRandomInt(1, 4294967294); 

      // INTRUCTIONS
      workflowJson["51"]["inputs"]["text"] = positivePrompt; // Prompt to be enhanced by LLM
      // WIDTH and HEIGHT
      workflowJson["57"]["inputs"]["string"] = isShort
        ? formats.Vertical.FHD.Width
        : formats.Horizontal.FHD.Width;
      workflowJson["58"]["inputs"]["string"] = isShort
        ? formats.Vertical.FHD.Height
        : formats.Horizontal.FHD.Height;
      // KSAMPLER Seed and Steps
      workflowJson["3"]["inputs"]["seed"] = getRandomInt(1, 4294967294);
      // workflowJson["3"]["inputs"]["steps"] = steps; // NOT NEEDED FOR ZIT
      // SAVE IMAGE OUTPUT PATH AND FILE PREFIX
      workflowJson["12"]["inputs"]["output_path"] = outputPath;
      workflowJson["12"]["inputs"]["filename_prefix"] = imgFileNamePrefix;

      const comfyUIEndpoint = configs.ComfyUI.Endpoints.Localhost;
      const options = {
        method: "POST",
        url: comfyUIEndpoint,
        headers: {
          "Content-Type": "application/json",
        },
        data: { prompt: workflowJson },
      };
      console.log(`Posting workflow to ComfyUI endpoint: ${comfyUIEndpoint}`);
      const response = await axios.request(options);
      await sleep(3000);
      console.log("Response with prompt_id:", response.data.prompt_id);
      let isProcessing = true;
      while (isProcessing) {
        const statusResponse = await axios.get(`${comfyUIEndpoint}`);
        isProcessing = statusResponse.data.exec_info.queue_remaining > 0;
        console.log("Is processing:", isProcessing);
        await sleep(2000);
      }
    }
    await sleep(2000);
    if (videoExists) {
      console.log(`Video already exists: ${videFileNamePrefix}`);
    } else if (isVideoClip && !videoExists) {
      console.log("Generating Video Clip...");
      await generateVideoClip(imgPath, videoPath, isShort, false, imgPrompt);
    }
  } catch (error) {
    console.error("Error loading workflow or making POST request:", error);
  }
}

async function generateImageWithStabilityAI(
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
  console.log("Retrieving Image");
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

async function generateVideoClip(
  imgPath,
  videoPath,
  isShort = false,
  useGoogleAPI = true,
  imgPrompt = ""
) {
  console.log("Generating Video Clip...");

  await generateText2VideoWithComfyUI(videoPath, imgPrompt, isShort);
  // if (useGoogleAPI)
  //   await generateVideoWithGoogleAPI(imgPath, videoPath, dimensions, imgPrompt);
  // else 
  //   await generateVideoWithStabilityAI(imgPath, videoPath);
}

async function generateText2VideoWithComfyUI(
  videoPath,
  imgPrompt,
  isShort
) {
  try {
    const formats = configs.ComfyUI.Formats;
    const files = fs.readdirSync(path.join(__dirname, "./input"));
    const workflowPath = path.join(
      __dirname,
      configs.ComfyUI.Workflows.LLMWANVideo
    );
    console.log(`Loading workflow from: ${workflowPath}`);
    const outputPath = path.join(__dirname, "./input");
    const workflowStringData = fs.readFileSync(workflowPath, "utf8");
    const workflowJson = JSON.parse(workflowStringData);

    // Instructions
    workflowJson["51"]["inputs"]["text"] = imgPrompt;
    // WAN KSAMPLER
    workflowJson["107"]["inputs"]["seed"] = getRandomInt(1, 4294967294);
    // WAN LATENT Width and Height
    workflowJson["106"]["inputs"]["width"] = isShort
      ? formats.Vertical.WAN.Width
      : formats.Horizontal.WAN.Width;
    workflowJson["106"]["inputs"]["height"] = isShort
      ? formats.Vertical.WAN.Height
      : formats.Horizontal.WAN.Height;
    // WAN VIDEO OUTPUT
    workflowJson["95"]["inputs"]["filename_prefix"] = videoPath;

    const comfyUIEndpoint = configs.ComfyUI.Endpoints.Localhost;
    const options = {
      method: "POST",
      url: comfyUIEndpoint,
      headers: {
        "Content-Type": "application/json",
      },
      data: { prompt: workflowJson },
    };
    console.log(`Posting workflow to ComfyUI endpoint: ${comfyUIEndpoint}`);
    const response = await axios.request(options);
    await sleep(3000);
    console.log("Response with prompt_id:", response.data.prompt_id);
    let isProcessing = true;
    while (isProcessing) {
      const statusResponse = await axios.get(`${comfyUIEndpoint}`);
      isProcessing = statusResponse.data.exec_info.queue_remaining > 0;
      console.log("Is processing:", isProcessing);
      await sleep(1000);
    }
  } catch (error) {
    console.error("Error loading workflow or making POST request:", error);
  }
}

async function generateVideoWithStabilityAI(imgPath, videoPath) {
  const StabilityAISecret = configs.StabilityAI.Secret;
  const filePath = path.resolve(__dirname, imgPath);
  const fileStream = fs.createReadStream(filePath);

  const form = new FormData();
  form.append("image", fileStream);
  form.append("seed", "0");
  form.append("cfg_scale", "2.5");
  form.append("motion_bucket_id", configs.StabilityAI.MotionBucketId);
  const formHeaders = form.getHeaders();
  formHeaders.Authorization = `${StabilityAISecret}`;

  const optPost = {
    method: "POST",
    url: `${configs.StabilityAI.Endpoints.Image2Video}`,
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
  const base64String = vidResp.data.video;
  const binaryData = Buffer.from(base64String, "base64");
  fs.writeFileSync(videoPath, binaryData);
  console.log("Video Asset Generated with StabilityAI");
}

async function generateVideoWithGoogleAPI(
  imgPath,
  videoPath,
  dimensions,
  imgPrompt
) {
  console.log("Google API video generation is not yet implemented.");

  const isShort = dimensions.selectedHeight > dimensions.selectedWidth;

  const ai = new googleAi.GoogleGenAI({
    apiKey: configs.Google.VertexAI.ApiKey,
  });
  const filePath = path.resolve(__dirname, imgPath);
  const fileStream = fs.createReadStream(filePath);

  let operation = await ai.models.generateVideos({
    model: "veo-2.0-generate-001",
    prompt: imgPrompt,
    image: {
      imageBytes: fileStream.imageBytes,
      mimeType: "image/png",
    },
    config: {
      aspectRatio: isShort ? "9:16" : "16:9",
      numberOfVideos: 1,
    },
  });

  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({
      operation: operation,
    });
  }

  operation.response?.generatedVideos?.forEach(async (generatedVideo, n) => {
    const resp = await fetch(
      `${generatedVideo.video?.uri}&key=${configs.Google.VertexAI.ApiKey}` // append your API key
    );
    const writer = createWriteStream(videoPath);
    Readable.fromWeb(resp.body).pipe(writer);
  });
}

async function GenerateImage(
  imgPrompt,
  idx,
  isShort,
  isVideoClip,
  selectedTheme,
  isSDXL = false,
  isComfyUI = true
) {
  try {
    let imgPath = `input/image-${idx.toString().padStart(2, 0)}.png`;
    let videoPath = `input/video-${idx.toString().padStart(2, 0)}.mp4`;

    if (fs.existsSync(imgPath) && !isVideoClip) {
      console.log(`File Exists: ${imgPath}`);
    } else if (fs.existsSync(videoPath) && isVideoClip) {
      console.log(`File Exists: ${videoPath}`);
    } else {
      const dimensions = getDimensions(isShort);

      if (isComfyUI) {
        await generateImageWithComfyUI(
          imgPrompt,
          idx,
          isShort,
          isVideoClip,
          selectedTheme,
          isSDXL
        );
      } else {
        await generateImageWithStabilityAI(
          imgPath,
          imgPrompt,
          selectedTheme.Prompts.AdditionalStabilityAI,
          selectedTheme.Prompts.Negative,
          dimensions,
          isVideoClip
        );
      }
      if (isVideoClip) {
        await sleep(3000);
        await generateVideoClip(
          imgPath,
          videoPath,
          dimensions,
          true,
          imgPrompt,
          useComfyUI
        );
      }
    }
  } catch (ex) {
    console.log(
      "Error During Image Generation - Ex: " + axios.isAxiosError(ex) ? ex.response : ex
    );
  }
}

module.exports = { GenerateImage };
