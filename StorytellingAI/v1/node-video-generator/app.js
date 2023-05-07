const video = require("./video-generator");
const fs = require("fs");
const path = require("path");

let audioFiles = [];
let imageFiles = [];

const folderPath = "./output";
const outputFolder = path.join(__dirname, "output");
const finalOutput = path.join(
  outputFolder,
  `final_output_${Math.floor(Date.now() / 1000)}.mp4`
);
fs.mkdirSync(outputFolder, { recursive: true });
files = fs.readdirSync(folderPath);

const pngFiles = files.filter(
  (file) => path.extname(file).toLowerCase() === ".png"
);
const pngFilePaths = pngFiles.map((file) => path.join(folderPath, file));
imageFiles = pngFilePaths;

const mpegFiles = files.filter(
  (file) => path.extname(file).toLowerCase() === ".mpeg"
);
const mpegFilePaths = mpegFiles.map((file) => path.join(folderPath, file));
audioFiles = mpegFilePaths;

if ((imageFiles.length == audioFiles.length) && imageFiles.length > 0) {
  console.log("Images and Audio files match");
  video(audioFiles, imageFiles,outputFolder, finalOutput);
} else {
  console.log(
    "Process will not start. Mismatch between image and audio files."
  );
}
