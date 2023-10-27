const path = require("path");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

const fs = require("fs");
const extractAudio = require("ffmpeg-extract-audio");
const split = require("audio-split");
const { forEach } = require("lodash");
const inputPath = __dirname + "\\input";
const outputPath = __dirname + "\\output";

const { splitAudio } = require("audio-splitter");

async function main() {
  // get file list
  let videoFiles = fs.readdirSync(inputPath);
  let counter = 1;

  if (videoFiles.length > 0) {
    for (let v of videoFiles) {
      console.log("Processing file: " + v);
      // extract audio
      await extractAudio({
        input: inputPath + "\\" + v,
        output: outputPath + "\\full-audio-" + counter + ".mp3",
      });
      console.log("Audio extracted");
      // split audio
      await split({
        filepath: outputPath + "\\full-audio-" + counter + ".mp3",
        minClipLength: 5,
        maxClipLength: 10,
      });

      console.log("Audio splitted");
      counter++;
    }
  }
}

main();
