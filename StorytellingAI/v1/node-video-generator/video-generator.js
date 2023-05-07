// video generation snippet
const fs = require("fs");
const path = require("path");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

async function processFiles(audioFiles, imageFiles, outputFolder, finalOutput) {
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
    videoFiles.forEach((file) => fs.unlinkSync(file));
  } catch (error) {
    console.error("Error concatenating videos:", error.message);
  }
}

async function mergeAudioAndImages(audioPath, imagePath, outputPath) {
  console.log("Merging Audio and Files");

  return new Promise((resolve, reject) => {
    ffmpeg()
      .addInput(imagePath)
      .addInputOption(["-loop 1"]) // Loop the image to match the audio duration
      .addInput(audioPath)
      .addOutputOptions([
        "-c:v libx264",
        "-tune stillimage",
        "-c:a aac",
        "-b:a 192k",
        "-pix_fmt yuv420p",
        "-shortest",
      ])
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

async function concatVideos(videoFiles, outputPath) {
  return new Promise((resolve, reject) => {
    const concatListPath = path.join(__dirname, "concat-list.txt");
    const concatList = videoFiles.map((file) => `file '${file}'`).join("\n");
    fs.writeFileSync(concatListPath, concatList);

    ffmpeg()
      .input(concatListPath)
      .inputOptions(["-f concat", "-safe 0"])
      .outputOptions("-c copy")
      .save(outputPath)
      .on("end", () => {
        console.log("Concatenation completed: " + outputPath);
        fs.unlinkSync(concatListPath); // Clean up the concat list file
        resolve();
      })
      .on("error", (error) => {
        console.error("Error during concatenation:", error.message);
        reject(error);
      });
  });
}

// fs.mkdirSync(outputFolder, { recursive: true });
// processFiles(audioFiles, imageFiles, outputFolder, finalOutput);
module.exports = processFiles;
