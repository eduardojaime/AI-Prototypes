const mongoose = require("mongoose");
const schemaDefinition = {
    name: { type: String, required: true }
};
const schemaObject = new mongoose.Schema(schemaDefinition);
module.exports = mongoose.model("Sample", schemaObject);