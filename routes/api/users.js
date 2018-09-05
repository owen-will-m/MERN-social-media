const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport');

//load input validation
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');


  // @route GET api/users/register
  // @desc registers user
  // @access Public
  router.post('/register', (req,res) => {
    const {errors, isValid} = validateRegisterInput(req.body);

    //check validation
    if(!isValid){
      return res.status(400).json(errors);
    }

    //does email exist?
    User.findOne({ email: req.body.email })
      .then(user => {
        if(user){//this means this user already exists
          errors.email = 'email already exists in database'
          return res.status(400).json(errors);
        }else{
          const avatar = gravatar.url(req.body.email, {
            s: '200', // size
            r: 'pg', //rating
            d: 'mm' //default
          });
          const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            avatar: avatar,
            password: req.body.password
          });
          bcrypt.genSalt(10, (err, salt)=>{
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if(err) throw err;
              newUser.password = hash;
              newUser.save()
                .then(user => res.json(user))
                .catch(err => console.log(err));
            })
          })
        }
      })
  });

  // @route GET api/users/login
  // @desc Login user which returns JWT token
  // @access Public
router.post('/login', (req,res) =>{
  const {errors, isValid} = validateLoginInput(req.body);

  if(!isValid){
    return res.status(400).json(errors);
  }

  const email = req.body.email;
  const password = req.body.password;
  //find the user by email
  User.findOne({email: email})
    .then(user => {
      //check for user
      if(!user){
        errors.email = 'email not found in database'
        return res.status(404).json(errors);
      }
      //check password
      bcrypt.compare(password, user.password)
        .then(isMatch => {
          if(isMatch){//it all checks in!

            const payload = { id: user.id, name: user.name, avatar: user.avatar};
            //sign jwt
            jwt.sign(
              payload,
              keys.secretKey,
              {expiresIn: 3600},
              (err,token) => {
                res.json({
                  success: true,
                  token: 'Bearer ' + token
                })
              } );
          }else{
            errors.password = 'password does not match';
            return res.status(400).json(errors)
          }
        });
    });
});

// @route GET api/users/current
// @desc Returns the current user
// @access private
router.get('/current', passport.authenticate('jwt',
  {session: false}),
  (req,res) => {
      res.json({
        id: req.user.id,
        name: req.user.name
      });
  });


module.exports = router;
