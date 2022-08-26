//---------------------------Importing Modules-------------------------------- 

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

/**
 * movieSchema schema
 * @class movie
 */

let movieSchema = mongoose.Schema({
    Title: { type: String, required: true},
    Description: {type: String, required: true},
    Featured:Boolean,
    ImgPath: String,
    Rating: String,
    ReleaseDate: Date,
/**
 * Genre schema
 * @class genre
 */
    Genre: {
        Name: String,
        Description: String
    },
/**
 * Director schema
 * @class director
 */
    Director: {
        Name: String,
        Biography: String,
        Birthdate: Date,
        Birthplace: String,
        Deathplace: String
    },
    Actors: [String]
});

/**
 * userSchema schema
 * @class user
 * @mixes {userSchema.methods.validatePassword}
 * @mixes {userSchema.statics.hashedPassword}
 */

let userSchema = mongoose.Schema({
    Username: String,
    Password: String,
    Email: String,
    Birthdate: Date,
    Favorites: [{type: String, ref: "Movie"}]
});

/**
 * hashes user password
 * @mixin
 * @param {string} password 
 * @default
 */

userSchema.statics.hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
};

/**
 * validates user password
 * @mixin
 * @param {string} password
 * @default
 */

userSchema.methods.validatePassword = function(password) {
    return bcrypt.compareSync(password, this.Password);
};


let Movie = mongoose.model("Movie", movieSchema);
let User = mongoose.model("User", userSchema);

module.exports={ User, Movie }

