const icecast = require('icy')
const path = require('path')
const fs = require('fs')
const Confirm = require('prompt-confirm')
const cliProgress = require('cli-progress')
const request = require('request')

// This is the location where the stream gets recorded to 
// before its uploaded to somewhere else.
const baseFolder = 'recordings'

// Fancy progress bar to be fancy.
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.legacy)

// If the script is called with parameter -i it will ask before overwriting
// existing recordings and show progress bar.
// This option is not needed when running daemonized.
const isInteractive = process.argv[2] == '-i'

const zeroPadNum = n => n.toString().padStart(2, '0');

// The outstream to write the different mp3 files.
var outStream;

var allRecordings = [];


const record = (config, callback) => {
    icecast.get(config.streamUrl, (icecastStream) => {
        startRecording(icecastStream, config, callback)
    })
}

const startRecording = (icecastStream, config, callback) => {
    let folder = path.join(process.cwd(), baseFolder)
    
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder)
    }

    const fileName = config.fileName ? config.fileName : getFileNameFromDate()

    let filePath = getFilePathFromName(fileName)

    if (!isInteractive && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
    }

    let data = {
        icecastStream, 
        config, 
        fileName,
        callback
    }

    if (fs.existsSync(filePath)) {
        // Ask to overwrite file or exit the program.
        console.log(`Recording with name ${fileName} already exists`)
        const prompt = new Confirm('Do you want to overwrite it?')

        prompt.ask((answer) => {
            if (!answer) {
                console.log('Terminating...')
                process.exit()
            } else {
                fs.unlinkSync(filePath)
                recordStream(data)
            }
        })
    } else {
        recordStream(data)
    }
}

const checkStreamStatus = (data) => {
    let httpRequest = request(data.config.streamUrl, null, (err, res) => {
        if (res.statusCode == 404) {
            console.error('Server status: 404')
            setTimeout(checkStreamStatus.bind(null, data), 1200)
        }
    })

    setTimeout(() => {
        if (httpRequest.response.statusCode == 200) {
            httpRequest.abort()
            console.log('Re-starting recorder!')

            // Re-start recorder with different file name.
            data.config.fileName = getChunkedFileName(data.fileName)
            record(data.config, data.callback)
        }
    }, 1000)
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

    console.log(`Recording to: ${data.fileName}`)

    data.icecastStream.on('data', (streamData) => {
        outStream.write(streamData)

        clearTimeout(checkDataFlowInterval)
        checkDataFlowInterval = setTimeout(() => {
            // After 1 sec. of receiving no data, start checking if 
            // streaming server is up and running.
            checkStreamStatus(data)
            outStream.close()
            console.error(`Recording interrupted: ${data.fileName}`)
        }, 1000)
    })

    let progressBarInterval

    if (isInteractive) {
        progressBar.start(data.config.durationInSeconds, 0)

        var currentStep = 0
        progressBarInterval = setInterval(() => {
            currentStep++
            progressBar.update(currentStep)
        }, 1000)
    }

    setTimeout(finishRecording.bind(
        null, data, progressBarInterval), data.config.durationInSeconds * 1000)
}

const finishRecording = (data, progressBarInterval) => {
    if (isInteractive) {
        clearInterval(progressBarInterval)
        progressBar.update(data.config.durationInSeconds)
        progressBar.stop()
    }

    console.log(`Finished recording to: ${data.fileName}`)
    outStream.close()

    data.callback(allRecordings)
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
    record
}