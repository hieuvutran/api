const mongoose = require("mongoose");

const roomTypesSchema = new mongoose.Schema(
     {
          typeName: String,
          capacity: String,
     },
     { collection: "roomTypes" }
);

module.exports = mongoose.model("roomTypes", roomTypesSchema);
