# stream-recorder

A stream recorder for freeformportland.org


Copy the `.env.example` file to a new file named `.env` and add your AWS credentials like so:

```
AWS_ACCESS_KEY_ID="XXX"
AWS_SECRET_ACCESS_KEY="XXX"
AWS_DEFAULT_REGION="us-west-2"
```

Create and start containers:
```
docker-compose up
```

npm install:
```
docker-compose run --rm npm install
```

To start a recording run:
```
docker-compose run --rm node record.js
```
