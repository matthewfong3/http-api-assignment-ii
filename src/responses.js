// Node's built-in cryptography module
const crypto = require('crypto');

const users = {};

// sha1 is a bit of a quicker hash algorithm for insecure things
let etag = crypto.createHash('sha1').update(JSON.stringify(users));

// grab the hash as a hex string
let digest = etag.digest('hex');

// fxn to respond w/ a json obj
const respondJSON = (req, res, status, obj) => {
  const headers = {
    'Content-Type': 'application/json',
    etag: digest,
  };
  const object = JSON.stringify(obj);
  console.dir(object);
  res.writeHead(status, headers);
  res.write(JSON.stringify(obj));
  res.end();
};

// fxn to respond w/o json body
const respondJSONMeta = (req, res, status) => {
  const headers = {
    'Content-Type': 'application/json',
    etag: digest,
  };

  res.writeHead(status, headers);
  res.end();
};

const addUser = (req, res, bodyParams) => {
  const responseJSON = {
    msg: 'Missing required name and/or age parameters',
  };

  // check to make sure we have both fields and that they are valid inputs
  // sends 400 error message to client if missing required params
  if (!bodyParams.name || !bodyParams.age) {
    responseJSON.id = 'Bad Request';
    return respondJSON(req, res, 400, responseJSON);
  }

  // bool that will tell the server what response type to send back 
  // depending on whether it needs to add a new user or only update an existing user
  let newUserToAdd;

  // if we get this far (!missing required params)
  // check if we should add new user or update existing user 
  if (!users[bodyParams.name]) {
    users[bodyParams.name] = {};
    newUserToAdd = true; // we need to add a new user
  } else {
    newUserToAdd = false; // already an existing user
  }

  // add/update fields for user
  users[bodyParams.name].name = bodyParams.name;
  users[bodyParams.name].age = bodyParams.age;

  etag = crypto.createHash('sha1').update(JSON.stringify(users));
  digest = etag.digest('hex');

  console.dir(users);

  if (newUserToAdd) {
    responseJSON.msg = 'Created Successfully.';
    return respondJSON(req, res, 201, responseJSON);
  }
  return respondJSONMeta(req, res, 204);
};

const getUsers = (req, res) => {
  const responseJSON = {
    users,
  };

  // if GET, respond with 200 success with results first time
  // if GET, respond with 304 not modified w/o results thereafter until content changes
  // if HEAD, respond with 200 success w/o results first time
  // if HEAD, respond with 304 not modified w/o results thereafter until content changes

  if (req.method === 'GET') {
    // check if the hash on the etag is different from that on the server
    // if it is the same, content has not been modified
    if (req.headers['if-none-match'] === digest) {
      return respondJSONMeta(req, res, 304);
    }
    return respondJSON(req, res, 200, responseJSON);
  } // assume it's a HEAD 
  if (req.headers['if-none-match'] === digest) {
    return respondJSONMeta(req, res, 304);
  }
  return respondJSONMeta(req, res, 200);
};

const notFound = (req, res) => {
  const responseJSON = {
    msg: 'The page you are looking for was not found.',
    id: 'Resource Not Found',
  };

  return respondJSON(req, res, 404, responseJSON);
};

const notReal = (req, res) => {
  // if GET, respond with 404 not found with error message
  // if HEAD, respond with 404 not found w/o error message
  if (req.method === 'GET') {
    notFound(req, res);
  } else if (req.method === 'HEAD') {
    respondJSONMeta(req, res, 404);
  }
};


module.exports = {
  addUser,
  getUsers,
  notFound,
  notReal,
};
