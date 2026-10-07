const fs = require("fs");

exports.ReadScriptFile = async function(scriptPath) {
  let outputFilename = scriptPath; // "input/response-multi.mdtext";
  return fs.readFileSync(outputFilename, "utf-8");
}