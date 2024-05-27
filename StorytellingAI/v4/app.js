// Custom modules
const asset_generator_img = require("./assets-generator-image");
const asset_generator_audio = require("./assets-generator-audio");
const asset_generator_script = require("./assets-generator-script");
const asset_generator_video = require("./assets-generator-video");
// Required npm modules
const prompt = require("prompt");
const fs = require("fs");
const path = require("path");
const configs = require("./configs");
// Global Constants
const assetsFolder = "./input/assets";
const longAssetsFolder = "./input/longassets";
const shortAssetsFolder = "./input/shortassets";
const outputFolder = "./output"; // path.join(__dirname, "output");
const inputFolder = "./input";
const audioFileExtname = ".mp3";
const imageFileExtName = ".png";
const videoFileExtName = ".mp4";
const backgroundAudioFileName = "background.mp3";
const useXLEndpoint = true;
// Global Variables
let outputTimeStamp = Math.floor(Date.now() / 1000);
let finalOutput = "";
let finalOutputWithBgSound = "";
let outputFileNamePrefix = "";
let audioFiles = [];
let frameFiles = [];
let isShort = false;
let isMale = false;
let isVideoClip = false;
let language = "EN";
let audioIdx = 0;
let inputScriptPath = "input/response-multi.mdtext";
// Enums
const SettingsEnum = {
  LangEN: "EN",
  AudioIdxEN: "0",
  LangES: "ES",
  AudioIdxES: "1",
  ShortIncrement: configs.Settings.ShortIncrement,
};

async function Setup() {
  fs.mkdirSync(outputFolder, { recursive: true });
  fs.mkdirSync(inputFolder, { recursive: true });
  prompt.start();
  audioFiles = [];
  imageFiles = [];
  videoFiles = [];
}

async function Main() {
  Setup();

  console.log("Welcome to StorytellingAI's Video Generation Engine");
  console.log("Select a Language: ");
  let selectedLanguage = await GetAnswer(
    "Enter 1 for English or 2 for Spanish"
  );
  switch (selectedLanguage) {
    case "1":
      language = SettingsEnum.LangEN;
      audioIdx = SettingsEnum.AudioIdxEN;
      break;
    case "2":
      language = SettingsEnum.LangES;
      audioIdx = SettingsEnum.AudioIdxES;
      break;
    default:
      console.log("None selected, setting default as spanish (ES).");
      language = SettingsEnum.LangES;
      audioIdx = SettingsEnum.AudioIdxES;
      break;
  }

  isMale =
    (await GetAnswer("Is this a Female narration?")) === "Y"
      ? (console.log("Female Voice Selected"), false)
      : (console.log("Male Voice Selected"), true);

  isShort =
    (await GetAnswer("Is this a YouTube Short?")) === "Y"
      ? (console.log("Short Format Selected (Vertical Video)"),
        (outputFileNamePrefix = "SHORTS-HORROR"),
        await RestoreFiles(shortAssetsFolder, inputFolder),
        true)
      : (console.log("Long Format Selected (Horizontal Video)"),
        (outputFileNamePrefix = "VIDEO-HORROR"),
        await RestoreFiles(longAssetsFolder, inputFolder),
        false);

  isVideoClip =
    (await GetAnswer(
      "Do you want to generate a StableVideoDiffusion video?"
    )) === "Y"
      ? true
      : false;

  let script = await asset_generator_script.ReadScriptFile(inputScriptPath); // DEPRECATED >> generate_script(generateScript, language);
  let scriptArr = script.split(/\r\n|\r|\n/);

  if (isShort == true) {
    let increment = SettingsEnum.ShortIncrement;
    let startIdx = 2; // skip table headers and ---
    // let isWait1 = await GetAnswer(`Starting short generation. Press any key to continue.`);

    for (let i = startIdx; i < scriptArr.length; i += increment) {
      console.log(
        `Step (i): ${i} Increment: ${increment} ArrLength: ${scriptArr.length} Press any key to continue.`
      );
      // take three
      let sliceArr = scriptArr.slice(i, i + increment);
      // e.g. 2 + 4 = 6, position 6 is the second short in the 0-based index array
      if (i >= startIdx + increment) {
        fs.appendFileSync(inputScriptPath, sliceArr.join("\n"));
      }

      // process
      console.log(`Generating Image and Audio Files ${language}`);
      await ProcessScript(
        sliceArr,
        false,
        false,
        language,
        audioIdx,
        isMale,
        isVideoClip
      );

      // generate
      console.log(`Generating Video Output ${language}`);
      audioFiles = [];
      frameFiles = [];
      await GenerateVideoOutput(language, isVideoClip);
      // cleanup
      await CleanUp();
      await RestoreFiles(shortAssetsFolder, inputFolder);
    }
  } else {
    console.log("Generating Image Files");
    await ProcessScript(scriptArr, false, true, "", -1, false, isVideoClip);

    console.log(`Generating Audio Files ${language}`);
    await ProcessScript(
      scriptArr,
      true,
      false,
      language,
      audioIdx,
      isMale,
      isVideoClip
    );

    console.log(`Generating Video Output ${language}`);
    await GenerateVideoOutput(language, isVideoClip);
  }
  await CleanUp();
}

