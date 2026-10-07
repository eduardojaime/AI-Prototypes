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
const inputFolder = "./input";
const audioFileExtName = ".mp3";
const imageFileExtName = ".png";
const videoFileExtName = ".mp4";
const subtitlesFileName = "subtitles.srt";
const subtitlesFilePath = path.join(inputFolder, subtitlesFileName);
const backgroundAudioFileName = "background.mp3";

// Global Variables
let outputFolder = "./output";
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
let selectedTheme = {};
let inputScriptPath = "input/response-multi.mdtext";
// Enums
const SettingsEnum = {
  LangEN: "EN",
  AudioIdxEN: "0",
  LangES: "ES",
  AudioIdxES: "1",
  ShortIncrement: configs.Settings.ShortIncrement,
};

// UTILS
function getWeek() {
  const date = new Date(); // Get current date
  const yearStart = new Date(date.getFullYear(), 0, 1); // Get January 1st of the same year
  const daysPassed = Math.floor((date - yearStart) / 86400000); // Calculate the days passed since January 1st (1000 * 60 * 60 * 24 = 86400000)
  const startWeek = yearStart.getDay();
  const startOffset = startWeek === 0 ? 6 : startWeek - 1; // Adjust Sunday (0) to 6 (ISO starts Monday)
  const weekNumber = Math.floor((daysPassed + startOffset) / 7) + 1;
  return weekNumber;
}

// INPUTS
async function GetAnswer(question) {
  console.log(question);
  const { answer } = await prompt.get(["answer"]);
  return answer.toUpperCase();
}

async function SelectLanguage() {
  console.log("Select a Language: ");
  let selectedLanguage = await GetAnswer(
    "Select Language: 1 for English, 2 for Spanish"
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
      console.log("None selected, setting default as Spanish (ES).");
      language = SettingsEnum.LangES;
      audioIdx = SettingsEnum.AudioIdxES;
      break;
  }
}

async function SelectNarrationType() {
  isMale =
    (await GetAnswer("Is this a Female narration?")) === "Y"
      ? (console.log("Female Voice Selected"), false)
      : (console.log("Male Voice Selected"), true);
}

async function SelectTheme() {
  let themeIdx = await GetAnswer(
    "Select a Theme: 1 for Horror, 2 for Motivational"
  );
  switch (themeIdx) {
    case "1":
      selectedTheme = configs.Themes.Horror;
      break;
    case "2":
      selectedTheme = configs.Themes.Motivational;
      break;
    default:
      console.log("None selected, setting default as Horror.");
      selectedTheme = configs.Themes.Horror;
      break;
  }
}

async function SelectFormat() {
  isShort =
    (await GetAnswer("Is this a YouTube Short?")) === "Y"
      ? (console.log("Short Format Selected (Vertical Video)"),
        (outputFileNamePrefix = selectedTheme.OutputFileNamePrefixShorts),
        await RestoreFiles(selectedTheme.AssetsFolderShorts, inputFolder),
        true)
      : (console.log("Long Format Selected (Horizontal Video)"),
        (outputFileNamePrefix = selectedTheme.OutputFileNamePrefixLong),
        await RestoreFiles(selectedTheme.AssetsFolderLong, inputFolder),
        false);
}

async function SelectVideoClipOption() {
  isVideoClip = false;
    // (await GetAnswer("Do you want to generate a animated video?")) === "Y";
}

// PROCESSING AND GENERATION
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
        let imgPrompt = row[2];
        console.log("Generating Img Asset " + idx);
        await asset_generator_img.GenerateImage(
          imgPrompt,
          idx,
          isShort,
          isVideoClip,
          selectedTheme
        );
      }

      if (!skipAudio) {
        let audioPrompt = row[audioIdx];
        console.log("Generating Audio Asset " + idx);
        await asset_generator_audio.GenerateAudio(
          audioPrompt,
          idx,
          language,
          isMale
        );

        // log to external file subtitles.srt
        fs.appendFileSync(subtitlesFilePath, audioPrompt, (err) => {
          if (err) throw err;
          console.log("Subtitles file updated!");
        });
      }

      idx++;
    }
  }
}

async function GenerateShortVideos(scriptArr) {
  let increment = SettingsEnum.ShortIncrement;
  let startIdx = 2; // skip table headers and ---
  for (let i = startIdx; i < scriptArr.length; i += increment) {
    console.log(
      `Step (i): ${i} Increment: ${increment} ArrLength: ${scriptArr.length} Press any key to continue.`
    );
    let sliceArr = scriptArr.slice(i, i + increment);
    if (i >= startIdx + increment) {
      fs.appendFileSync(inputScriptPath, sliceArr.join("\n"));
    }
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
    console.log(`Generating Video Output ${language}`);
    audioFiles = [];
    frameFiles = [];
    await GenerateVideoOutput(language, isVideoClip);
    await CleanUp();
    await RestoreFiles(selectedTheme.AssetsFolderShorts, inputFolder);
  }
}

async function GenerateLongVideo(scriptArr) {
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
  await CleanUp();
}

async function GenerateVideoOutput(language, isVideoClip) {
  if (isShort) outputTimeStamp = Math.floor(Date.now() / 1000);
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
      path.extname(file).toLowerCase() === audioFileExtName &&
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
      "Process will not start. Mismatch between image and audio files. Audio Files: " +
        audioFiles.length +
        " Image Files: " +
        frameFiles.length
    );
    return; // allows for retry
  }
}
// FILE SETUP AND CLEANUP
async function Setup() {
  const currentYear = new Date().getFullYear();
  const currentWeek = getWeek();
  
  outputFolder = `./output/${currentYear}/${currentWeek
    .toString()
    .padStart(2, "0")}`;

  // check if output folder exists, if not create it
  fs.mkdirSync(outputFolder, { recursive: true });
  fs.mkdirSync(inputFolder, { recursive: true });
  prompt.start();
  audioFiles = [];
  imageFiles = [];
  videoFiles = [];
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
// MAIN FUNCTION
async function Main() {
  Setup();

  console.log("Welcome to StorytellingAI's Video Generation Engine");

  await SelectLanguage(); // EN or ES
  await SelectNarrationType(); // Male or Female Voice
  await SelectTheme(); // Horror or Motivational
  await SelectFormat(); // SHORT or LONG FORM
  await SelectVideoClipOption(); // Generate Video or Static Image Video

  let script = await asset_generator_script.ReadScriptFile(inputScriptPath); // DEPRECATED >> generate_script(generateScript, language);
  let scriptArr = script.split(/\r\n|\r|\n/);

  if (isShort) {
    await GenerateShortVideos(scriptArr);
  } else {
    await GenerateLongVideo(scriptArr);
  }
}

Main().catch((err) => {
  console.error(err);
});
