const mongoose = require("mongoose");
const schemaDefinition = {
  Name: { type: String, required: true },
  Url: { type: String, required: true },
  Keywords: { type: String },
  SeriesName: { type: String },
};
const schemaObject = new mongoose.Schema(schemaDefinition);
module.exports = mongoose.model("Channel", schemaObject);
