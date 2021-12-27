const utils = require('../utils');
const {tryCatch} = require('../utils');
const ValidationError = require('../utils').ValidationError;
const ordersSchema = require('../schemas/orders.schema');
const roomsSchema = require('../schemas/rooms.schema');
const bookingSchema = require('../schemas/booking.schema')
const checkInSchema = require('../schemas/checkIn.schema')
const mongo = require('../db');
const {employee, manager, admin} = require('../routers/authorization');

module.exports = function(router){
    router.get('/orders', async (req, res, next) => {
        return await tryCatch(async () => {
            let query = req.query || {};
            await mongo.open();
            let orderDay = query.orderDay || '';
            delete query.orderDay;
            let list = await ordersSchema.find().populate('roomNo').lean();
            
            if(list.length > 0 && orderDay){
                list = list.filter(ord => {
                    return (new Date(ord.orderDay)).toJSON().includes(orderDay);
                })
            }
            if (req.headers.hotelid) {
                list = list.filter(item => item.roomNo.hotelId == req.headers.hotelid)
            }
            await mongo.close();
            return res.json({code: 200, data: list})
        }, next);
    });

    router.get('/orders/:id', async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const hotelId = req.headers.hotelid || null;
            const detail = await ordersSchema.findOne({_id:id, hotelId }).lean();
            await mongo.close();
            return res.json({code: 200, data: detail})
        }, next);
    });

    router.post('/orders', async (req, res, next) => {
        return await tryCatch(async () => {

            const body = req.body.data;
            if(!utils.isRequired(body, 'roomNo', 'foods')){
                throw new ValidationError("[payload] không hợp lệ", 400)
            }
            const payload = body
            await mongo.open();
            const hotelId = (req.headers.hotelid || null);

            // const roomNo = body.roomNo;
            // const room = await roomsSchema.findOne({roomNo}).lean();
            // if(!room){
            //     throw new ValidationError("roomNo không tồn tại", 400)
            // }
            const active = await checkInSchema.findOne({booking: payload.bookingId});
            if(active.active)
            {
            const instance = new ordersSchema({hotelId, ...payload});
            const saved = await instance.save();
            const booking = await bookingSchema.findById(payload.bookingId);
            booking['order'].push(instance._id);
            booking.save();
            await mongo.close();
            return res.json({code: 200, data: saved})
            }
            else {
                res.json({code: 500, data: 'Không thành công'})
            }
        }, next);
    });


    router.put('/orders/:id', async (req, res, next) => {
        return await tryCatch(async () => {
            const body = req.body;
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            const payload = body
            await mongo.open();
            const updated = await ordersSchema.findByIdAndUpdate(id, payload, {new: true});
            await mongo.close();
            return res.json({code: 200, data: updated})
        }, next);
    });

    router.delete('/orders/:id', async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const deleted = await ordersSchema.findById(id);
            if(!deleted){
                throw new ValidationError("[id] không hợp lệ", 404)
            }
            await deleted.remove();
            await mongo.close();
            return res.json({code: 200, data: deleted})
        }, next);
    });
};