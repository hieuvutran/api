const mongoose = require("mongoose");
const {FOODS_TYPE_ENUM, FOODS_STATUS_ENUM} = require('../constant/constant')
const foodsSchema = new mongoose.Schema(
     {
        foodName: String,
        foodType: {type: String, enum: FOODS_TYPE_ENUM},
        unitPrice: Number,
      //   unitName: {type: String},
        quantity: Number,
        hotelId: {type: mongoose.Schema.Types.ObjectId, ref: "hotels"},
        img: String,
     },
     { collection: "foods" }
);

module.exports = mongoose.model("foods", foodsSchema);
