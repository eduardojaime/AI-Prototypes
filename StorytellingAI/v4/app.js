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
const assetsFolder = "./output/longassets";
const outputFolder = path.join(__dirname, "output");
const outputTimeStamp = Math.floor(Date.now() / 1000);
let finalOutput = "";
let finalOutputWithBgSound = "";
let audioFiles = [];
let imageFiles = [];
let isShort = false;

async function Setup() {
  fs.mkdirSync(outputFolder, { recursive: true });
  prompt.start();
  audioFiles = [];
  imageFiles = [];
}

async function Main() {
  Setup();
  let generateScript = false;
  let language = "EN"; // default english
  let audioIdx = 0; // EN
  let isMale = await GetAnswer("Is this a Male narration?");
  if (isShortAnswer == "Y") {
    console.log("Male Voice Selected");
    isMale = true;
  } else {
    console.log("Female Voice Selected");
    isMale = false;
  }

  let isShortAnswer = await GetAnswer("Is this a YouTube Short?");
  if (isShortAnswer == "Y") {
    console.log("Short Format Selected (Vertical Video)");
    isShort = true;
  } else {
    console.log("Long Format Selected (Horizontal Video)");
    isShort = false;
  }

  let generateScriptAnswer = await GetAnswer(
    "Do you want to generate a CSV file with the script?"
  );
  if (generateScriptAnswer == "Y") {
    console.log("Generating CSV file with the script");
    generateScript = true;
  } else {
    console.log("Skipping CSV generation, utilizing existing CSV script.");
    generateScript = false;
  }

  let script = await generate_script(generateScript, language);

  let verifiedScriptAnswer = await GetAnswer(
    "Is the Script file in the correct format? Press Y to confirm."
  );
  if (verifiedScriptAnswer == "Y") {
    let generateImagesAnswer = await GetAnswer(
      "Do you want to generate image files?"
    );
    if (generateImagesAnswer == "Y") {
      console.log("OK - Generating Image files");
      await ProcessScript(script, false, true, "", -1, false);
    } else {
      console.log(
        "Skipping image assets generation, utilizing existing assets."
      );
    }

    let generateAudioAnswerEN = await GetAnswer(
      "Do you want to generate audio files? (EN)"
    );
    if (generateAudioAnswerEN == "Y") {
      console.log("OK - Generating Audio files (EN)");
      language = "EN";
      audioIdx = 0;
      await ProcessScript(script, true, false, language, audioIdx, isMale);
    } else {
      console.log(
        "Skipping audio asset generation (EN), utilizing existing assets."
      );
    }
    let generateAudioAnswerES = await GetAnswer(
      "Do you want to generate audio files? (ES)"
    );
    if (generateAudioAnswerES == "Y") {
      console.log("OK - Generating Audio files (ES)");
      language = "ES";
      audioIdx = 1;
      await ProcessScript(script, true, false, language, audioIdx, isMale);
    } else {
      console.log(
        "Skipping audio asset generation (ES), utilizing existing assets."
      );
    }
    // Generate Video Output
    await GenerateVideoOutput("EN");
    await GenerateVideoOutput("ES");

    await CleanUp();

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

async function ProcessScript(script, skipImg, skipAudio, language, audioIdx, isMale) {
  let arr = script.split(/\r\n|\r|\n/);
  let idx = 1;
  for (const val of arr) {
    if (val.includes("---") || val.includes("IMAGE-PROMPT-PARAGRAPH")) {
      // console.log("skipping");
    } else {
      let row = val.split("|");

      if (!skipImg) {
        let imgPrompt = row[2]; // "A dark and eerie factory with smoke billowing out of the chimneys in the middle of a deserted town.";
        console.log("Generating Img Asset " + idx);
        await generate_images(imgPrompt, idx, isShort);
      }

      if (!skipAudio) {
        let audioPrompt = row[audioIdx]; // "There was a young man named Jorge who lived in a small town on the outskirts of Ciudad Juarez.";
        console.log("Generating Audio Asset " + idx);
        await generate_audio(audioPrompt, idx, language, isMale);
      }

      idx++;
    }
  }
}

async function GenerateVideoOutput(language) {
  finalOutput = path.join(
    outputFolder,
    `final_output_${outputTimeStamp}_${language}.mp4`
  );
  finalOutputWithBgSound = path.join(
    outputFolder,
    `final_output_${outputTimeStamp}_background_${language}.mp4`
  );

  let generateVideoAnswer = await GetAnswer(
    `Do you want to generate video? (${language}) Press Y to confirm.`
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
        path.basename(file) !== "background.mp3" &&
        path.basename(file).includes(language)
    );
    console.log(mpegFiles);
    const mpegFilePaths = mpegFiles.map((file) => path.join(folderPath, file));
    audioFiles = mpegFilePaths;

    if (imageFiles.length == audioFiles.length && imageFiles.length > 0) {
      console.log("Images and Audio files match");
      await generate_video(
        audioFiles,
        imageFiles,
        outputFolder,
        finalOutput,
        finalOutputWithBgSound,
        isShort
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

async function CleanUp() {
  let videoFolder = `./${folderPath}/${outputTimeStamp}`;
  // copy output files to its own folder
  if (!fs.existsSync(videoFolder)) {
    fs.mkdirSync(videoFolder);
  }
  const files = fs.readdirSync(outputFolder);
  files.forEach((file) => {
    const sourceFile = path.join(outputFolder, file);
    const targetFile = path.join(videoFolder, file);
    const isDirectory = fs.statSync(sourceFile).isDirectory();
    if (!isDirectory) {
      fs.renameSync(sourceFile, targetFile);
    }
  });
  console.log("Moved output files to video folder named: " + videoFolder);

  // copy files from LongAssets folder
  const assetFiles = fs.readdirSync(assetsFolder);
  assetFiles.forEach((file) => {
    const sourceFile = path.join(assetsFolder, file);
    const targetFile = path.join(outputFolder, file);
    fs.copyFileSync(sourceFile, targetFile);
  });
  console.log("Restored Initial Files");
}

Main();
