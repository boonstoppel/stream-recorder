const CronJob = require('cron').CronJob
const { spawn } = require('child_process')

// Every 2 hours on the hour
const job = new CronJob('0 */2 * * *', () => {
	console.log('')
	console.log('Starting new recording')

	const record = spawn('node', ['src/record.js'])

	record.stdout.setEncoding('utf8')
	record.stdout.on('data', (data) => {
	  	process.stdout.write(data.toString())
	})

	record.on('close', (code) => {
  		console.log(`Job finished`)
  		console.log('--------------------------------------------------')
		console.log('')
	})
}, null, true, 'America/Los_Angeles')


console.log('')
console.log('')
console.log('--------------------------------------------------')
console.log('----- FREEFORMPORTLAND.ORG STREAM RECORDER -------')
console.log('--------------------------------------------------')
console.log('')
console.log('Next recording starts:')
console.log(job.nextDates().format('MMMM Do YYYY, h:mm:ss a'))
console.log('')


// Exit this program with ctrl c
process.on('SIGINT', () => {
    process.exit()
})