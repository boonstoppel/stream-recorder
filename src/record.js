// load env vars from .env
require('dotenv').config();

const streamRecorder = require('./stream-recorder')
const s3 = require('./s3')
const fs = require('fs')

// The root s3 bucket to store the 
// recordings in
const s3Bucket = process.env.S3_BUCKET;

// The icecast radio stream
const streamUrl = 'http://listen.freeformportland.org:8000/stream'

// Duration of the recording
const durationInSeconds = 7200; // two hours


// Record the audo stream and upload it to AWS S3.
streamRecorder.record({
    streamUrl,
    durationInSeconds
}, (recordings) => {
    for (var i = 0; i < recordings.length; i++) {
        s3.upload({
            filePath: recordings[i],
            key: getS3KeyFilePath(recordings[i]),
            bucket: s3Bucket
        }, (location) => {
            console.log('Recording uploaded to:')
            console.log(location)
            fs.unlinkSync(recordings[i])
        })
    }

    process.exit()
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
// https://freeform-radio-org.s3-us-west-2.amazonaws.com/2020/01/05/rec_20200105-03.mp3
const getS3KeyFilePath = (filePath) => {
    const fileData = filePath.split('/')
    const fileName = fileData[fileData.length - 1]
    const data = fileName.split('_')[1].split('-')[0];
    const year = data.slice(0, 4);
    const month = data.slice(4, 6);
    const date = data.slice(6, 8);

    return `${year}/${month}/${date}/${fileName}`;
}


// Exit this program with ctrl c
process.on('SIGINT', () => {
    process.exit()
})
