const utils = require('../utils');
const {tryCatch} = require('../utils');
const ValidationError = require('../utils').ValidationError;
const warehouseSchema = require('../schemas/warehouse.schema');
const mongo = require('../db');
const constant = require('../constant/constant');
const {employee, manager, admin} = require('../routers/authorization');

module.exports = function(router){
    router.get('/warehouse', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            let query = req.query || {};
            await mongo.open();
            let list = await warehouseSchema.find(query).lean();
            if (req.headers.hotelid) {
                list = list.filter(item => item.hotelId == req.headers.hotelid)
            }
            await mongo.close();
            list = await list.map(async e => {
                if(e.qrCode) return e;
                let qr_code = await utils.generateQRCode({id: e._id});
                return {...e, qrCode: qr_code}
            })
            data = await Promise.all(list);
            return res.json({code: 200, data})
        }, next);
    });

    router.get('/warehouse/:id', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const hotelId = req.headers.hotelid || null;
            let type = await warehouseSchema.findOne({_id:id }).populate('hotelId').lean();
            await mongo.close();
            if(type){
                return res.json({code: 200, data: type})
            }
            let qr_code = await utils.generateQRCode({id: type._id});
            return res.json({code: 200, data: {...type, qrCode: qr_code}})
        }, next);
    });

    router.post('/warehouse', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const hotelId = req.headers.hotelid || null;
            const body = req.body;
            body.hotelId = hotelId;
            if(!utils.isRequired(body, 'name')){
                throw new ValidationError("[payload] không hợp lệ", 400)
            }
            const payload = body
            payload.stockReceivingAt = new Date()
            await mongo.open();
            const instance = new warehouseSchema({...payload});
            const saved = await instance.save();
            await mongo.close();
            let qr_code = await utils.generateQRCode({furId: saved._id});
            let data = saved;
            data.qrCode = qr_code;
            await warehouseSchema.findByIdAndUpdate(saved._id, {...saved, qrCode: qr_code})
            return res.json({code: 200, data})
        }, next);
    });

    router.put('/warehouse/:id', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const body = req.body;
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            let payload = body ;
            await mongo.open();
            let detail = await warehouseSchema.findById(id).lean();
            let detailJSON = JSON.parse(JSON.stringify(detail));
            let updated;
            const date = new Date();
            if(body.isImport){
                payload['stockReceivingAt'] = date;
            }
            if(body.isExport){
                payload['stockDeliveringAt'] = date;
            }

            updated = await warehouseSchema.findByIdAndUpdate(id, {...detailJSON,...payload, }, {new: true});
            await mongo.close();
            let updatedJSON = JSON.parse(JSON.stringify(updated));
            if(updatedJSON.qrCode){
                return res.json({code: 200, data: updatedJSON})
            }
            let qr_code = await utils.generateQRCode({id: updatedJSON._id});
            return res.json({code: 200, data: {...updatedJSON, qrCode: qr_code}})
        }, next);
    });

    router.delete('/warehouse/:id', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const result = await warehouseSchema.findById(id);
            if(!result){
                throw new ValidationError("[id] không hợp lệ", 404)
            }
            await result.remove();
            await mongo.close();
            return res.json({code: 200, data: result})
        }, next);
    });
};