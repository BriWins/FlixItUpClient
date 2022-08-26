const passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  Models = require('./models'),
  passportJWT = require('passport-jwt');

let Users = Models.User,
  JWTStrategy = passportJWT.Strategy,
  ExtractJWT = passportJWT.ExtractJwt;

/**
 * checks for username and validates password
 * @param {string} username
 * @param {string} password
 * @default
 */

passport.use(new LocalStrategy({
  usernameField: 'Username',
  passwordField: 'Password'
}, (Username, Password, callback) => {
  console.log(Username + '  ' + Password);
  Users.findOne({ Username: Username }, (error, users) => {
    if (error) {
      console.log(error);
      return callback(error);
    }

    if (!users) {
      console.log('incorrect username');
      return callback(null, false, {message: 'Incorrect username or password.'});
    }

    console.log('finished');
    return callback(null, users);
  });
}));

/**
 * validate bearer token
 * @param {string} jwtPayload
 * @param callback
 */

passport.use(new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'your_jwt_secret'
}, (jwtPayload, callback) => {
  return Users.findById(jwtPayload._id)
    .then((users) => {
      return callback(null, users);
    })
    .catch((error) => {
      return callback(error)
    });
}));