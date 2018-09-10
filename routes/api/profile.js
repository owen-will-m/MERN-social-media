const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const validateProfileInput = require('../../validation/profile');
const validateExperienceInput = require('../../validation/experience');
const validateEducationInput = require('../../validation/education');

//load profile model
const Profile = require('../../models/Profile');
const User = require('../../models/User');


// @route GET api/profile/test
// @desc Tests profile route
// @access Public

router.get('/test',
  (req, res) => res.json({msg: "profile works"}));

  // @route GET api/profile
  // @desc gets current users profile
  // @access private
router.get('/',
  passport.authenticate('jwt', {session: false}),
    (req, res) => {
        const errors = {noprofile: 'sorry there is no profile'};
        Profile.findOne({user: req.user.id})
          .populate('user', ['name', 'avatar'])
          .then(profile => {
            if(!profile){
              errors.noprofile = 'no profile';
              return res.status(404).json(errors);
            }
            res.json(profile);
          }).catch( err => res.status(404).json(err));
});
// @route GET api/profile/handle/:handle
// @desc gets profile by handle
// @access public
router.get('/handle/:handle',
  (req, res) => {
      const errors = {};
      Profile.findOne({handle: req.params.handle})
        .populate('user', ['name', 'avatar'])
        .then(profile => {
          if(!profile){
            errors.noprofile = 'handle invalid';
            return res.status(404).json(errors);
          }
          res.json(profile);
        }).catch( err => res.status(404).json(err));
});
// @route GET api/profile/user/:user_id
// @desc gets profile by user ID
// @access public
router.get('/user/:user_id',
  (req, res) => {
      const errors = {};
      Profile.findOne({user: req.params.user_id})
        .populate('user', ['name', 'avatar'])
        .then(profile => {
          if(!profile){
            errors.noprofile = 'id invalid';
            return res.status(404).json(errors);
          }
          res.json(profile);
        }).catch( err => res.status(404).json({profile: 'id does not exist'}));
});
// @route GET api/profile/all
// @desc gets all profiles
// @access public
router.get('/all',
  (req, res) => {
      const errors = {};
      Profile.find()
        .populate('user', ['name', 'avatar'])
        .then(profiles => {
          if(!profiles){
            errors.noprofile = 'there are no profiles';
            return res.status(404).json(errors);
          }
          res.json(profiles);
        }).catch( err => res.status(404).json({profile: 'there are no profiles'}));
});







// @route POST api/profile
// @desc create/edit user profile
// @access private

router.post('/',
  passport.authenticate('jwt', {session: false}),
    (req, res) => {

      const {errors, isValid} = validateProfileInput(req.body);

      if(!isValid){
        res.status(400).json(errors);
      }

      const profileFields= {};
      profileFields.user = req.user.id;
      if(req.body.handle) profileFields.handle = req.body.handle;
      if(req.body.company) profileFields.company = req.body.company;
      if(req.body.website) profileFields.website = req.body.website;
      if(req.body.location) profileFields.location = req.body.location;
      if(req.body.status) profileFields.status = req.body.status;

      //skills: split into an array (comes in as csv)
      if(typeof req.body.skills !== 'undefined'){
         profileFields.skills = req.body.skills.split(',');
       }

      if(req.body.bio) profileFields.bio = req.body.bio;
      if(req.body.github) profileFields.github = req.body.github;

      //social
      profileFields.social = {};
      if(req.body.facebook) profileFields.social.facebook = req.body.facebook;
      if(req.body.instagram) profileFields.social.instagram = req.body.instagram;

      Profile.findOne({user: req.user.id})
        .then(profile => {
          //update bc profile already exists
          if(profile){
          Profile.findOneAndUpdate({ user: req.user.id}, { $set: profileFields}
          , {new: true}).then(profile => res.json(profile));
        }else{
          //create new profile

          //check if handle exists
          Profile.findOne({handle: profileFields.handle})
            .then(profile => {
              if(profile){
                errors.handle = 'handle already exists in database';
                res.status(400).json(errors);
              }
              //save profile
              new Profile(profileFields).save()
                .then(profile => res.json(profile))
                  .catch(err => console.log(err));
            });
        }
        });
});
// @route POST api/profile/experience
// @desc add experience
// @access private
router.post('/experience',   passport.authenticate('jwt', {session: false}),
(req, res) => {
    Profile.findOne({user: req.user.id})
      .then(profile => {
        const {errors, isValid} = validateExperienceInput(req.body);
        if(!isValid){
          res.status(400).json(errors);
        }
        const newExperience = {
          title: req.body.title,
          company: req.body.company,
          from: req.body.from,
          to: req.body.to,
          current: req.body.current
        }
        // add to experience array
        profile.experience.unshift(newExperience);
        profile.save().then(profile => res.json(profile));
      });
});

// @route POST api/profile/education
// @desc add ed
// @access private
router.post('/education',   passport.authenticate('jwt', {session: false}),
(req, res) => {
    Profile.findOne({user: req.user.id})
      .then(profile => {
        const {errors, isValid} = validateEducationInput(req.body);
        if(!isValid){
          res.status(400).json(errors);
        }
        const newEducation = {
          degree: req.body.degree,
          school: req.body.school,
          from: req.body.from,
          to: req.body.to,
        }
        // add to experience array
        profile.education.unshift(newEducation);
        profile.save().then(profile => res.json(profile));
      });
});

// @route DELETE api/profile/experience/:exp_id
// @desc delete experience from database
// @access private
router.delete('/experience/:exp_id',   passport.authenticate('jwt', {session: false}),
(req, res) => {
    Profile.findOne({user: req.user.id})
      .then(profile => {
        const removeIndex = profile.experience.map(item => item.id)
        .indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex, 1);
        profile.save().then(profile => res.json(profile))
        .catch(err => res.status(404).json(err));
      });
});

// @route DELETE api/profile/education/:exp_id
// @desc delete education from database
// @access private
router.delete('/education/:edu_id',   passport.authenticate('jwt', {session: false}),
(req, res) => {
    Profile.findOne({user: req.user.id})
      .then(profile => {
        const removeIndex = profile.education.map(item => item.id)
        .indexOf(req.params.edu_id);
        profile.education.splice(removeIndex, 1);
        profile.save().then(profile => res.json(profile))
        .catch(err => res.status(404).json(err));
      });
});
// @route DELETE api/profile/
// @desc delete user and profile
// @access private
router.delete('/',   passport.authenticate('jwt', {session: false}),
(req, res) => {
    Profile.findOneAndRemove({user: req.user.id})
      .then(profile => {
        User.findOneAndRemove({ _id: req.user.id }).then(()=>{
          res.json({success: true})
        })

      });
});
module.exports = router;
