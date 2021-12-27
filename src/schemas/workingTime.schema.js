const mongoose = require("mongoose");

const workingTimesSchema = new mongoose.Schema(
     {
        empId: {type: mongoose.Schema.Types.ObjectId, ref: "employees"},
        workDay: {type:String, text: true},
        checkIn: [
          {type: Date}
        ],
        workTime: {type: Number, default: 0},
        createdAt: {type: Date, default: Date.now},
     },
     { collection: "workingTimes" }
);

module.exports = mongoose.model("workingTimes", workingTimesSchema);
