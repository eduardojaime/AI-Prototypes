const configs = require("./configs");
const axios = require("axios");
const FormData = require("form-data");

const fs = require("fs");
const path = require("path");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const verticalScale = "scale=1080:1920";
const horizontalScale = "scale=1920:1080";

// TODO add to new module assets-generator-videoclip
async function Test() {
  try {
    const url = "https://api.stability.ai/v2alpha/generation/image-to-video";
    const resultUrl =
      "https://api.stability.ai/v2alpha/generation/image-to-video/result/";
    let sourceImg = "./input/test01.png";

    if (fs.existsSync(sourceImg)) console.log("File Exists!");
    const filePath = path.resolve(__dirname, sourceImg);
    const fileStream = fs.createReadStream(filePath);

    console.log("testing video generation");

    const StabilityAISecret = configs.StabilityAI.Secret;
    // instructions on https://www.npmjs.com/package/form-data
    const form = new FormData();

    form.append("image", fileStream);
    //form.append("image", sourceImg); // another option
    form.append("seed", "0");
    form.append("cfg_scale", "2.5");
    form.append("motion_bucket_id", "40");
    const formHeaders = form.getHeaders();
    formHeaders.Authorization = `${StabilityAISecret}`;

    const options1 = {
      method: "POST",
      url: `${url}`,
      // pull headers from form-data getHeaders() method
      headers: { ...formHeaders },
      data: form,
    };

    let idResp = await axios.request(options1);
    let id = idResp.data.id;
    console.log(id);

    await sleep(60000);
    // if video is not ready it'll return
    // {
    //     "id": "23d7bdbb0fb4e78b8d25388439241cb6c7e1bf2d740e26636f31b0f1955bb55c",
    //     "status": "in-progress"
    // }
    // so we need to wait

    const options2 = {
      method: "GET",
      url: `${resultUrl}${id}`,
      headers: {
        authorization: `${StabilityAISecret}`,
        Accept: "application/json",
      },
    };
    let vidResp = await axios.request(options2);
    // console.log(vidResp.data);
    base64String = vidResp.data.video;
    let binaryData = Buffer.from(base64String, "base64");
    fs.writeFileSync(`input/test01.mp4`, binaryData);
    console.log("Video Asset Generated");
  } catch (ex) {
    console.log(ex.response.data.errors);
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// ALREADY ADDED TO assets-generator-video.js
async function TestMerge(audioPath, videoPath, outputPath, selectedScale) {
  console.log("Merging Video and Audio");
  // alternative to slow down the video
  let slowMotionFilter = `setpts=2*PTS`;

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .inputOption("-stream_loop -1") // Loop the video until it matches the audio duration
      .input(audioPath)
      .videoCodec("libx264")
      .outputOption("-tune stillimage")
      .audioCodec("aac")
      .audioBitrate("192k")
      .outputOptions("-pix_fmt yuv420p")
      .outputOptions("-shortest") // Ensures that the output duration is the same as the shortest input stream
      .videoFilters(selectedScale)
      .save(outputPath)
      .on("end", () => {
        console.log("Merging completed: " + outputPath);
        resolve();
      })
      .on("error", (error) => {
        console.error("Error during merging:", error.message);
        reject(error);
      });
  });
}

// TestMerge(
//   "./input/test01.mp3",
//   "./input/test01.mp4",
//   "./input/output.mp4",
//   horizontalScale
// );


Test();