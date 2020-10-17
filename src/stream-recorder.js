const icecast = require('icy')
const path = require('path')
const fs = require('fs')
const Confirm = require('prompt-confirm')
const cliProgress = require('cli-progress')

// This is the location where the stream gets recorded to 
// before its uploaded to somewhere else.
const baseFolder = 'recordings'

// Fancy progress bar to be fancy.
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.legacy)


const startRecording = (icecastStream, durationInSeconds, callback) => {
    var fileName = getFileNameFromDate()
    var folder = path.join(process.cwd(), baseFolder)
    var filePath = path.join(folder, fileName)

    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder)
    }

    if (fs.existsSync(filePath)) {
        // Ask to overwrite file or exit the program.
        console.log(`Recording with name ${fileName} already exists`)
        const prompt = new Confirm('Do you want to overwrite it?')

        prompt.ask(function(answer) {
            if (!answer) {
                console.log('Terminating...')
                process.exit()
            } else {
                fs.unlinkSync(filePath)
                recordStream({
                    icecastStream, 
                    durationInSeconds, 
                    fileName, 
                    filePath, 
                    callback
                })
            }
        })
    } else {
        recordStream({
            icecastStream, 
            durationInSeconds, 
            fileName, 
            filePath, 
            callback
        })
    }
}


const recordStream = (data) => {
    console.log(`Recording to: ${data.fileName}`)
    var outStream = fs.createWriteStream(data.filePath, { flags: 'w' })

    data.icecastStream.on('data', (data) => {
        try {
          outStream.write(data)
        }
        catch(err) {
        }
    })


    progressBar.start(data.durationInSeconds, 0);

    var currentStep = 0;
    let progressBarInterval = setInterval(() => {
        currentStep++
        progressBar.update(currentStep)
    }, 1000)

    setTimeout(finishRecording.bind(
        null, data, progressBarInterval, outStream), data.durationInSeconds * 1000)
}

const finishRecording = (data, progressBarInterval, outStream) => {
    clearInterval(progressBarInterval)

    progressBar.update(data.durationInSeconds)
    progressBar.stop()

    console.log('Finish recording...')
    outStream.close()

    data.callback(data.filePath)
}

// On this machine the recordings are stored as:
// rec-year-month-day-hour.mp3 eg. rec-2020-10-17-3.mp3
const getFileNameFromDate = () => {
    let date = new Date()

    let time = [
        date.getFullYear(), 
        date.getMonth() + 1, 
        date.getDate(),
        date.getHours()
    ].join('-')

    return `rec-${time}.mp3`
}


module.exports = {
    record: (config, callback) => {
        icecast.get(config.streamUrl, (icecastStream) => {
            startRecording(icecastStream, config.durationInSeconds, callback)
        })
    }
}