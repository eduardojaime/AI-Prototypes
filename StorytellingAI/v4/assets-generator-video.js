// video generation snippet
const fs = require("fs");
const path = require("path");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;
const ffmpeg = require("fluent-ffmpeg");
const musicMetadata = require("music-metadata");
const frameRate = 24;
const audioBitRate = "128k"; // "192k";
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const verticalScale = "scale=1080:1920";
const horizontalScale = "scale=1920:1080";

async function getDuration(filePath) {
  const metadata = await musicMetadata.parseFile(filePath);
  console.log(`Audio Duration: ${metadata.format.duration} seconds`);
  return metadata.format.duration;
}

async function ProcessFiles(
  audioFiles,
  frameFiles,
  inputFolder,
  finalOutput,
  finalOutputWithBgSound,
  isShort,
  isVideoClip
) {
  let backgroundSound = path.join(__dirname, "input/background.mp3");
  console.log("Starting Processing");
  if (audioFiles.length !== frameFiles.length) {
    console.error("The number of audio files and image files should be equal");
    return;
  }

  let selectedScale = isShort ? verticalScale : horizontalScale;

  const videoFiles = [];

  for (let i = 0; i < audioFiles.length; i++) {
    const audioPath = path.join(__dirname, audioFiles[i]);
    console.log("Processing " + audioPath);
    const framePath = path.join(__dirname, frameFiles[i]);
    console.log("Processing " + framePath);
    const outputPath = path.join(inputFolder, `output_${i + 1}.mp4`);

    try {
      if (isVideoClip) {
        await mergeVideoAndAudio(
          audioPath,
          framePath,
          outputPath,
          selectedScale
        );
      } else {
        // legacy
        await mergeAudioAndImages(
          audioPath,
          framePath,
          outputPath,
          selectedScale
        );
      }
      console.log("Finished Merging Video and Audio");
      videoFiles.push(outputPath);
    } catch (error) {
      console.error("Error processing files:", error.message);
      throw error;
    }
  }

  try {
    await concatVideos(videoFiles, finalOutput, isVideoClip);
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

async function mergeAudioAndImages(
  audioPath,
  imagePath,
  outputPath,
  selectedScale
) {
  console.log("Merging Audio and Files");
  console.log(audioPath);
  console.log(imagePath);

  let duration = await getDuration(audioPath);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(imagePath)
      .loop(duration) // needs duration value to work to avoid skipping in YT
      .input(audioPath)
      .videoCodec("libx264")
      .outputOption("-tune stillimage")
      .audioCodec("aac")
      .audioBitrate(audioBitRate)
      .outputOptions("-pix_fmt yuv420p")
      .outputOptions("-shortest")
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

async function mergeVideoAndAudio(
  audioPath,
  videoPath,
  outputPath,
  selectedScale
) {
  console.log("Merging Video and Audio");
  // console.log(audioPath);
  // console.log(videoPath);

  let duration = await getDuration(audioPath);
  let slowMotionFilter = `setpts=2*PTS`;
  const videoDuration = 4; // 2; // Duration of the video loop in seconds
  const loops = Math.ceil(duration / videoDuration); // Calculate the number of loops required
  console.log(`Video Duration: ${videoDuration} seconds`); 
  console.log(`Loops: ${loops}`)

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .inputOption(`-stream_loop ${loops - 1}`) // Use the calculated number of loops
      // .inputOption("-stream_loop -1") // Loop the video until it matches the audio duration
      .input(audioPath)
      .outputOptions([
        "-vcodec libx264",
        "-b:v 1000k",
        "-acodec aac",
        `-b:a ${audioBitRate}`,
        "-bufsize 1000k",
        "-ar 44100",
        "-pix_fmt yuv420p",
        "-shortest",
        `-r ${frameRate}`,
      ])
      .videoFilters(selectedScale) // , slowMotionFilter) // removed to test now videos are 4 seconds
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

async function concatVideos(videoFiles, finalOutput, isVideoClip) {
  return new Promise((resolve, reject) => {
    const concatListPath = path.join(__dirname, "concat-list.txt");
    const concatList = videoFiles.map((file) => `file '${file}'`).join("\n");
    fs.writeFileSync(concatListPath, concatList);

    if (isVideoClip) {
      ffmpeg()
        .input(concatListPath)
        .inputOptions(["-f concat", "-safe 0"])
        .outputOptions([
          "-vcodec libx264",
          "-b:v 1000k",
          "-acodec aac",
          `-b:a ${audioBitRate}`,
          "-bufsize 1000k",
          "-ar 44100",
          "-pix_fmt yuv420p",
          "-shortest",
          `-r ${frameRate}`,
        ])
        // .outputOptions(["-af apad=pad_len=88200"])
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
    } else {
      ffmpeg()
        .input(concatListPath)
        .inputOptions(["-f concat", "-safe 0"])
        // Append 2 seconds of silence to the output audio stream
        .outputOptions(["-af apad=pad_len=88200"])
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
    }
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
      // background audio file
      .input(backgroundFile)
      // try re-encoding your video to use the H.264 video codec and AAC audio codec
      // if not already using them, as these are widely supported and recommended by YouTube
      // Adjust the encoding preset (e.g., fast, medium, slow)
      // Set a constant frame rate of 24, 25, or 30
      // Sets the audio bitrate. Adjust as needed.
      // Sets the audio sample rate to 44.1 kHz
      .outputOptions([
        "-vcodec libx264",
        "-b:v 1000k",
        "-acodec aac",
        `-b:a ${audioBitRate}`,
        "-bufsize 1000k",
        "-ar 44100",
        "-pix_fmt yuv420p",
        // "-shortest",
        `-r ${frameRate}`,
      ])
      .complexFilter([
        "[1:a]volume=0.30[a1]", // Lower the volume of the second input (audio file)
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

module.exports = { ProcessFiles };
