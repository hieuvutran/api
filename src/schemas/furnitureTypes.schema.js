const mongoose = require("mongoose");

const furnitureTypesSchema = new mongoose.Schema(
     {
        furTypeName: String,
     },
     { collection: "furnitureTypes" }
);

module.exports = mongoose.model("furnitureTypes", furnitureTypesSchema);
