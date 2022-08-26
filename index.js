const mongoose = require("mongoose");
const Models = require("./models.js");
const Movies = Models.Movie;
const Users = Models.User;
const express = require("express");
const cors = require("cors");
const app = express();
const { check, validationResult } = require("express-validator");

morgan = require("morgan");
app.use(morgan("common"));
app.use(express.static("public"));

// mongoose.connect("mongodb://localhost:27017/myFlixDB", {useNewUrlParser: true, useUnifiedTopology: true});

mongoose.connect( process.env.CONNECTION_URI , {useNewUrlParser: true, useUnifiedTopology: true});

const bodyParser = require("body-parser"),
methodOverride = require("method-override");
const { restart } = require("nodemon");
app.use(bodyParser.urlencoded({ extended: true,}));
app.use(bodyParser.json());
app.use(methodOverride());

let allowedOrigins = ["`http://localhost:5500`", "http://testsite.com", "http://localhost:1234", "http://localhost:4200"];

app.options('*', cors()) //enable preflight requests

app.use(cors({
  origin: (origin, callback) => {
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){ 
      let message = "The CORS policy for this application doesn’t allow access from origin" + origin;
      return callback(new Error(message ), false);
    }
    return callback(null, true);
  }
}));

let auth = require('./auth')(app);

const passport = require('passport');
require('./passport');

/**
 * redirects root to index.html
 * @param {express.request} req
 * @param {express.response} res
 */

app.get("/", (req,res) => {
  res.send("Welcome to the My Flix App!!!")
});

/**
 * redirects /documentation to documentation.html
 * @param {express.request} req
 * @param {express.response} res
 */

app.get("/documentation", (req, res) => {
  res.sendFile("Public/documentation.html", { root: __dirname });
});

/**
 * /users endpoint
 * method: post
 * register user profile
 * expects Username, Password, Email, Birthdate, Favorites
 * @param {express.request} req
 * @param {express.response} res
 */

app.post("/users/register", 
 [
  check("Username", "Username with a minimum of six characters is required").isLength({min: 6}),       //Validation logic for user registration request
  check("Username", "Username contains non alphanumeric characters- not allowed").isAlphanumeric(),
  check("Password", "Password is required").not().isEmpty(),
  check("Password", "Password with a minimum of eight characters is required").isLength({min: 8}),
  check('Email', 'Email does not appear to be valid').isEmail()
],        
(req, res) => {
  
let errors = validationResult(req);        //checks validation object for errors

if (!errors.isEmpty()) {
    return res.status(422).json( {errors: errors.array() });
}
let hashPassword = Users.hashPassword(req.body.Password);
  Users.findOne({ Username: req.body.Username })
    .then((users) => {
      if (users) {
        return res.status(400).send(req.body.Username + "already exists");
      } else {
        Users.create({
         Username: req.body.Username,
         Password: hashPassword,
         Email: req.body.Email,
         Birthdate: req.body.Birthdate,
         Favorites: req.body.Favorites
        })
        .then((users) => {res.status(201).json(users)})
        .catch((error) => {
         console.error(error);
         res.status(500).send("Error: " + error);
    })
  }
})
   .catch((error) => {
     console.error(error);
     res.status(500).send("Error: " + error );
   });
});


/**
 * /users/:Username/movies/:MovieID endpoint
 * method: post
 * add MovieID to user favorites
 * @param {express.request} req
 * @param {express.response} res
 */

app.post("/users/:Username/movies/:MovieID", passport.authenticate("jwt", { session: false }), (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, 
    {
       $push: { Favorites: req.params.MovieID }
    },
    { new: true },
    ( err, updatedUser) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
      } else {
        res.json(updatedUser);
      }
    });
});

/**
 * /movies endpoint
 * method: get
 * get all movies and populates
 * @param {express.request} req
 * @param {express.response} res
 */

app.get("/movies", passport.authenticate("jwt", { session: false }), (req, res) => {
  Movies.find()
    .then((movies) => {
      res.status(201).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});


/**
 * /users/:Username endpoint
 * method: get
 * user profile
 * @param {express.request} req
 * @param {express.response} res
 */

app.get("/users/:Username", passport.authenticate("jwt", { session: false }), (req,res) => {
  Users.findOne({ Username: req.params.Username })
  .then((user) => {
    res.json(user);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send("Error: " + err);
  });
});


/**
 * /movies/:titles endpoint
 * get: movie by title and populates
 * @param {express.request} req
 * @param {express.response} res
 */

app.get("/movies/:titles",  passport.authenticate("jwt", { session: false }), (req, res) => {
  Movies.findOne({ Title: req.params.titles })
  .then((movies) => {
    res.json(movies);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send("Error: " + err);
  });
});


/**
 * movies/genres/:genres endpoint
 * method: get
 * all genres
 * @param {express.request} req
 * @param {express.response} res
 */

app.get("/movies/genres/:genres", passport.authenticate("jwt", { session: false }), (req, res) => {
  Movies.find({ "Genre.Name" : req.params.genres })
  .then((movies) => {
    res.json(movies);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send("Error: " + err);
  });
});


/**
 * movies/directors/:names endpoint
 * method: get
 * director by name
 * @param {express.request} req
 * @param {express.response} res
 */

app.get("/movies/directors/:names", passport.authenticate("jwt", { session: false }), (req, res) => {
  Movies.findOne({ "Director.Name": req.params.names })
  .then((movies) => {
   if (movies) {
     res.status(200).json(movies.Director);
   } else {
     res.status(400).send("Director not found.");
   };
  })
  .catch((err) => {
    res.status(500).send("Error" + err);
  });
});


/**
 * /users/ endpoint
 * method: put
 * update user profile
 * expects Username, Password, Email, Birthdate, Favorites
 * @param {express.request} req
 * @param {express.response} res
 */

app.put("/users/:Username",  passport.authenticate("jwt", { session: false }),  (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username },
    { $set:
      {
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthdate: req.body.Birthdate,
        Favorites: req.body.Favorites
      }
    },
     { new: true },
     (err, updatedUser) => {
       if(err) {
         console.error(err);
         res.status(500).send( "Error: " + err);
       } else {
         res.json(updatedUser)
       }
    });
});


/**
 * /users/:Username/movies/:MovieID endpoint
 * method post
 * remove MovieID from user favorites
 * @param {express.request} req
 * @param {express.response} res
 */

app.delete("/users/:Username/movies/:MovieID", passport.authenticate("jwt", { session: false }), (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, 
    {
       $pull: { Favorites: req.params.MovieID }
    },
    { new: true },
    ( err, updatedUser) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
      } else {
        res.json(updatedUser);
      }
    });
});


/**
 * /users endpoint
 * method: delete
 * delete user profile
 * @param {express.request} req
 * @param {express.response} res
 */

app.delete("/users/unregister/:Username", passport.authenticate("jwt", { session: false }), (req, res) => {
  Users.findOneAndRemove({ Username: req.params.Username })
    .then((users) => {
      if (!users) {
        res.status(400).send( req.params.Username + " was not found");
    } else {
      res.status(200).send( req.params.Username + " was deleted");
    }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
  });
});

//---------------------------------------Catching Errors-------------------------------------------------------


/**
 * catches uncaught errors
 * @param {express.error} err
 * @param {express.request} req
 * @param {express.response} res
 * @param {express.NextFunction} next
 */

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("UH-OH! Something broke!");
});



const port = process.env.PORT || 5500;
app.listen(port, "0.0.0.0", () => {
  console.log("Listening on Port " + port);
});

