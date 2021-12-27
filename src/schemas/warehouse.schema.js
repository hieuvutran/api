const mongoose = require("mongoose");
const warehouseSchema = new mongoose.Schema(
     {
          name: String,
          hotelId: {type: mongoose.Schema.Types.ObjectId, ref: "hotels"},
          type: String,
          qrCode: String,
          stockReceivingAt: {type: Date},
          stockDeliveringAt: {type: Date},
     },
     { collection: "warehouse" }
);

module.exports = mongoose.model("warehouse", warehouseSchema);
