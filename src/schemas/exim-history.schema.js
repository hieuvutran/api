const mongoose = require("mongoose");
const eximSchema = new mongoose.Schema(
     {
          productId: {type: mongoose.Schema.Types.ObjectId, refPath: "type"},
          type: String, // furniture or foods
          createdAt: {type: Date, default: Date.now},
          quantity: Number,
          createdBy: {type: mongoose.Schema.Types.ObjectId, ref: "employees"}
     },
     { collection: "eximHistory" }
);

module.exports = mongoose.model("eximHistory", eximSchema);
