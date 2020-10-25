# stream-recorder

A stream recorder for freeformportland.org


Copy the `.env.example` file to a new file named `.env` and add your AWS credentials like so:

```
AWS_ACCESS_KEY_ID="XXX"
AWS_SECRET_ACCESS_KEY="XXX"
AWS_DEFAULT_REGION="us-west-2"
S3_BUCKET="bucket-name"
```

Create Docker image 
```sh
$ docker build -t stream-recorder .
```

Run a container from the built image
```sh
$ docker run [-flags] stream-recorder
```


Edit `src/main.js` to change the timing on the CronJob:

```javascript
// Every Minute
// * * * * *
// Every hour
// 0 */1 * * *
// Every 2 hours
// 0 */2 * * *
const job = new CronJob('0 */2 * * *', function() {
}
```


Edit `src/record.js` to change `streamUrl` and/or `durationInSeconds` for the duration of the radio show to record.

```javascript
// The icecast radio stream
const streamUrl = 'http://listen.freeformportland.org:8000/stream'

// Duration of the recording
const durationInSeconds = 10
```
