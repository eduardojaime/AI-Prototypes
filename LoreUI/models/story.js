const mongoose = require("mongoose");
const schemaDefinition = {
  Version: { type: String, required: true, default: "v1" },
  Status: { type: String, required: true, default: "TO DO" }, // TO DO, IN PROGRESS, DONE, PUBLISHED
  DateAdded: { type: Date, required: true, default: new Date() },
  DatePublished: { type: Date },
  Channel: { type: String },
  Title: { type: String, required: true },
  Notes: { type: String, required: true },
  IsShort: { type: Boolean },
  IsFemale: { type: Boolean },
  Aesthetic: { type: String }, // 1 to 1
  ScriptTable: { type: String },
  MetadataEN: {
    LanguageCode: { type: String, default: "EN" },
    Title: { type: String },
    Description: { type: String },
    Tags: { type: String },
  },
  MetadataES: {
    LanguageCode: { type: String, default: "ES" },
    Title: { type: String },
    Description: { type: String },
    Tags: { type: String },
  },
};
const schemaObject = new mongoose.Schema(schemaDefinition);
module.exports = mongoose.model("Story", schemaObject);
