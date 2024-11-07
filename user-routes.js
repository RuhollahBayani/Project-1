const express = require('express');
const router = express.Router()
const UserModel = require('./UserModel');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary');
const passport = require('passport');
const { json } = require('body-parser');



// This is similar to salt in bcrypt 
const jwtSecret = process.env.JWT_SECRET

// No need to include '/user' here in document part of the URL
router.post(
    '/register',
    function(req, res){

        // Client (browser, postman) POSTs this...
        const formData = {
            "firstName": req.body.firstName,
            "lastName": req.body.lastName,
            "email": req.body.email,
            "password": req.body.password,
            "phone": req.body.phone
        }
        
        // Check if email is unique
        UserModel
        .findOne( { email: formData['email'] } )
        .then(
            async function (dbDocument) {

                // If avatar file is included
               if ( Object.values(req.files).length > 0){
                
                const files = Object.values(req.files)
                

                // Upload to Cloudinary 
                await cloudinary.uploader.upload(
                    files[0].path,
                    (cloudinaryErr, cloudinaryResult) => {
                        if (cloudinaryErr){
                            console.log(cloudinaryErr),
                            res.json(
                             {
                                status: "it's ok",
                                message: "Error occured during image upload"
                             }
                            )
                        } else {
                            // Include the image url in formData
                            formData.avatar = cloudinaryResult.url;
                            console.log('formData.avatar', formData.avatar)

                        }
                    
                    }
                )

               };

               // If email is unique
               if (!dbDocument){

                // General a salt 
                bcryptjs.genSalt(


                    function(bcryptError, theSalt){
                        // Use the (a) and (b) salt user's password
                        // and produce hashed password
                        bcryptjs.hash(
                            formData.password,     // First ingredient
                            theSalt,               // Second ingredient
                            function(hashError, theHash) {  // the Hash
                                // Reassign the original password formData
                                formData['password'] = theHash;

                                // Create the user's amount with Hashed password
                                UserModel
                                .create(formData)
                                // If successful...
                                .then(
                                    function(createdDocument){
                                        // Express sends this
                                        res.json({
                                            status: "ok",
                                            createdDocument
                                        });
                                    }
                                )
                                // If problem occures, then catch the problem
                                .catch(
                                    function(dbError){
                                        // For the developer
                                        console.log('An erroe occured during .create', dbError);

                                        // For the client (frontend app)
                                        res.status(503).json(
                                            {
                                                status: "not ok",
                                                message: "Something went wrong with db"
                                            }
                                        )
                                    }
                                )
                            }
                        )
                    }
                )
                
               } 
               // If email is NOT unique...
               else {
                // Reject the request
                res.status(403).json(
                    {
                        status: "not ok",
                        message: "Accountal ready exists"
                    }
                )
               }
            }
        )
        .catch(
            function (dbError) {
                
                // For the developer
                console.log(
                    'An error accured', dbError
                );
                // For the client (frontend App)
                res.status(503).json(
                    {
                    "status": "not ok",
                    "message": "Error at /register"
                    }
                )
            }
        )
        // res.send("see console for data")
    }
);

// Login user
router.post(
    '/login',
    (req, res) => {

        // Capture form data
        const formData = {
            email: req.body.email,
            password: req.body.passport
        }

        // Check if email exists
        UserModel
        .findOne( { email: formData.email } )
        .then(
            (dbDocument) => {
             // If email exist
             if(dbDocument) {
              // Compare the password sent against password in database
              bcryptjs.compare(
                formData.password,       // password user sent
                dbDocument.password      // password in database
              )
              .then(
                (isMatch) => {
                    // If password match...
                    if(isMatch){
                        // Generate the Payload
                        const payload = {
                            _id: dbDocument._id,
                            email: dbDocument.email 
                        }
                        // Generate the jsonwebtoken
                        jwt
                        .sign(
                            payload,
                            jwtSecret,
                            (err, jsonwebtoken) => {
                                if (err){
                                    console.log(err);
                                    res.status(501).json(
                                        {
                                            "message": "Something went wrong"
                                        }
                                    );
                                }
                                else {
                                    // Send the jsonwebtoken to the client
                                    res.json(
                                        {
                                            "status": "ok",
                                            "message": {
                                                email: dbDocument.email,
                                                avatar: dbDocument.avatar,
                                                firstName: dbDocument.firstName,
                                                lastName: dbDocument.lastName,
                                                jsonwebtoken: jsonwebtoken
                                            }
                                        }
                                    );
                                }
                            }
                        )
                    }
                    else {
                        res.status(401).json(
                            {
                                "message": "Wrong  email or password"
                            }
                        );
                    }
                }
              )
              .catch(
                (err) => {
                    console.log(err)
                }
              )
             }
             // If email does not exist
             else {
                // reject the Login
                res.status(401).json(
                    {
                        "message": "Wrong email or password"

                    }
                );
             }
            }
        )
        .catch(
            (err) => {
                console.log(err);

                res.status(503).json(
                    {
                        "status": "not ok",
                        "message": "Please try again later"
                    }
                );
            }
        )
    }
);

