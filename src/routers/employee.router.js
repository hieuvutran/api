const utils = require('../utils');
const {tryCatch} = require('../utils');
const ValidationError = require('../utils').ValidationError;
const employeesSchema = require('../schemas/employee.schema');
const accountsSchema = require('../schemas/accounts.schema');
const mongo = require('../db');
const constant = require('../constant/constant');
const {employee, manager, admin} = require('../routers/authorization');
const bcrypt = require('bcrypt');
const multer = require('multer');
let cloudinary = require("cloudinary").v2;
let streamifier = require('streamifier');
cloudinary.config({ 
    cloud_name: 'dduqolszr', 
    api_key: '193768688454844', 
    api_secret: 'pyytoaC1d_p4egBEQy5TzRzi5y0',
    secure: true
});
module.exports = function(router){
    router.get('/employees', async (req, res, next) => {
        return await tryCatch(async () => {
            let query = req.query || {};
            const role = query.role;
            delete query.role;
            await mongo.open();
            if(req.headers.hotelid){
                query['hotelId'] = req.headers.hotelid || null;
            }
            let populate = {path: 'accId', select: '-password'};
            populate = role ? {...populate, match: {role}} : populate
            let list = await employeesSchema.find(query).populate(populate).lean();
            list = list.filter(e => !!e.accId);
            await mongo.close();
            return res.json({code: 200, data: list})
        }, next);
    });

    router.get('/employees/:id', async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const hotelId = req.headers.hotelid || null;
            const detail = await employeesSchema.findOne({_id:id, hotelId}).populate('accId', '-password').lean();
            await mongo.close();
            return res.json({code: 200, data: detail})
        }, next);
    });

    router.post('/employees', async (req, res, next) => {
        return await tryCatch(async () => {
            const body = req.body;
            if(!utils.isRequired(body, 'empName', 'identityCard')){
                throw new ValidationError("[payload] không hợp lệ", 400)
            }
            const payload = body
            let role = body.role || 'employee';
            await mongo.open();
            const passwordHashed = await bcrypt.hashSync(body.identityCard, constant.SALT);
            const account = new accountsSchema({username: body.username, password: passwordHashed, role});
            const accSaved = await account.save();
            const hotelId = req.headers.hotelid || null;
            const emp = new employeesSchema({...payload, accId: accSaved._id, hotelId});
            const empSaves = await emp.save();
            await mongo.close();
            return res.json({code: 200, data: empSaves})
        }, next);
    });

    router.put('/employees/:id', async (req, res, next) => {
        return await tryCatch(async () => {
            const body = req.body;
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            const payload = body
            await mongo.open();
            const empUpdated = await employeesSchema.findByIdAndUpdate(id, payload, {new: true});
            await mongo.close();
            return res.json({code: 200, data: empUpdated})
        }, next);
    });

    router.delete('/employees/:id', async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const emp = await employeesSchema.findById(id);
            if(!emp){
                throw new ValidationError("[id] không tồn tại", 404)
            }
            await emp.remove();
            await mongo.close();
            return res.json({code: 200, data: emp})
        }, next);
    });

    router.post('/employees/img/:id', async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const emp = await employeesSchema.findById(id);
            if(!emp){
                throw new ValidationError("[id] không tồn tại", 404)
            }
            let result = await handleUploadImage(req, res);
            let imageURL = result ? result.url : '';
            if(emp['image']){
                emp['image'].push(imageURL)
            }else{
                emp['image'] = [imageURL]
            }
            await emp.save();
            await mongo.close();
            return res.json({code: 200, data: result})
        }, next);
    });

    router.post('/employees/imgupdate/:id', async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const emp = await employeesSchema.findById(id);
            if(!emp){
                throw new ValidationError("[id] không tồn tại", 404)
            }
            let img = req.body.empImg
            if(emp['image']){
                emp['image'] = emp['image'].filter(e => e !== img)
            }
            await emp.save();
            await mongo.close();
            return res.json({code: 200, data: img})
        }, next);
    });
};



const handleUploadImage = (req, res) => {
    return new Promise(async (resolve, rej) => {
        const upload = multer({
            storage: multer.memoryStorage()
        }).single('image');
        upload(req, res, async (err) => {
            if(err) rej(err);
            const result = await uploadCloudinary(req.file.buffer);
            resolve(result);
        });
    })
}

let uploadCloudinary = async (buffer) => {
   return new Promise((resolve, reject) => {
     let cld_upload_stream = cloudinary.uploader.upload_stream(
      {
        folder: "images_cloud"
      },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
         }
       }
     );
     streamifier.createReadStream(buffer).pipe(cld_upload_stream);
   });
};