async function GetAnswer(question) {
  console.log(question);
  const { answer } = await prompt.get(["answer"]);
  return answer.toUpperCase();
}

async function ProcessScript(
  scriptArr,
  skipImg,
  skipAudio,
  language,
  audioIdx,
  isMale,
  isVideoClip
) {
  let idx = 1;
  for (const val of scriptArr) {
    if (val.includes("---") || val.includes("IMAGE-PROMPT-PARAGRAPH")) {
      // console.log("skipping");
    } else {
      let row = val.split("|");

      if (!skipImg) {
        let imgPrompt = row[2]; // "A dark and eerie factory with smoke billowing out of the chimneys in the middle of a deserted town.";
        console.log("Generating Img Asset " + idx);
        await asset_generator_img.GenerateImage(imgPrompt, idx, isShort, isVideoClip, useXLEndpoint);
      }

      if (!skipAudio) {
        let audioPrompt = row[audioIdx]; // "There was a young man named Jorge who lived in a small town on the outskirts of Ciudad Juarez.";
        console.log("Generating Audio Asset " + idx);
        await asset_generator_audio.GenerateAudio(audioPrompt, idx, language, isMale);
      }

      idx++;
    }
  }
}

async function GenerateVideoOutput(language, isVideoClip) {
  if (isShort) outputTimeStamp = Math.floor(Date.now() / 1000); // update
  finalOutput = path.join(
    outputFolder,
    `${outputFileNamePrefix}_${outputTimeStamp}_${language}.mp4`
  );
  finalOutputWithBgSound = path.join(
    outputFolder,
    `${outputFileNamePrefix}_${outputTimeStamp}_BG_${language}.mp4`
  );

  console.log("Asset generation complete, generating Video now");
  files = fs.readdirSync(inputFolder);

  // Frames
  const pngFiles = files.filter(
    (file) => path.extname(file).toLowerCase() === imageFileExtName
  );
  const pngFilePaths = pngFiles.map((file) => path.join(inputFolder, file));
  frameFiles = pngFilePaths;

  console.log("Is VideoClip: " + isVideoClip);
  if (isVideoClip) {
    const mp4Files = files.filter(
      (file) => path.extname(file).toLowerCase() === videoFileExtName
    );
    console.log(mp4Files);
    const mp4FilePaths = mp4Files.map((file) => path.join(inputFolder, file));
    frameFiles = mp4FilePaths;
  }

  // Audio
  const mpegFiles = files.filter(
    (file) =>
      path.extname(file).toLowerCase() === audioFileExtname &&
      path.basename(file) !== backgroundAudioFileName &&
      path.basename(file).includes(language)
  );
  console.log(mpegFiles);
  const mpegFilePaths = mpegFiles.map((file) => path.join(inputFolder, file));
  audioFiles = mpegFilePaths;
  console.log("Is Short: " + isShort);

  if (frameFiles.length == audioFiles.length && frameFiles.length > 0) {
    console.log("Images and Audio files match");
    await asset_generator_video.ProcessFiles(
      audioFiles,
      frameFiles,
      outputFolder,
      finalOutput,
      finalOutputWithBgSound,
      isShort,
      isVideoClip
    );
  } else {
    console.log(
      "Process will not start. Mismatch between image and audio files."
    );
    return; // allows for retry
  }
}

async function CleanUp() {
  let videoFolder = `./${outputFolder}/${outputTimeStamp}`;
  // copy output files to its own folder
  if (!fs.existsSync(videoFolder)) {
    fs.mkdirSync(videoFolder);
  }
  const outputFiles = fs.readdirSync(outputFolder);
  outputFiles.forEach((file) => {
    const sourceFile = path.join(outputFolder, file);
    const targetFile = path.join(videoFolder, file);
    const isDirectory = fs.statSync(sourceFile).isDirectory();
    if (!isDirectory) {
      fs.renameSync(sourceFile, targetFile);
    }
  });
  const inputFiles = fs.readdirSync(inputFolder);
  inputFiles.forEach((file) => {
    const sourceFile = path.join(inputFolder, file);
    const targetFile = path.join(videoFolder, file);
    const isDirectory = fs.statSync(sourceFile).isDirectory();
    if (!isDirectory) {
      fs.renameSync(sourceFile, targetFile);
    }
  });
  console.log("Moved output files to video folder named: " + videoFolder);
  RestoreFiles(assetsFolder, inputFolder);
}

async function RestoreFiles(assetsFolder, outputFolder) {
  // copy files from LongAssets folder
  const assetFiles = fs.readdirSync(assetsFolder);
  assetFiles.forEach((file) => {
    const sourceFile = path.join(assetsFolder, file);
    const targetFile = path.join(outputFolder, file);
    fs.copyFileSync(sourceFile, targetFile);
  });
  console.log("Restored Initial Files");
}

Main().catch((err) => {
  console.error(err);
});
