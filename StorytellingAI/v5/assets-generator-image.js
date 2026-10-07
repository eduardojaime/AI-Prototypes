const configs = require("./configs");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function generateImageWithComfyUI(
  imgPrompt,
  idx,
  isShort,
  isVideoClip,
  selectedTheme
) {
  try {
    const imgFileNamePrefix = `image-${idx.toString().padStart(2, 0)}`;
    const videFileNamePrefix = `video-${idx.toString().padStart(2, 0)}`;
    const imgPath = path.join(__dirname, `./input/${imgFileNamePrefix}-01.png`);
    const videoPath = path.join(__dirname, `/input/${videFileNamePrefix}.mp4`);
    const formats = configs.ComfyUI.Formats;
    const files = fs.readdirSync(path.join(__dirname, "./input"));
    const imgExists = files.some((file) => file.includes(imgFileNamePrefix));
    const videoExists = files.some((file) => file.includes(videFileNamePrefix));
    if (imgExists) {
      console.log(`File Exists: ${imgFileNamePrefix}`);
    } else {
      const positivePrompt = selectedTheme.Prompts.Additional + "," + imgPrompt;
      const workflowPath = path.join(__dirname, configs.ComfyUI.Workflows.LLMZIMAGE);
      console.log(`Loading workflow from: ${workflowPath}`);
      const outputPath = path.join(__dirname, "./input");
      const workflowStringData = fs.readFileSync(workflowPath, "utf8");
      const workflowJson = JSON.parse(workflowStringData);
      // LLM RANDOM SEED
      // workflowJson["115"]["inputs"]["seed"] = getRandomInt(1, 4294967294); 

      // INTRUCTIONS
      workflowJson["538:536"]["inputs"]["value"] = positivePrompt; // Prompt to be enhanced by LLM
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

async function generateVideoClip(
  imgPath,
  videoPath,
  isShort = false,
  useGoogleAPI = true,
  imgPrompt = ""
) {
  console.log("Video implementation pending...");
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
      
      await generateImageWithComfyUI(
        imgPrompt,
        idx,
        isShort,
        isVideoClip,
        selectedTheme
      );
    }
  } catch (ex) {
    console.log(
      "Error During Image Generation - Ex: " + axios.isAxiosError(ex) ? ex.response : ex
    );
  }
}

module.exports = { GenerateImage };
