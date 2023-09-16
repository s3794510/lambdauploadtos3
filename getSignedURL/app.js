/*
  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
  Permission is hereby granted, free of charge, to any person obtaining a copy of this
  software and associated documentation files (the "Software"), to deal in the Software
  without restriction, including without limitation the rights to use, copy, modify,
  merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
  permit persons to whom the Software is furnished to do so.
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
  INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
  PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

'use strict'

const AWS = require('aws-sdk')
const https = require('https');
AWS.config.update({ region: process.env.AWS_REGION })
const s3 = new AWS.S3()

// Change this value to adjust the signed URL's expiration
const URL_EXPIRATION_SECONDS = 300

const AUTHORIZER_ENDPOINT_URL = process.env.AUTHORIZER_ENDPOINT_URL; // Fetching from environment variable

const header = {
    'headers': {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    }
}
// Main Lambda entry point
exports.handler = async (event) => {
  const res = await getUploadURL(event)
  return res
}

const fetchUserId = async (token) => {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        const req = https.get(AUTHORIZER_ENDPOINT_URL, options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    body: data
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });
    });
};

const getUploadURL = async function(event) {
  const token = event['queryStringParameters']['userToken']
  const fetchUserId_res = await fetchUserId(token);
  // Check the status code from fetchUserId_res
  if (fetchUserId_res.statusCode !== 200) {
    return fetchUserId_res;
  }
  //const id = JSON.parse(fetchUserId_res.body).userId;
  const sub = JSON.parse(fetchUserId_res.body).sub
  const Key = sub + '/' + event['queryStringParameters']['fileName']
  
  const randomID = parseInt(Math.random() * 10000000)
  const contenttype = event['queryStringParameters']['fileType']
  
  // Get signed URL from S3
  const s3Params = {
    Bucket: process.env.UploadBucket,
    Key,
    Expires: URL_EXPIRATION_SECONDS,
    ContentType: contenttype

    // This ACL makes the uploaded object publicly readable. You must also uncomment
    // the extra permission for the Lambda function in the SAM template.

    // ACL: 'public-read'
  };

  console.log('Params: ', s3Params);
  const uploadURL = await s3.getSignedUrlPromise('putObject', s3Params);
  
  return JSON.stringify({
    uploadURL: uploadURL,
    Key,
    ContentType: contenttype,
  });
}
