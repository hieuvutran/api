const utils = require('../utils');
const {tryCatch} = require('../utils');
const ValidationError = require('../utils').ValidationError;
const roomsSchema = require('../schemas/rooms.schema');
const mongo = require('../db');
const constant = require('../constant/constant');
const {employee, manager, admin} = require('../routers/authorization');
const checkInSchema = require('../schemas/checkIn.schema');

module.exports = function(router){
    router.get('/rooms', async (req, res, next) => {
        return await tryCatch(async () => {
            const beginOfDay = new Date();
            beginOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            let query = req.query || {};
            await mongo.open();
            if(!query.hotelId && req.headers.hotelid){
                query['hotelId'] = req.headers.hotelid || null;
            }
            let list = await roomsSchema.find(query).populate('hotelId').populate('roomTypeId').populate({path: 'furnitures', populate: [{
                path: 'furnitureTypeId'
            }]}).lean();

            let queryDay = {};
            queryDay['createAt'] = {
                "$gte": beginOfDay,
                "$lt": endOfDay
            }
            await mongo.open();
            let listCheckin = await checkInSchema.find(queryDay).populate('cusId').populate('roomId').lean();
            if (req.headers.hotelid) {
                listCheckin = listCheckin.filter(item => item.roomId.hotelId == req.headers.hotelid)
            }
            let rooms =  list.map(item=> {
                for(x = 0; x < listCheckin.length; x++){
                    if(listCheckin[x].roomId._id.toString() == item._id.toString() ){
                        item['status'] = true;
                        break;
                    }
                }
                return item
            })

            await mongo.close();
            return res.json({code: 200, data: rooms})
        }, next);
    });

    router.get('/rooms/:id', async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const room = await roomsSchema.findById(id).populate('hotelId').populate('roomTypeId').populate({path: 'furnitures', populate: [{
                path: 'furnitureTypeId'
            }]}).lean();
            await mongo.close();
            return res.json({code: 200, data: room})
        }, next);
    });

    router.post('/rooms', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const body = req.body;
            if(!utils.isRequired(body, 'roomName', 'hotelId', 'roomTypeId', 'roomNo', 'unitPrice')){
                throw new ValidationError("[payload] không hợp lệ", 400)
            }
            const payload = body
            await mongo.open();
            const room = new roomsSchema(payload);
            const roomSaves = await room.save();
            await mongo.close();
            return res.json({code: 200, data: roomSaves})
        }, next);
    });

    router.put('/rooms/:id', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const body = req.body;
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            const room = await roomsSchema.findById(id).lean();
            if(!room){
                throw new ValidationError("[room] không hợp lệ", 404)
            }
            let payload = JSON.parse(JSON.stringify(room))
             payload = {...payload, ...body}
            await mongo.open();
            const roomUpdated = await roomsSchema.findByIdAndUpdate(id, payload, {new: true});
            await mongo.close();
            return res.json({code: 200, data: roomUpdated})
        }, next);
    });

    router.delete('/rooms/:id', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const room = await roomsSchema.findById(id);
            if(!room){
                throw new ValidationError("[id] không hợp lệ", 404)
            }
            await room.remove();
            await mongo.close();
            return res.json({code: 200, data: room})
        }, next);
    });

    router.delete('/rooms/:id/furniture/:furId', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const room = await roomsSchema.findById(id);
            if(!room){
                throw new ValidationError("[id] không hợp lệ", 404)
            }
            let payload = JSON.parse(JSON.stringify(room))
            let furnitures = room.furnitures || [];
            furnitures = furnitures.filter(e => String(e) != req.params.furId)
            const roomUpdated = await roomsSchema.findByIdAndUpdate(id, {...payload, furnitures}, {new: true});
            await mongo.close();
            return res.json({code: 200, data: roomUpdated})
        }, next);
    });

    router.put('/rooms/:id/furniture/:furId', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const room = await roomsSchema.findById(id);
            if(!room){
                throw new ValidationError("[id] không hợp lệ", 404)
            }
            let payload = JSON.parse(JSON.stringify(room))
            let furnitures = room.furnitures || [];
            furnitures.push(req.params.furId)
            const roomUpdated = await roomsSchema.findByIdAndUpdate(id, {...payload, furnitures}, {new: true});
            await mongo.close();
            return res.json({code: 200, data: roomUpdated})
        }, next);
    });
};