const mongoose = require("mongoose");

const furnitureSchema = new mongoose.Schema(
     {
          furName: String,
          hotelId: {type: mongoose.Schema.Types.ObjectId, ref: "hotels"},
          furnitureTypeId: {type: mongoose.Schema.Types.ObjectId, ref: "furnitureTypes"},
          quantity: {type: Number, default: 1},
          qrCode: String,
          createdAt: {type: Date, default: Date.now},
          updatedAt: {type: Date},
     },
     { collection: "furniture" }
);

module.exports = mongoose.model("furniture", furnitureSchema);
