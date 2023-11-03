const mongoose = require("mongoose");
const schemaDefinition = {
  Name: { type: String, required: true },
  Description: { type: String, required: true },
  Tags: { type: String, required: true },
  Keywords: { type: String, required: true },
};
const schemaObject = new mongoose.Schema(schemaDefinition);
module.exports = mongoose.model("Theme", schemaObject);