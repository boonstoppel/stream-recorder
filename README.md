# stream-ripper

A stream recorder for freeformportland.org

Add .env file with AWS credentials:

AWS_ACCESS_KEY_ID="XXX"
AWS_SECRET_ACCESS_KEY="XXX"
AWS_DEFAULT_REGION="us-west-2"


Then run:
docker-compose up -d

Then run:
docker-compose run --rm npm update

To start recording run:
docker-compose run --rm node record.js