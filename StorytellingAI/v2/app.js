const prompt = require("prompt");
const assets = require("./assets-generator");
const video = require("./video-generator");
const fs = require("fs");
const path = require("path");
const folderPath = "./output";
const outputFolder = path.join(__dirname, "output");
// changed output folder
const finalOutput = path.join(
  outputFolder,
  `final_output_${Math.floor(Date.now() / 1000)}.mp4`
);
const finalOutputWithBgSound = path.join(
  outputFolder,
  `final_output_${Math.floor(Date.now() / 1000)}_background.mp4`
);
fs.mkdirSync(outputFolder, { recursive: true });

let audioFiles = [];
let imageFiles = [];

prompt.start();

async function main() {
  let skipCSV = false;

  let generateCSV = await GetAnswer(
    "Do you want to generate a CSV file with the script?"
  );
  if (generateCSV == "Y") {
    console.log("Generating CSV file with the script");
    skipCSV = false;
  } else {
    console.log("Skipping CSV generation, utilizing existing CSV script.");
    skipCSV = true;
  }

  await assets(skipCSV, true, true); // generate CSV
  let verified = await GetAnswer(
    "Is the CSV file in the correct format? Press Y to confirm."
  );
  if (verified == "Y") {
    let generateImages = await GetAnswer(
      "Do you want to generate image files?"
    );
    if (generateImages == "Y") {
      console.log("OK - Generating Image files");
      await assets(true, false, true);
    } else {
      console.log(
        "Skipping image assets generation, utilizing existing assets."
      );
    }
    let generateAudio = await GetAnswer("Do you want to generate audio files?");
    if (generateAudio == "Y") {
      console.log("OK - Generating Audio files");
      await assets(true, true, false);
    } else {
      console.log(
        "Skipping audio asset generation, utilizing existing assets."
      );
    }
  } else {
    console.log("Stopping Execution");
    return;
  }

  let generate = await GetAnswer(
    "Do you want to generate video? Press Y to confirm."
  );
  if (generate == "Y") {
    console.log("Asset generation complete, generating Video now");
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

    if (imageFiles.length == audioFiles.length && imageFiles.length > 0) {
      console.log("Images and Audio files match");
      await video(audioFiles, imageFiles, outputFolder, finalOutput, finalOutputWithBgSound);
    } else {
      console.log(
        "Process will not start. Mismatch between image and audio files."
      );
    }
  } else {
    console.log("Stopping Execution");
    return;
  }
}

async function GetAnswer(question) {
  console.log(question);
  const { answer } = await prompt.get(["answer"]);
  return answer.toUpperCase();
}

// Start Process
main();
