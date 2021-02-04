const icecast = require('icy')
const path = require('path')
const fs = require('fs')
const axios = require('axios')

// This is the location where the stream gets recorded to 
// before its uploaded to somewhere else.
const baseFolder = 'recordings'

const zeroPadNum = n => n.toString().padStart(2, '0')

// The outstream to write the different mp3 files.
var outStream

var allRecordings = []

var recordingTimeIsUp = false


const startRecording = (icecastStream, config) => {
    let folder = path.join(process.cwd(), baseFolder)
    
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder)
    }

    const fileName = config.fileName ? config.fileName : getFileNameFromDate()

    let filePath = getFilePathFromName(fileName)

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
    }
    
    recordStream({
        icecastStream, 
        config, 
        fileName
    })
}

const checkStreamStatus = (data) => {
    axios
        .get(data.config.streamUrl, {
            responseType: 'stream'
        })
        .then(response => {
            if (response.data.statusCode == 200 && !recordingTimeIsUp) {
                console.log('Re-starting recorder!')
                // Re-start recorder with different file name.
                data.config.fileName = getChunkedFileName(data.fileName)
                
                icecast.get(data.config.streamUrl, (icecastStream) => {
                    startRecording(icecastStream, data.config)
                })
            }
        })
        .catch(error => {
            if (axios.isCancel(error)) {
                console.log('Request canceled', error.message)
            }

            if (error.response.status == 404) {
                console.error('Server is down...')
                if (!recordingTimeIsUp) {
                    setTimeout(checkStreamStatus.bind(null, data), 1000)
                }
            }
        })
}


const getChunkedFileName = (fileName) => {
    return fileName.indexOf('_part_') == -1 ? 
        fileName.replace('.mp3', '_part_2.mp3') :
        fileName.replace( /_part_(\d+)\.mp3/g, (data, num) => {
            return '_part_' + (parseInt(num) + 1) + '\.mp3'
        })
}


const recordStream = (data) => {
    allRecordings.push(data.fileName)

    outStream = fs.createWriteStream(
        getFilePathFromName(data.fileName), { flags: 'w' })

    let checkDataFlowInterval

    console.log(`Recording ${data.fileName}`)

    data.icecastStream.on('data', (streamData) => {
        outStream.write(streamData)

        clearTimeout(checkDataFlowInterval)
        checkDataFlowInterval = setTimeout(() => {
            // After 1 sec. of receiving no data, start checking if 
            // streaming server is up and running.
            checkStreamStatus(data)
            outStream.close()
            console.error(`Recording ${data.fileName} interrupted`)
        }, 1000)
    })
}

const finishRecording = (callback) => {
    recordingTimeIsUp = true
    outStream.close()
    callback(allRecordings)
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

module.exports = {
    record: (config, callback) => {
        icecast.get(config.streamUrl, (icecastStream) => {
            startRecording(icecastStream, config)

            setTimeout(finishRecording.bind(
                null, callback), config.durationInSeconds * 1000)
        })
    }
}