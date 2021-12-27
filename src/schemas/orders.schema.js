const mongoose = require("mongoose");
const {ORDER_STATUS_ENUM} = require('../constant/constant');

const ordersSchema = new mongoose.Schema(
     {
        cusName: String,
        orderDay: {type: Date, default: Date.now},
        status: {type: String, enum: ORDER_STATUS_ENUM, default: ORDER_STATUS_ENUM.success},
        foods:  [],
        phoneNumber: String,
        roomNo: {type: mongoose.Schema.Types.ObjectId, ref: "rooms"},
        cartTotal: Number,
     },
     { collection: "orders" }
);

module.exports = mongoose.model("orders", ordersSchema);