router.post(
    'update',
    passport,passport.authenticate('jwt', {session: false}),
    function(req, res){

        // Client (browser, postman) POSTs this...
        const formData = {}

        if( req.body.firstName ) formData['firstName'] = req.body.firstName;
        if( req.body.lastName ) formData['lastName'] = req.body.lastName;
        if( req.body.email ) formData['email'] = req.body.email;
        if( req.body.password ) formData['password'] = req.body.password;
        if( req.body.phone ) formData['phone'] = req.body.phone
        

        // Check if email exists
        UserModel
        .findById(req.user.id)
        .then(
            async function (dbDocument) {

                // If avatar file is available
                if( Object.values(req.files).length > 0 ) {

                    const files = Object.values(req.files);

                    // upload Cloudinary
                    await cloudinary.uploader.upload(
                        files[0].path,
                        (cloudinaryErr, cloudinaryResult) => {
                            if(cloudinaryErr) {
                                console.log(cloudinaryErr);
                                res.json(
                                    {
                                        status: "not ok",
                                        message: "Error occured during image upload"
                                    }
                                )
                            } else {
                                // Include the image url in formData
                                formData.avatar = cloudinaryResult.url;
                                console.log( 'formData.avatar', formData.avatar )
                            }
                        }
                    )
                };

                // If email exists...
                if(dbDocument) {
                    
                    UserModel
                    .findOneAndUpdate(
                        {
                            _id: req.user.id
                        },
                        {
                            $set: formData
                        },
                        {new: true}
                    )
                    .then(
                        function (dbDocument) {
                            res.json(
                                {
                                    "status": "ok",
                                    "message": {
                                        email: dbDocument.email,
                                        avatar: dbDocument.avatar,
                                        firstName: dbDocument.firstName,
                                        lastName: dbDocument.lastName,
                                        phone: dbDocument.phone
                                    }
                                }
                            );
                        }
                    )
                    .catch(
                        function(dbError){
                            console.log(dbError, 'error occured at /users/update')
                            res.status(403).json(
                                {
                                    "status": "not ok",
                                    "messages": "Account already exists"
                                }
                            )
                        }
                    )
                }

                // If email does not exists
                else{
                    // reject the reqest
                    res.status(403).json(
                        {
                            "status": "not ok",
                            "messages": "Account already exists"
                        }
                    )
                }
            }
        )
        .catch(
            function(dbError) {

                // For the developers
                console.log(
                    'An error occured', dbError
                );

                // For the Client (frontend App)
                res.status(503).json(
                    {
                        "status": "not ok",
                        "messages": "Something went wrong with db"
                    }
                )
            }
        )
    }
);

router.post(
    '/find',    // http://www.website.com/user/get
    passport.authenticate('jwt', {session: false}),
    function(req, res) {
        UserModel
        .findById(req.user.id)
        .then(
            function (dbDocument) {
                res.json(
                    {
                        "status": "ok",
                        "message": {
                            email: dbDocument.email,
                            avatar: dbDocument.avatar,
                            firstName: dbDocument.firstName,
                            lastName: dbDocument.lastName,
                            phone: dbDocument.phone
                        }
                    }
                );
            }
        )
        .catch(
            (err) => {
                console.log(err);
                res.status(503).json(
                    {
                        "status": "not ok",
                        "message": "Please try again later"
                    }
                );
            }
        )

    }

);



module.exports = router;