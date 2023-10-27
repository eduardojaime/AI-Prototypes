const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');
var userSchemaDefinition = {
    username: String,
    password: String
}
var userSchema = new mongoose.Schema(userSchemaDefinition);
userSchema.plugin(plm);
module.exports = new mongoose.model('User', userSchema);