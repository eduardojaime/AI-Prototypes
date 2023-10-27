const mongoose = require("mongoose");
const schemaDefinition = {
  Name: { type: String, required: true },
  AdditionalPrompt: { type: String, required: true },
  NegativePrompt: { type: String, required: true },
  StylePreset: { type: String, required: true },
  Sampler: { type: String, required: true },
  ClipGuidancePreset: { type: String, required: true },
};
const schemaObject = new mongoose.Schema(schemaDefinition);
module.exports = mongoose.model("Aesthetic", schemaObject);
