const axios = require('axios');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const secret = "dadjokesarelame"

const { authenticate } = require('../auth/authenticate');

const db = require('../database/dbConfig')

module.exports = server => {
  server.post('/api/register', register);
  server.post('/api/login', login);
  server.get('/api/jokes', authenticate, getJokes);
};

function generateToken(user){
  const payload = {
    username: user.username,
  };

  const options = {
    expiresIn: '1h'
  };
  return jwt.sign(payload, secret, options)
}

function register(req, res) {
  // implement user registration
  const user = req.body;
  if(user.username && user.password){
    user.password = bcrypt.hashSync(user.password);
    db('users').insert(user)
    .then(id =>{
      db('users').where('id', id)
      .then(newUser => {
        console.log(newUser)
        const token = generateToken(newUser)
        res
        .status(201)
        .json({id: user.id, token})
      });
    })
    .catch(err =>{
      res
      .status(500)
      .send(err);
    })
  } else {
    res
    .status(400)
    .json({errorMessage: "Please provide a username and password"})
  }
}

function login(req, res) {
  // implement user login
  const creds = req.body;
  if(creds.username && creds.password){
    db('users').where('username', creds.username)
    .then(user => {
      if(user && bcrypt.compareSync(creds.password, user[0].password)) {
        const token = generateToken(user)
        res.json({info: "Logged In", token})
      } else {
        res
        .status(404)
        .json({error: "Please check username and password"})
      }
    })
    .catch(err => {
      res
      .status(500)
      .send(err)
    })

  } else {
    res
    .status(400)
    .json({errorMessage: "Please provide your username and password"})
  }
}

function getJokes(req, res) {
  const requestOptions = {
    headers: { accept: 'application/json' },
  };

  axios
    .get('https://icanhazdadjoke.com/search', requestOptions)
    .then(response => {
      res.status(200).json(response.data.results);
    })
    .catch(err => {
      res.status(500).json({ message: 'Error Fetching Jokes', error: err });
    });
}
