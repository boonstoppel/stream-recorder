const streamRecorder = require('./stream-recorder')
const s3 = require('./s3')
const fs = require('fs')

// The root s3 bucket to store the 
// recordings in
const s3Bucket = 'freeform-radio-org'

// The icecast radio stream
const streamUrl = 'http://listen.freeformportland.org:8000/stream'

// Duration of the recording
const durationInSeconds = 10


// Record the audo stream and upload it to AWS S3.
streamRecorder.record({
    streamUrl,
    durationInSeconds
}, (filePath) => {
    s3.upload({
        filePath: filePath,
        key: getS3KeyFilePath(filePath),
        bucket: s3Bucket
    }, (location) => {
        console.log('Recording uploaded to:')
        console.log(location)

        fs.unlinkSync(filePath)
        process.exit()
    })
})


// Return the s3 path from the filename.
//
// On this machine the recordings are stored as:
// rec-year-month-day-hour.mp3 eg. rec-2020-10-17-3.mp3
// 
// On AWS S3 however, the recordings are stored as:
// s3Bucket/year/month/day/rec-2020-10-17-3.mp3
//
// for example:
// https://freeform-radio-org.s3-us-west-2.amazonaws.com/2020/10/17/rec-2020-10-17-3.mp3
const getS3KeyFilePath = (filePath) => {
    const fileData = filePath.split('/')
    const fileName = fileData[fileData.length - 1]
    const data = fileName.split('-')

    return `${data[1]}/${data[2]}/${data[3]}/${fileName}`
}


// Exit this program with ctrl c
process.on('SIGINT', function() {
    process.exit()
})
