const video = document.getElementById("video")
function startVideo() {
    navigator.getUserMedia(
        { video: {} },
        stream => (video.srcObject = stream),
        err => console.error(err)
    )
}

const loadLabels = async () => {
    // Chỗ này gọi api dùng đổi train trả về id, tên nhân viên, danh sách link ảnh 
    //{
        // name: "Cap"
        // picture: ["https://res.cloudinary.com/fpt123/image/upload/v1632796571/d5_khyjueaavq7h_1_cdvy4i.jpg",…]
        // 0: "https://res.cloudinary.com/fpt123/image/upload/v1632796571/d5_khyjueaavq7h_1_cdvy4i.jpg"
        // 1: "https://res.cloudinary.com/fpt123/image/upload/v1632796571/d5_khyjueaavq7h_1_cdvy4i.jpg"
        // updatedAt: "2021-09-05T08:04:14.474Z"
        // __v: 0
        // _id: "613479fe1627d0445898f215"
    //}
    const response = await axios('http://localhost:8080/api/tutorials/');
    let emmployee = response.data.filter(function(e) {
        return e.picture.length > 1;
    });
    const labels = emmployee.map(function (data) {
        return data.name })
    return Promise.all(emmployee.map(async label => {
        const descriptions = []
        for (let i = 0; i < label.picture.length; i++) {
        const img1 = await faceapi.fetchImage(label.picture[i])

        const detections = await faceapi
            .detectSingleFace(img1)
            .withFaceLandmarks()
            .withFaceDescriptor()
        descriptions.push(detections.descriptor)
        return new faceapi.LabeledFaceDescriptors(label._id, descriptions)
        }
    }))
}

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models'),
    faceapi.nets.ageGenderNet.loadFromUri('/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
]).then(startVideo)


video.addEventListener('play', async () => {
    const canvas = faceapi.createCanvasFromMedia(video)
    const canvasSize = {
        width: video.width,
        height: video.height
    }
    const labels = await loadLabels()
    faceapi.matchDimensions(canvas, canvasSize)
    let last_checkin
    document.body.appendChild(canvas)
    setInterval(async () => {
        const response = await axios('http://localhost:8080/api/tutorials/');
        const detections = await faceapi
            .detectAllFaces(
                video,
                new faceapi.TinyFaceDetectorOptions()
            )
            .withFaceLandmarks()
            .withFaceExpressions()
            .withAgeAndGender()
            .withFaceDescriptors()
        const resizedDetections = faceapi.resizeResults(detections, canvasSize)
        const faceMatcher = new faceapi.FaceMatcher(labels, 0.6)
        const results = resizedDetections.map(d =>
            faceMatcher.findBestMatch(d.descriptor)
        )
        results.forEach((result, index) => {
            const { label } = result
            if(label !== "unknown")
            {
                // Hàm này để map id vào tên của nhân viên hiển thị trên màn hình điểm danh
                let emmployee = response.data.filter(function(e) {
                    return e._id == label;
                });
                document.getElementById("name").innerHTML = emmployee[0].name;
               //Gọi api để điểm danh cần id nhân viên lúc này chính là lable, time điểm danh
                const post =  axios('http://localhost:8080/api/tutorials/');
                    
            }
        })


    }, 5000)
})
