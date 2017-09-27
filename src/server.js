const http = require('http');
const htmlHandler = require('./htmlResponses.js');
const responseHandler = require('./responses.js');

const url = require('url');

const query = require('querystring');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const handlePOST = (req, res, parsedUrl) => {
  if (parsedUrl.pathname === '/addUser') {
    // uploads come in as a byte stream that we need to reassemble once it's all arrived
    const body = [];

    // if upload stream errors out, throw a bad request and send it back
    req.on('error', (err) => {
      console.dir(err);
      res.statusCode = 400;
      res.end();
    });

    // on 'data' is for each byte of data that comes in from the upload. 
    // We will add it to our byte array
    req.on('data', (chunk) => {
      body.push(chunk);
    });

    // on end of upload stream
    req.on('end', () => {
      // combine our byte array (using Buffer.concat) and convert it to a string value 
      const bodyString = Buffer.concat(body).toString();
      // parse the string into an object by field name
      const bodyParams = query.parse(bodyString);

      responseHandler.addUser(req, res, bodyParams);
    });
  }
};

const handleGET = (req, res, parsedUrl) => {
  switch (req.method) {
    case 'GET':
      if (parsedUrl.pathname === '/') {
        htmlHandler.getIndex(req, res);
      } else if (parsedUrl.pathname === '/style.css') {
        htmlHandler.getCSS(req, res);
      } else if (parsedUrl.pathname === '/getUsers') {
        responseHandler.getUsers(req, res);
      } else if (parsedUrl.pathname === '/notReal') {
        responseHandler.notReal(req, res);
      } else {
        responseHandler.notFound(req, res);
      }
      break;
    case 'HEAD':
      if (parsedUrl.pathname === '/getUsers') {
        responseHandler.getUsers(req, res);
      } else if (parsedUrl.pathname === '/notReal') {
        responseHandler.notReal(req, res);
      }
      break;
    default:
      responseHandler.notFound(req, res);
      break;
  }
};

const onRequest = (req, res) => {
  console.log(req.url);

  const parsedUrl = url.parse(req.url);

  if (req.method === 'POST') {
    handlePOST(req, res, parsedUrl);
  } else { // if req.method === 'GET' || 'HEAD'
    handleGET(req, res, parsedUrl);
  }
};

http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1: ${port}`);
