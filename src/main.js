const CronJob = require('cron').CronJob
const { spawn } = require('child_process')

// Every Minute
// * * * * *
// Every hour
// 0 */1 * * *
// Every 2 hours
// 0 */1 * * *
const job = new CronJob('* * * * *', () => {
	console.log('')
	console.log('Starting new recording')

	const record = spawn('node', ['record.js'])

	record.stdout.setEncoding('utf8')
	record.stdout.on('data', (data) => {
	  	process.stdout.write(data.toString())
	})

	record.on('close', (code) => {
  		console.log(`Job finished`)
  		console.log('--------------------------------------------------')
		console.log('')
  		console.log('Next recording starts:')
  		console.log(job.nextDates().format('MMMM Do YYYY, h:mm:ss a'))
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