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

function getComfyUIBaseUrl() {
  const endpoint = new URL(configs.ComfyUI.Endpoints.Localhost);
  endpoint.pathname = endpoint.pathname.replace(/\/?prompt\/?$/, "");
  return endpoint.toString().replace(/\/$/, "");
}

async function submitWorkflow(workflowJson) {
  const endpoint = configs.ComfyUI.Endpoints.Localhost;
  const response = await axios.post(endpoint, { prompt: workflowJson }, {
    headers: { "Content-Type": "application/json" },
    timeout: 30000,
  });
  const promptId = response.data?.prompt_id;
  if (!promptId) {
    throw new Error("ComfyUI did not return a prompt_id.");
  }

  console.log("Submitted ComfyUI prompt:", promptId);
  const historyUrl = `${getComfyUIBaseUrl()}/history/${encodeURIComponent(promptId)}`;
  const deadline = Date.now() + 20 * 60 * 1000;
  while (Date.now() < deadline) {
    const historyResponse = await axios.get(historyUrl, { timeout: 10000 });
    const record = historyResponse.data?.[promptId];
    if (record?.status?.status_str === "error") {
      throw new Error(`ComfyUI prompt ${promptId} failed.`);
    }
    if (record?.outputs && record.status?.completed !== false) {
      return record.outputs;
    }
    await sleep(2000);
  }
  throw new Error(`Timed out waiting for ComfyUI prompt ${promptId}.`);
}

async function downloadVideoOutput(outputs, videoNodeId, videoPath) {
  const nodeOutput = outputs[videoNodeId];
  const outputFiles = [
    ...(nodeOutput?.videos || []),
    ...(nodeOutput?.gifs || []),
    ...(nodeOutput?.images || []),
  ];
  const videoFile = outputFiles.find((file) =>
    /\.(mp4|webm|mov|mkv|gif)$/i.test(file.filename || "")
  );
  if (!videoFile?.filename) {
    const outputKeys = nodeOutput ? Object.keys(nodeOutput).join(", ") : "none";
    throw new Error(
      `ComfyUI history did not include a downloadable video for node ${videoNodeId}. ` +
        `Available output keys: ${outputKeys}.`
    );
  }

  const viewUrl = `${getComfyUIBaseUrl()}/view`;
  const response = await axios.get(viewUrl, {
    params: {
      filename: videoFile.filename,
      subfolder: videoFile.subfolder || "",
      type: videoFile.type || "output",
    },
    responseType: "arraybuffer",
    timeout: 120000,
  });
  fs.writeFileSync(videoPath, response.data);
}

async function generateVideoWorkflow(imgPrompt, idx, isShort, selectedTheme) {
  const formats = configs.ComfyUI.Formats;
  const selectedFormat = isShort ? formats.Vertical.FHD : formats.Horizontal.FHD;
  const inputPath = path.join(__dirname, "input");
  const outputToken = `${Date.now()}-${getRandomInt(1000, 9999)}`;
  const imagePrefix = `image-${idx.toString().padStart(2, "0")}-${outputToken}`;
  const videoFileName = `video-${idx.toString().padStart(2, "0")}-${outputToken}.mp4`;
  const imagePath = path.join(inputPath, `${imagePrefix}-01.png`);
  const videoPath = path.join(inputPath, videoFileName);
  const workflowPath = path.join(__dirname, configs.ComfyUI.Workflows.ZIMAGEVIDEO);
  const workflowJson = JSON.parse(fs.readFileSync(workflowPath, "utf8"));

  const requiredNodeIds = ["538:536", "12", "1430", "57", "58", "3", "1435", "1501:91"];
  if (requiredNodeIds.some((nodeId) => !workflowJson[nodeId]?.inputs)) {
    throw new Error("The configured video workflow is missing required prompt or save nodes.");
  }

  workflowJson["538:536"].inputs.value =
    `${selectedTheme.Prompts.Additional},${imgPrompt}`;
  workflowJson["57"].inputs.string = String(selectedFormat.Width);
  workflowJson["58"].inputs.string = String(selectedFormat.Height);
  workflowJson["3"].inputs.seed = getRandomInt(1, 4294967294);
  workflowJson["12"].inputs.output_path = inputPath;
  workflowJson["12"].inputs.filename_prefix = imagePrefix;
  workflowJson["1435"].inputs.aspect_ratio = isShort
    ? "9:16 (Portrait Widescreen)"
    : "16:9 (Widescreen)";
  workflowJson["1435"].inputs.megapixels = 0.4;
  workflowJson["1430"].inputs["filename_prefix"] =
    `${configs.ComfyUI.OutputFolders.VideoTemp}/${path.basename(videoFileName, ".mp4")}`;
  // The generated clip is intentionally silent; narration is muxed in later.
  delete workflowJson["1501:91"].inputs.audio;

  console.log(`Generating image and video for script item ${idx}`);
  const outputs = await submitWorkflow(workflowJson);
  const generatedImages = fs
    .readdirSync(inputPath)
    .filter((file) => file.startsWith(imagePrefix) && file.toLowerCase().endsWith(".png"))
    .map((file) => path.join(inputPath, file));
  if (generatedImages.length === 0) {
    throw new Error(`ComfyUI did not save an image with prefix ${imagePrefix}.`);
  }

  await downloadVideoOutput(outputs, "1430", videoPath);
  return { imagePath: generatedImages[0], videoPath };
}

async function generateImageWithComfyUI(
  imgPrompt,
  idx,
  isShort,
  selectedTheme
) {
  const imgFileNamePrefix = `image-${idx.toString().padStart(2, "0")}`;
  const formats = configs.ComfyUI.Formats;
  const files = fs.readdirSync(path.join(__dirname, "input"));
  if (files.some((file) => file.startsWith(imgFileNamePrefix) && file.endsWith(".png"))) {
    console.log(`File Exists: ${imgFileNamePrefix}`);
    return;
  }

  const positivePrompt = `${selectedTheme.Prompts.Additional},${imgPrompt}`;
  const workflowPath = path.join(__dirname, configs.ComfyUI.Workflows.LLMZIMAGE);
  const workflowJson = JSON.parse(fs.readFileSync(workflowPath, "utf8"));
  workflowJson["538:536"].inputs.value = positivePrompt;
  workflowJson["57"].inputs.string = String(
    isShort ? formats.Vertical.FHD.Width : formats.Horizontal.FHD.Width
  );
  workflowJson["58"].inputs.string = String(
    isShort ? formats.Vertical.FHD.Height : formats.Horizontal.FHD.Height
  );
  workflowJson["3"].inputs.seed = getRandomInt(1, 4294967294);
  workflowJson["12"].inputs.output_path = path.join(__dirname, "input");
  workflowJson["12"].inputs.filename_prefix = imgFileNamePrefix;
  await submitWorkflow(workflowJson);
}

async function GenerateImage(
  imgPrompt,
  idx,
  isShort,
  isVideo,
  selectedTheme
) {
  try {
    if (isVideo) {
      return await generateVideoWorkflow(imgPrompt, idx, isShort, selectedTheme);
    }

    const imgPath = path.join(
      __dirname,
      "input",
      `image-${idx.toString().padStart(2, "0")}.png`
    );
    if (fs.existsSync(imgPath)) {
      console.log(`File Exists: ${imgPath}`);
      return;
    }
    await generateImageWithComfyUI(
      imgPrompt,
      idx,
      isShort,
      selectedTheme
    );
  } catch (ex) {
    console.error("Error during image/video generation:", ex.message);
    throw ex;
  }
}

module.exports = { GenerateImage };
