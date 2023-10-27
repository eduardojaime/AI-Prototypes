const mongoose = require("mongoose");
const schemaDefinition = {
  LanguageCode: { type: String, required: true },
  Table: { type: String, required: true },
  Metadata: {
    Title: { type: String, required: true },
    Description: { type: String, required: true },
    Tags: { type: String, required: true },
  },
};
const schemaObject = new mongoose.Schema(schemaDefinition);
module.exports = mongoose.model("Script", schemaObject);
