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

// If the script is called with parameter -i it will ask before overwriting
// existing recordings and show progress bar.
// This option is not needed when running daemonized.
const isInteractive = process.argv[2] == '-i'

const zeroPadNum = n => n.toString().padStart(2, '0');

const startRecording = (icecastStream, durationInSeconds, callback) => {
    const fileName = getFileNameFromDate()
    const folder = path.join(process.cwd(), baseFolder)
    const filePath = path.join(folder, fileName)

    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder)
    }

    if (!isInteractive && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
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
    const outStream = fs.createWriteStream(data.filePath, { flags: 'w' })

    data.icecastStream.on('data', (data) => {
        try {
          outStream.write(data)
        }
        catch(err) {
            console.log(`Error: ${err.message}`)
            
            // console.log('Restarting recorder')
            // Restart the recorder.
            // startRecording(
            //    data.icecastStream, data.durationInSeconds, data.callback)
        }
    })

    let progressBarInterval;

    if (isInteractive) {
        progressBar.start(data.durationInSeconds, 0)

        var currentStep = 0
        progressBarInterval = setInterval(() => {
            currentStep++
            progressBar.update(currentStep)
        }, 1000)
    }

    setTimeout(finishRecording.bind(
        null, data, outStream, progressBarInterval), data.durationInSeconds * 1000)
}

const finishRecording = (data, outStream, progressBarInterval) => {
    if (isInteractive) {
        clearInterval(progressBarInterval)

        progressBar.update(data.durationInSeconds)
        progressBar.stop()
    }

    console.log('Finish recording')
    outStream.close()

    data.callback(data.filePath)
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

    const hours = zeroPadNum(date.getHours());

    return `rec_${time}-${hours}.mp3`
}


module.exports = {
    record: (config, callback) => {
        icecast.get(config.streamUrl, (icecastStream) => {
            startRecording(icecastStream, config.durationInSeconds, callback)
        })
    }
}