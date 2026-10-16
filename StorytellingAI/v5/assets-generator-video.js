const fs = require("fs");
const path = require("path");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;
const ffmpeg = require("fluent-ffmpeg");
const musicMetadata = require("music-metadata");
const frameRate = 30; // Frame rate for smoother video
const audioBitRate = "384k"; // Increased audio bitrate for better quality
const videoBitRate = "8000k"; // Increased video bitrate for better quality
const audioSampleRate = 48000; // Set audio sample rate to 48 kHz
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const verticalScale = "scale=1080:1920";
const horizontalScale = "scale=1920:1080";
const verticalScale4k = "scale=2160:3840";
const horizontalScale4k = "scale=3840:2160";
const verticalScale8k = "scale=4320:7680";
const horizontalScale8k = "scale=7680:4320";

async function getDuration(filePath) {
  const metadata = await musicMetadata.parseFile(filePath);
  console.log(`Audio Duration: ${metadata.format.duration} seconds`);
  return metadata.format.duration;
}

function resolveAssetPath(filePath) {
  return path.isAbsolute(filePath) ? filePath : path.resolve(__dirname, filePath);
}

async function ProcessFiles(
  audioFiles,
  frameFiles,
  inputFolder,
  finalOutput,
  finalOutputWithBgSound,
  isShort,
  isVideo
) {
  let backgroundSound = path.join(__dirname, "input/background.mp3");
  console.log("Starting Processing");
  if (audioFiles.length !== frameFiles.length) {
    console.error("The number of audio files and visual assets should be equal");
    return;
  }

  let selectedScale = isShort ? verticalScale : horizontalScale;

  const videoFiles = [];

  for (let i = 0; i < audioFiles.length; i++) {
    const audioPath = resolveAssetPath(audioFiles[i]);
    console.log("Processing " + audioPath);
    const framePath = resolveAssetPath(frameFiles[i]);
    console.log("Processing " + framePath);
    const outputPath = path.join(inputFolder, `output_${i + 1}.mp4`);

    try {
      if (isVideo) {
        await mergeVideoAndAudio(
          audioPath,
          framePath,
          outputPath,
          selectedScale
        );
      } else {
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
    await concatVideos(videoFiles, finalOutput, isVideo);
    await addBackgroundEffect(
      finalOutput,
      backgroundSound,
      finalOutputWithBgSound
    );
    videoFiles.forEach((file) => fs.unlinkSync(file));
  } catch (error) {
    console.error("Error concatenating videos:", error.message);
    throw error;
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
      .videoBitrate(videoBitRate) // Set video bitrate
      .outputOptions("-pix_fmt yuv420p")
      .outputOptions("-shortest")
      .outputOptions(`-ar ${audioSampleRate}`) // Set audio sample rate
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
  let duration = await getDuration(audioPath);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Could not determine a valid narration duration for ${audioPath}`);
  }

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .inputOptions(["-stream_loop -1"])
      .input(audioPath)
      .outputOptions([
        "-map 0:v:0",
        "-map 1:a:0",
        "-c:v libx264",
        `-b:v ${videoBitRate}`, // Set video bitrate
        "-c:a aac",
        `-b:a ${audioBitRate}`, // Set audio bitrate
        "-bufsize 8000k",
        `-ar ${audioSampleRate}`, // Set audio sample rate
        "-pix_fmt yuv420p",
        "-shortest",
        `-t ${duration.toFixed(3)}`,
        `-r ${frameRate}`, // Set frame rate
        "-shortest",
      ])
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

async function concatVideos(videoFiles, finalOutput, isVideo) {
  return new Promise((resolve, reject) => {
    const concatListPath = path.join(__dirname, "concat-list.txt");
    const concatList = videoFiles.map((file) => `file '${file}'`).join("\n");
    fs.writeFileSync(concatListPath, concatList);

    if (isVideo) {
      ffmpeg()
        .input(concatListPath)
        .inputOptions(["-f concat", "-safe 0"])
        .outputOptions([
          "-map 0:v:0",
          "-map 0:a:0",
          "-vcodec libx264",
          `-b:v ${videoBitRate}`, // Set video bitrate
          "-acodec aac",
          `-b:a ${audioBitRate}`, // Set audio bitrate
          "-bufsize 8000k",
          `-ar ${audioSampleRate}`, // Set audio sample rate
          "-pix_fmt yuv420p",
          "-shortest",
          `-r ${frameRate}`, // Set frame rate
        ])
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
        `-b:v ${videoBitRate}`, // Set video bitrate
        "-acodec aac",
        `-b:a ${audioBitRate}`, // Set audio bitrate
        "-bufsize 8000k",
        `-ar ${audioSampleRate}`, // Set audio sample rate
        "-pix_fmt yuv420p",
        `-r ${frameRate}`, // Set frame rate
      ])
      .complexFilter([
        "[0:a]asetpts=PTS-STARTPTS,volume=3.00[a0]", // Normalize/increase narration audio
        "[1:a]asetpts=PTS-STARTPTS,volume=0.15[a1]", // Normalize/lower background music
        "[a0][a1]amix=inputs=2:duration=longest:dropout_transition=2,apad[a]",
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
