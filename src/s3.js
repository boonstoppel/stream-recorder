const AWS = require('aws-sdk')
const fs = require('fs')

// The AWS credentials are stored in .env.
// and loaded into the environment in docker-compose.yml
const upload = (config, callback) => {
  fs.readFile(config.filePath, (err, fileContent) => {
     if (err) {
        throw err
    }

    const s3 = new AWS.S3({
        apiVersion: '2006-03-01'
    })

    const params = {
         Bucket: config.bucket,
         Body: fileContent,
         Key: config.key,
         ACL: 'public-read'
     }

     s3.upload(params, (err, data) => {
         if (err) {
            throw err
        }

        callback(data.Location)
     })
  })
}


module.exports = {
    upload
}