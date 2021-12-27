const utils = require('../utils');
const {tryCatch} = require('../utils');
const ValidationError = require('../utils').ValidationError;
const workingTimesSchema = require('../schemas/workingTime.schema');
const employeeSchema = require('../schemas/employee.schema');
const mongo = require('../db');
const constant = require('../constant/constant');
const {employee, manager, admin} = require('../routers/authorization');
function round(num) {
    var m = Number((Math.abs(num) * 100).toPrecision(15));
    return Math.round(m) / 100 * Math.sign(num);
}

function sortASC( a, b ) {
    if ( a.createdAt < b.createdAt ){
      return -1;
    }
    if ( a.createdAt > b.createdAt ){
      return 1;
    }
    return 0;
}
module.exports = function(router){
    router.get('/working-today', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            let now = new Date();
            const workDay = now.toJSON().split('T')[0]
            await mongo.open();
            let query = req.query || {};
            query['workDay'] = workDay;
            if(req.headers.hotelid){
                query['hotelId'] = req.headers.hotelid || null;
            }
            const list = await workingTimesSchema.find(query).populate('empId').populate('hotelId').lean();
            await mongo.close();
            const workingArr = JSON.parse(JSON.stringify(list))
            let workingMap = workingArr.reduce((o, e) => {
                if(o[e.empId._id]){
                    o[e.empId._id].history.push(e);
                }else{
                    o[e.empId._id] = {empId: e.empId._id,history: [e], firstIn: -1, lastOut: -1, hours: -1, empName: e.empId.empName};
                }
                return o;
            }, {});
            let results = [];
            let workingMapKey = Object.keys(workingMap);
            for(let i =0; i < workingMapKey.length; i++){
                let empId = workingMapKey[i];
                let ele = workingMap[empId];
                if(!ele || !ele.history || ele.history.length < 1) continue;
                const history = ele.history;
                const historySorted = history.sort(sortASC);
                ele.firstIn = historySorted[0].createdAt || -1;
                if(historySorted.length > 1){
                    ele.lastOut = historySorted[historySorted.length - 1].createdAt
                    ele.hours = round(((new Date(ele.lastOut)).getTime() - (new Date(ele.firstIn)).getTime()) / 3600000)
                }
                results.push(ele)
            } 
            return res.json({code: 200, data: results})
        }, next);
    });
    router.get('/working-times', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            await mongo.open();
            let query = req.query || {};
           
        
            let list = await workingTimesSchema.find(query).populate('empId').populate('hotelId').lean();
            if (req.headers.hotelid) {
                list = list.filter(item => item.empId.hotelId == req.headers.hotelid)
            }
            await mongo.close();
            return res.json({code: 200, data: list})
        }, next);
    });
    
    router.get('/working-times/month', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            await mongo.open();
            let query = {};

            let Month = req.query.workMonth
      
           
            const listWorkingTimes = await workingTimesSchema.find({"workDay": {"$regex": Month}}).populate('empId').lean();
            let listEmpl = await employeeSchema.find({hotelId: req.headers.hotelid}).populate('hotelId').lean();
            const result = listWorkingTimes.filter(WorkingTime => WorkingTime.empId != null)
            const workTime = listEmpl.map(emp=>{
                let properties = {
                    "empName": emp.empName,
                  }
               
                let time = 0
                for(let x = 0; x <result.length; x++){
                    
                   
                    if(listWorkingTimes[x].empId && emp._id.toString() == result[x].empId._id.toString() ){
                        time += listWorkingTimes[x].workTime
                    }
                   
                }
                properties['workTime'] = time;  
                return properties;

            })
            await mongo.close();
            return res.json({code: 200, data: workTime})
        }, next);
    });

    router.get('/working-times/history', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            let query = req.query || {};
            if(req.headers.hotelid){
                query['hotelId'] = req.headers.hotelid || null;
            }
            await mongo.open();
            const data = await workingTimesSchema.find(query).populate('empId').populate('hotelId').lean();
            await mongo.close();
            return res.json({code: 200, data: data})
        }, next);
    });

    router.get('/working-times/:id', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] is invalid", 400)
            }
            await mongo.open();
            const detail = await workingTimesSchema.findById(id).populate('empId').populate('hotelId').lean();
            await mongo.close();
            return res.json({code: 200, data: detail})
        }, next);
    });

    router.post('/working-times/check-in',employee, async (req, res, next) => {
        return await tryCatch(async () => {
            const user = req.user;
            if(!user.id){
                throw new ValidationError('[id] not found', 400);
            }
            let now = new Date();

            // const isExist = await employeeSchema.findById(user.id).lean();
            // if(!isExist){
            //     throw new ValidationError('[empId] not found', 400);
            // }
            const payload = {
                empId: String(user.emp),
                workDay: now.toJSON().split('T')[0],
                // checkIn: now.valueOf(),
                // checkOut: null,
            }
            
            await mongo.open();
            const workingTime = new workingTimesSchema(payload);
            const workingTimeSaves = await workingTime.save();
            await mongo.close();
            return res.json({code: 200, data: workingTimeSaves})
        }, next);
    });

    router.put('/working-times/check-out',employee, async (req, res, next) => {
        return await tryCatch(async () => {
            const user = req.user;
            if(!user.id){
                throw new ValidationError('[id] not found', 400);
            }
            let now = new Date();
            const query = {
                empId: String(user.emp),
                workDay: now.toJSON().split('T')[0]
            }
            await mongo.open();
            const workingTime = await workingTimesSchema.find(query).lean();
            if(workingTime.length <= 0){
                throw new ValidationError("User not check-in tody", 400);
            }
            const payload = {
                ...workingTime,
                checkOut: now.valueOf()
            }
            const updated = await workingTimesSchema.findByIdAndUpdate(workingTime[0]._id, payload, {new: true});
            await mongo.close();
            return res.json({code: 200, data: updated})
        }, next);
    });

    router.post('/employee/face-detect', async (req, res, next) => {
        return await tryCatch(async () => {
            const empId = req.body.empId;
            if(!empId){
                throw new ValidationError('[empId] not found', 400);
            }
            let now = new Date();
            let hotelId = req.headers.hotelid || null;
            if(!hotelId && req.body.hotelId){
                hotelId = req.body.hotelId
            }
            const isExist = await employeeSchema.findById(empId).lean();
            if(!isExist){
                throw new ValidationError('[empId] not found', 400);
            }
            const query = {
                empId: String(empId),
                workDay: now.toJSON().split('T')[0]
            }
            await mongo.open();
            let isExistWorkingTime = await workingTimesSchema.find(query).lean()
            if (isExistWorkingTime.length > 0){
                let workTime = await round(((new Date(now)).getTime() - (new Date(isExistWorkingTime[0].checkIn[0])).getTime()) / 3600000)
                const payload = {
                    ...isExistWorkingTime[0],
                    checkOut: isExistWorkingTime[0].checkIn.push(now.valueOf()),
                    workTime: workTime,
                }
                await workingTimesSchema.findByIdAndUpdate(isExistWorkingTime[0]._id, payload, {new: true});
                await mongo.close();
            }
            else{
                const payload = {
                    empId: empId,
                    workDay: now.toJSON().split('T')[0],
                    checkIn: [now.valueOf()],
                    // checkOut: null,
                    hotelId
                }
                const workingTime = new workingTimesSchema(payload);
                const workingTimeSaves = await workingTime.save();
                await mongo.close();
                return res.json({code: 200, data: workingTimeSaves})
            }
            
        }, next);
    });
};