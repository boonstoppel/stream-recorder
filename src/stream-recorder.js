const icecast = require('icy')
const path = require('path')
const fs = require('fs')
const axios = require('axios')

// This is the location where the stream gets recorded to 
// before its uploaded to somewhere else.
const baseFolder = 'recordings'

const zeroPadNum = n => n.toString().padStart(2, '0')

// The stream writing the recording.
var outStream

// The incoming stream to icecast.
var inStream

var recordingTimeIsUp = false

var checkDataFlowInterval


const startRecording = (config) => {
    const folder = path.join(process.cwd(), baseFolder)
    
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder)
    }

    const fileName = getFileNameFromDate()
    const filePath = getFilePathFromName(fileName)

    if (!config.append && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
    }
    
    recordStream({ 
        config, 
        fileName
    })

    return filePath
}

const checkStreamStatus = (data) => {
    axios
        .get(data.config.streamUrl, {
            responseType: 'stream'
        })
        .then(response => {
            if (response.data.statusCode == 200 && !recordingTimeIsUp) {
                console.log('Re-starting recorder!')
                data.config.append = true;
                icecast.get(data.config.streamUrl, (icecastStream) => {
                    inStream = icecastStream
                    startRecording(data.config)
                })
            }
        })
        .catch(error => {
            if (error.response.status == 404) {
                console.error('Server is down...')
                if (!recordingTimeIsUp) {
                    setTimeout(checkStreamStatus.bind(null, data), 1000)
                }
            }
        })
}

const recordStream = (data) => {
    const filePath = getFilePathFromName(data.fileName)
    outStream = fs.createWriteStream(filePath, {flags: 'a'})

    inStream.on('data', (streamData) => {
        outStream.write(streamData)

        clearTimeout(checkDataFlowInterval)
        checkDataFlowInterval = setTimeout(() => {
            endStreams()
            console.error(`Recording ${data.fileName} interrupted`)

            // After 1 sec. of receiving no data, start checking if 
            // streaming server is up and running.
            checkStreamStatus(data)
        }, 1000)
    })

    console.log(`Recording ${data.fileName}`)
}

// On this machine the recordings are stored as:
// rec-year-month-day-hour.mp3 eg. rec_20200105-03.mp3
const getFileNameFromDate = () => {
    let date = new Date()

    let time = [
        date.getFullYear(), 
        zeroPadNum(date.getMonth() + 1),
        zeroPadNum(date.getDate()),
    ].join('')

    const hours = zeroPadNum(date.getHours())

    return `rec_${time}-${hours}.mp3`
}

const getFilePathFromName = (fileName) => {
    return path.join(path.join(process.cwd(), baseFolder), fileName)
}

const finishRecording = (fileName, callback) => {
    clearTimeout(checkDataFlowInterval)
    endStreams()
    recordingTimeIsUp = true
    callback(fileName)
}

const endStreams = () => {
    if (inStream && typeof inStream.end !== 'undefined') {
        inStream.end()
        inStream = null
    }

    if (outStream && typeof outStream.end !== 'undefined') {
        outStream.end()
        outStream = null
    }
}

module.exports = {
    record: (config, callback) => {
        icecast.get(config.streamUrl, (icecastStream) => {
            inStream = icecastStream

            setTimeout(finishRecording.bind(
                null, startRecording(config), callback), config.durationInSeconds * 1000)
        })
    }
}