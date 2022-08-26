const jwtSecret = 'your_jwt_secret'; // This has to be the same key used in the JWTStrategy

const jwt = require('jsonwebtoken'),
  passport = require('passport');

require('./passport'); // Your local passport file


let generateJWTToken = (users) => {
  return jwt.sign(users, jwtSecret, {
    subject: users.Username, // This is the username you’re encoding in the JWT
    expiresIn: '7d', // This specifies that the token will expire in 7 days
    algorithm: 'HS256' // This is the algorithm used to “sign” or encode the values of the JWT
  });
}


/**
 * login authentication
 * @module login/authentication
 * @param {*} router 
 */

module.exports = (router) => {

/**
 * /login endpoint
 * method: post
 * authenticates user credentials
 * @param {express.request} req
 * @param {express.response} res
 */

  router.post('/login', (req, res) => {
    console.log(req.body);
    passport.authenticate('local', { session: false }, (error, users) => {
      console.log(error);
      if (error || !users) {
        return res.status(400).json({
          message: 'Something is not right',
        });
      }
      req.login(users, { session: false }, (error) => {
        if (error) {
          res.send(error);
        }
        let token = generateJWTToken(users.toJSON());
        return res.json({ users, token });
      });
    })(req, res);
  });
}