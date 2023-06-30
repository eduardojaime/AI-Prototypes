// Custom modules
const generate_images = require("./assets-generator-image");
const generate_audio = require("./assets-generator-audio");
const generate_script = require("./assets-generator-script");
const generate_video = require("./assets-generator-video");
// Required npm modules
const prompt = require("prompt");
const fs = require("fs");
const path = require("path");
// Global variables
const folderPath = "./output";
const outputFolder = path.join(__dirname, "output");
let finalOutput = "";
let finalOutputWithBgSound = "";
let audioFiles = [];
let imageFiles = [];

async function Setup() {
  fs.mkdirSync(outputFolder, { recursive: true });
  prompt.start();
  audioFiles = [];
  imageFiles = [];
  finalOutput = path.join(
    outputFolder,
    `final_output_${Math.floor(Date.now() / 1000)}.mp4`
  );
  finalOutputWithBgSound = path.join(
    outputFolder,
    `final_output_${Math.floor(Date.now() / 1000)}_background.mp4`
  );
}

async function GetAnswer(question) {
  console.log(question);
  const { answer } = await prompt.get(["answer"]);
  return answer.toUpperCase();
}

async function GenerateVideoOutput() {
  let generateVideoAnswer = await GetAnswer(
    "Do you want to generate video? Press Y to confirm."
  );
  if (generateVideoAnswer == "Y") {
    console.log("Asset generation complete, generating Video now");
    files = fs.readdirSync(folderPath);

    const pngFiles = files.filter(
      (file) => path.extname(file).toLowerCase() === ".png"
    );
    const pngFilePaths = pngFiles.map((file) => path.join(folderPath, file));
    imageFiles = pngFilePaths;

    const mpegFiles = files.filter(
      (file) =>
        path.extname(file).toLowerCase() === ".mp3" &&
        path.basename(file) !== "background.mp3"
    );
    const mpegFilePaths = mpegFiles.map((file) => path.join(folderPath, file));
    audioFiles = mpegFilePaths;

    if (imageFiles.length == audioFiles.length && imageFiles.length > 0) {
      console.log("Images and Audio files match");
      await generate_video(
        audioFiles,
        imageFiles,
        outputFolder,
        finalOutput,
        finalOutputWithBgSound
      );
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

async function Main() {
  Setup();
  let generateScript = false;
  let language = "EN"; // default english
  let languageAnswer = await GetAnswer(
    "Choose your Language: enter EN for English or ES for Spanish"
  );
  if (languageAnswer == "EN") {
    console.log("English Language Selected");
    language = "EN";
  } else if (languageAnswer == "ES") {
    console.log("Spanish Language Selected");
    language = "ES";
  } else {
    console.log("No language selected. Default set to English.");
  }

  let generateScriptAnswer = await GetAnswer(
    "Do you want to generate a CSV file with the script?"
  );
  if (generateScriptAnswer == "Y") {
    console.log("Generating CSV file with the script");
    generateScript = false;
  } else {
    console.log("Skipping CSV generation, utilizing existing CSV script.");
    generateScript = true;
  }

  let script = await generate_script(generateScript, language);
  console.log(script); // testing

  let verifiedScriptAnswer = await GetAnswer(
    "Is the Script file in the correct format? Press Y to confirm."
  );
  if (verifiedScriptAnswer == "Y") {
    let generateImagesAnswer = await GetAnswer(
      "Do you want to generate image files?"
    );
    if (generateImagesAnswer == "Y") {
      console.log("OK - Generating Image files");
      // TODO improve file generation
      ProcessScript(script, false, true);
    } else {
      console.log(
        "Skipping image assets generation, utilizing existing assets."
      );
    }

    let generateAudioAnswer = await GetAnswer(
      "Do you want to generate audio files?"
    );
    if (generateAudioAnswer == "Y") {
      console.log("OK - Generating Audio files");
      // TODO improve file generation
      ProcessScript(script, true, false);
    } else {
      console.log(
        "Skipping audio asset generation, utilizing existing assets."
      );
    }

    // Generate Video Output
    await GenerateVideoOutput();
  } else {
    console.log("Stopping Execution");
    return;
  }
}
// Process CSV
async function ProcessScript(script, skipImg, skipAudio) {
  let arr = script.split(/\r\n|\r|\n/);
  let idx = 1;
  for (const val of arr) {
    if (val.includes("---") || val.includes("STORY-")) {
      // console.log("skipping");
    } else {
      let row = val.split("|");

      if (!skipImg) {
        let imgPrompt = row[1]; // "A dark and eerie factory with smoke billowing out of the chimneys in the middle of a deserted town.";
        console.log("Generating Img Asset " + idx);
        await generate_images(imgPrompt, idx);
      }

      if (!skipAudio) {
        let audioPrompt = row[0]; // "There was a young man named Jorge who lived in a small town on the outskirts of Ciudad Juarez.";
        console.log("Generating Audio Asset " + idx);
        await generate_audio(audioPrompt, idx);
      }

      idx++;
    }
  }
}

Main();
