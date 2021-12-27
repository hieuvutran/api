const { tryCatch } = require('../utils');
const mongo = require('../db');
const { employee, manager, admin } = require('./authorization');
const employeesSchema = require('../schemas/employee.schema');
const bookingSchema = require('../schemas/booking.schema');
const ordersSchema = require('../schemas/orders.schema');
const checkInSchema = require('../schemas/checkIn.schema');

module.exports = function (router) {
    router.get('/dashboard', async (req, res, next) => {
        return await tryCatch(async () => {
            const beginOfDay = new Date();
            beginOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            let q = req.query || {};
            await mongo.open();
            if (req.headers.hotelid) {
                q['hotelId'] = req.headers.hotelid || null;
            }
            let listEmp = await employeesSchema.find(q).lean();


            let queryDay = {};
            queryDay['createAt'] = {
                "$gte": beginOfDay,
                "$lt": endOfDay
            }
            let orderDay = {};
            orderDay['orderDay'] = {
                "$gte": beginOfDay,
                "$lt": endOfDay
            }

            let listBooking = await bookingSchema.find(queryDay).populate('cusId').populate({
                path: 'roomId',
                populate: [{
                    path: 'roomTypeId'
                }]
            }).lean();
            let listOrder = await ordersSchema.find(orderDay).populate('roomNo').lean();

            let listCheckin = await checkInSchema.find(queryDay).populate('cusId').populate('roomId').lean();
            const today = new Date()
            const beginDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() -7 )
            let CheckInLastWeek = {};
            CheckInLastWeek['createAt'] = {
                "$gte": beginDay,
                "$lt":  endOfDay

            }
            let lastSevenDayCheckIn = await bookingSchema.find(CheckInLastWeek).populate('cusId').populate({
                path: 'roomId',
                populate: [{
                    path: 'roomTypeId'
                }]
            }).lean();

            if (req.headers.hotelid) {
                listBooking = listBooking.filter(item => item.roomId.hotelId == req.headers.hotelid)
                listOrder = listOrder.filter(item => item.roomNo.hotelId == req.headers.hotelid)
                lastSevenDayCheckIn = lastSevenDayCheckIn.filter(item => item.roomId.hotelId == req.headers.hotelid)
                listCheckin = listCheckin.filter(item => item.roomId.hotelId == req.headers.hotelid)
            }
            await mongo.close();
            return res.json({ code: 200, data: { listCheckin, listEmp, listBooking, listOrder, lastSevenDayCheckIn } });
        }, next);
    });
}