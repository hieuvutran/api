const mongoose = require("mongoose");

const employeesSchema = new mongoose.Schema(
     {
          empName: String,
          dob: Date,
          address: String,
          phoneNumber: String,
          baseSalary: Number,
          typeOfLabor: String,
          identityCard: {type: String},
          accId: {type: mongoose.Schema.Types.ObjectId, ref: "accounts"},
          image: [{type: String, default: ""}],
          hotelId: {type: mongoose.Schema.Types.ObjectId, ref: "hotels"},
     },
     { collection: "employees" }
);
employeesSchema.index({ identityCard: 1 }, { unique: true })
module.exports = mongoose.model("employees", employeesSchema);
