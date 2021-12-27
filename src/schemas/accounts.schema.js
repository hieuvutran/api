const mongoose = require("mongoose");
const {ROLE_ENUM} = require('../constant/constant')
const accountsSchema = new mongoose.Schema(
     {
          username: {type:String, unique: true, index: true , required: [true, "username required."],},
          password: String,
          role: {type: String, enum: Object.values(ROLE_ENUM), default: ROLE_ENUM.customer}
     },
     { collection: "accounts" }
);
module.exports = mongoose.model("accounts", accountsSchema);
