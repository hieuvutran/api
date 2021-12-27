const mongoose = require("mongoose");

const roomsSchema = new mongoose.Schema(
     {
        roomName: String,
        hotelId: {type: mongoose.Schema.Types.ObjectId, ref: "hotels"},
        roomTypeId: {type: mongoose.Schema.Types.ObjectId, ref: "roomTypes"},
        roomNo: String,
        unitPrice: Number,
        furnitures: [{type: mongoose.Schema.Types.ObjectId, ref: "furniture"}]
     },
     { collection: "rooms" }
);

module.exports = mongoose.model("rooms", roomsSchema);
