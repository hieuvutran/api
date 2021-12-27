const utils = require('../utils');
const {tryCatch} = require('../utils');
const ValidationError = require('../utils').ValidationError;
const roomTypesSchema = require('../schemas/roomTypes.schema');
const mongo = require('../db');
const constant = require('../constant/constant');
const {employee, manager, admin} = require('../routers/authorization');

module.exports = function(router){
    router.get('/room-types', async (req, res, next) => {
        return await tryCatch(async () => {
            let query = req.query || {};
            await mongo.open();
            const list = await roomTypesSchema.find(query).lean();
            await mongo.close();
            return res.json({code: 200, data: list})
        }, next);
    });

    router.get('/room-types/:id', async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const type = await roomTypesSchema.findById(id).lean();
            await mongo.close();
            return res.json({code: 200, data: type})
        }, next);
    });

    router.post('/room-types', async (req, res, next) => {
        return await tryCatch(async () => {
            const body = req.body;
            if(!utils.isRequired(body, 'typeName')){
                throw new ValidationError("[payload] không hợp lệ", 400)
            }
            const payload = body
            await mongo.open();
            const type = new roomTypesSchema(payload);
            const typeSaves = await type.save();
            await mongo.close();
            return res.json({code: 200, data: typeSaves})
        }, next);
    });

    router.put('/room-types/:id', async (req, res, next) => {
        return await tryCatch(async () => {
            const body = req.body;
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            const payload = body
            await mongo.open();
            const typeUpdated = await roomTypesSchema.findByIdAndUpdate(id, payload, {new: true});
            await mongo.close();
            return res.json({code: 200, data: typeUpdated})
        }, next);
    });

    router.delete('/room-types/:id', async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const type = await roomTypesSchema.findById(id);
            if(!type){
                throw new ValidationError("[id] không hợp lệ", 404)
            }
            await type.remove();
            await mongo.close();
            return res.json({code: 200, data: type})
        }, next);
    });
};