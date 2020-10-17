# stream-recorder

A stream recorder for freeformportland.org


Copy the `.env.example` file to a new file named `.env` and add your AWS credentials like so:

```
AWS_ACCESS_KEY_ID="XXX"
AWS_SECRET_ACCESS_KEY="XXX"
AWS_DEFAULT_REGION="us-west-2"
```

npm install:
```
docker-compose run --rm npm install
```

Create and start containers:
```
docker-compose up
```


To start a recording run:
```
docker-compose run --rm node record.js
```

Edit `record.js` to change `s3Bucket`, `streamUrl` and/or `durationInSeconds` for the duration of the radio show to record.

```javascript
// The root s3 bucket to store the 
// recordings in
const s3Bucket = 'freeform-radio-org'

// The icecast radio stream
const streamUrl = 'http://listen.freeformportland.org:8000/stream'

// Duration of the recording
const durationInSeconds = 10
```
