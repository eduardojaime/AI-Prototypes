// video generation snippet
const fs = require("fs");
const path = require("path");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;
const ffmpeg = require("fluent-ffmpeg");
const musicMetadata = require('music-metadata');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);


async function getDuration(filePath) {
  const metadata = await musicMetadata.parseFile(filePath);
  console.log('Duration:', metadata.format.duration);
  return metadata.format.duration;
}

async function processFiles(
  audioFiles,
  imageFiles,
  outputFolder,
  finalOutput,
  finalOutputWithBgSound
) {
  let backgroundSound = path.join(__dirname, "output/background.mp3");
  console.log("Starting Processing");
  console.log(outputFolder);
  if (audioFiles.length !== imageFiles.length) {
    console.error("The number of audio files and image files should be equal");
    return;
  }

  const videoFiles = [];

  for (let i = 0; i < audioFiles.length; i++) {
    const audioPath = path.join(__dirname, audioFiles[i]);
    console.log("Processing " + audioPath);
    const imagePath = path.join(__dirname, imageFiles[i]);
    console.log("Processing " + imagePath);
    const outputPath = path.join(outputFolder, `output_${i + 1}.mp4`);

    try {
      await mergeAudioAndImages(audioPath, imagePath, outputPath);
      videoFiles.push(outputPath);
    } catch (error) {
      console.error("Error processing files:", error.message);
    }
  }

  try {
    await concatVideos(videoFiles, finalOutput);
    await addBackgroundEffect(
      finalOutput,
      backgroundSound,
      finalOutputWithBgSound
    );
    videoFiles.forEach((file) => fs.unlinkSync(file));
  } catch (error) {
    console.error("Error concatenating videos:", error.message);
  }
}

async function mergeAudioAndImages(audioPath, imagePath, outputPath) {
  console.log("Merging Audio and Files");

  let duration = await getDuration(audioPath);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(imagePath)
      .loop(duration) // needs duration value to work to avoid skipping in YT
      .input(audioPath)
      .videoCodec("libx264")
      .outputOption("-tune stillimage")
      .audioCodec("aac")
      .audioBitrate("192k")
      .outputOptions("-pix_fmt yuv420p")
      .outputOptions("-shortest")
      .videoFilters("scale=1920:1080")
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

async function concatVideos(videoFiles, finalOutput) {
  return new Promise((resolve, reject) => {
    const concatListPath = path.join(__dirname, "concat-list.txt");
    const concatList = videoFiles.map((file) => `file '${file}'`).join("\n");
    fs.writeFileSync(concatListPath, concatList);

    ffmpeg()
      .input(concatListPath)
      .inputOptions(["-f concat", "-safe 0"])
      // .outputOptions(["-c:v libx264", "-c:a aac"]) // try re-encoding your video to use the H.264 video codec and AAC audio codec if not already using them, as these are widely supported and recommended by YouTube
      // .outputOptions("-c copy") // This option, which simply copies the input streams to the output. This is fast and doesn't degrade quality, but it might not handle concatenation of dissimilar files well. Try removing this option to have ffmpeg re-encode the streams during concatenation, which might result in better handling of the audio transition
      .save(finalOutput)
      .on("end", () => {
        console.log("Concatenation completed: " + finalOutput);
        fs.unlinkSync(concatListPath);
        resolve();
      })
      .on("error", (error) => {
        console.error("Error during concatenation:", error.message);
        reject(error);
      });
  });
}

async function addBackgroundEffect(
  finalOutput,
  backgroundFile,
  finalOutputWithBgSound
) {
  // let duration = getDuration(finalOutput);
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(finalOutput)
      .input(backgroundFile) // background audio file
      // .loop(duration) // not found needs rework
      // removing these  as these are already set during merging
      // .outputOptions("-c:v copy") // copy video codec
      // .outputOptions("-c:a aac") // encode audio to AAC
      .outputOptions(["-c:v libx264", "-c:a aac"]) // try re-encoding your video to use the H.264 video codec and AAC audio codec if not already using them, as these are widely supported and recommended by YouTube
      .complexFilter([
        "[1:a]volume=0.30[a1]", // Lower the volume of the second input (audio file) by half
        "[0:a][a1]amix=inputs=2:duration=first:dropout_transition=2[a]",
      ])
      .outputOptions(["-map 0:v", "-map [a]"])
      .save(finalOutputWithBgSound)
      .on("end", () => {
        console.log("Background sound added: " + finalOutputWithBgSound);
        resolve();
      })
      .on("error", (error) => {
        console.error("Error while adding background sound:", error.message);
        reject(error);
      });
  });
}

// fs.mkdirSync(outputFolder, { recursive: true });
// processFiles(audioFiles, imageFiles, outputFolder, finalOutput);
module.exports = processFiles;
