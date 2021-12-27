const express = require("express");
const router = express.Router();
require('./accounts.router')(router)
require('./workingTimes.router')(router)
require('./employee.router')(router)
require('./auth.router')(router)
require('./booking.router')(router)
require('./customers.router')(router)
require('./dashboard.router')(router)

require('./foods.router')(router)
require('./hotels.router')(router)
require('./orders.router')(router)
require('./room.router')(router)
require('./roomType.router')(router)
require('./furnitureTypes.router')(router)
require('./furniture.router')(router)
require('./exim.router')(router)
require('./warehouse.router')(router)

module.exports = router;
const { tryCatch } = require("../utils");
const utils = require('../utils');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
router.post('/qr-code', async (req,res) => {
    let data = await utils.generateQRCode(req.body);
    return res.json({code: 200, data})
})

router.post('/detect-image', async (req, res, next) => {
    return await tryCatch(async () => {
        var upload = multer({
            storage: multer.memoryStorage()
        }).single('image')
        await upload(req, res, async function(err) {
            const file = req.file;
            const buffer = file.buffer
            const url = process.env.FPT_API_URL || '';
            const formData = new FormData();
            formData.append('image',buffer, 'image');
            const config = {
                headers: {
                    'content-type': 'multipart/form-data',
                    'api-key': process.env.FPT_AI_KEY || '',
                    ...formData.getHeaders()
                }
            }
            //TODO: If want to test, uncomment.
            // let result = await axios.post(url,formData,config).catch(e => {
            //     console.log('Failed call API FPT AI >>> ', e)
            //     return e;
            // });

            //* Mockup data
            const fakeData = {
                "errorCode": 0,
                "errorMessage": "",
                "data": [
                    {
                        "id": "281300735",
                        "id_prob": "98.15",
                        "name": "LÊ VẠN BẢO TRỌNG",
                        "name_prob": "99.93",
                        "dob": "24/12/2002",
                        "dob_prob": "98.40",
                        "sex": "N/A",
                        "sex_prob": "N/A",
                        "nationality": "N/A",
                        "nationality_prob": "N/A",
                        "home": "THỪA THIÊN HUẾ",
                        "home_prob": "98.21",
                        "address": "PHÚ CƯỜNG, TP THỦ DẦU MỘT, BÌNH DƯƠNG",
                        "address_prob": "97.92",
                        "type_new": "cmnd_09_front",
                        "address_entities": {
                            "province": "BÌNH DƯƠNG",
                            "district": "THỦ DẦU MỘT",
                            "ward": "PHÚ CƯỜNG",
                            "street": ""
                        },
                        "doe": "N/A",
                        "doe_prob": "N/A",
                        "overall_score": "98.88",
                        "type": "old"
                    }
                ]
            }
            let result = {data: fakeData};
            if(result && result.data.errorCode == 0){
                const data = result.data.data;
                return res.json({code: 200, data: data})
            }
            return res.json({code: 500, message: "Lỗi, vui lòng thử lại"})
        })
    }, next)
})