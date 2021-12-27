const utils = require('../utils');
const {tryCatch} = require('../utils');
const ValidationError = require('../utils').ValidationError;
const furTypesSchema = require('../schemas/furnitureTypes.schema');
const mongo = require('../db');
const constant = require('../constant/constant');
const {employee, manager, admin} = require('../routers/authorization');

module.exports = function(router){
    router.get('/furniture-types', async (req, res, next) => {
        return await tryCatch(async () => {
            let query = req.query || {};
            await mongo.open();
            const list = await furTypesSchema.find(query).lean();
            await mongo.close();
            return res.json({code: 200, data: list})
        }, next);
    });

    router.get('/furniture-types/:id', async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const type = await furTypesSchema.findById(id).lean();
            await mongo.close();
            return res.json({code: 200, data: type})
        }, next);
    });

    router.post('/furniture-types', async (req, res, next) => {
        return await tryCatch(async () => {
            const body = req.body;
            if(!utils.isRequired(body, 'furTypeName')){
                throw new ValidationError("[payload] không hợp lệ", 400)
            }
            const payload = body
            await mongo.open();
            const instance = new furTypesSchema(payload);
            const saved = await instance.save();
            await mongo.close();
            return res.json({code: 200, data: saved})
        }, next);
    });

    router.put('/furniture-types/:id', async (req, res, next) => {
        return await tryCatch(async () => {
            const body = req.body;
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            const payload = body
            await mongo.open();
            const updated = await furTypesSchema.findByIdAndUpdate(id, payload, {new: true});
            await mongo.close();
            return res.json({code: 200, data: updated})
        }, next);
    });

    router.delete('/furniture-types/:id', async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const result = await furTypesSchema.findById(id);
            if(!result){
                throw new ValidationError("[id] không hợp lệ", 404)
            }
            await result.remove();
            await mongo.close();
            return res.json({code: 200, data: result})
        }, next);
    });
};