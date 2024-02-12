// debug flags
// https://www.npmjs.com/package/axios#example
const configs = require("./configs");
const axios = require("axios");
const fs = require("fs");

exports.ReadScriptFile = async function(scriptPath) {
  let outputFilename = scriptPath; // "input/response-multi.mdtext";
  return fs.readFileSync(outputFilename, "utf-8");
}
// DEPRECATED > Script Generation happens in UI
exports.GenerateScript = async function (scriptPath, generateScript, language) {
  // Pipeline starts
  // Query OpenAI text generation > get img prompt and script
  let script ="";
  // Languages supported so far: EN, ES
  let outputFilename = scriptPath; // "input/response-multi.mdtext";
  // select language to generate
  if (generateScript) {    
    const OpenAIEndpoint = configs.OpenAI.Endpoint;
    const OpenAISecret = configs.OpenAI.Secret;
  
    const ChatPrompt = fs.readFileSync(configs.OpenAI.ChatPrompt, "utf-8");
    const SystemPrompt = fs.readFileSync(configs.OpenAI.SystemPrompt, "utf-8");
  
    console.log("Generating Script");
    const options = {
      method: "POST",
      url: `${OpenAIEndpoint}`,
      headers: {
        Authorization: `Bearer ${OpenAISecret}`, // Set the API key in the headers.
        "content-type": "application/json", // Set the content type to application/json.
      },
      data: {
        model: "gpt-3.5-turbo-16k",
        messages: [
          { role: "system", content: SystemPrompt },
          { role: "user", content: ChatPrompt },
        ],
      },
    };
    let resp = await axios.request(options);
    script = resp.data.choices[0].message.content;
    fs.writeFileSync(outputFilename, script);
    console.log("Script created, now processing");
  } else {
    script = fs.readFileSync(outputFilename, "utf-8");
  }

  return script;
}