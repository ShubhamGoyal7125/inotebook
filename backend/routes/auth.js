const express = require('express');
const { body, validationResult } = require('express-validator'); //used to check the validity of input auth details given by user
const router = express.Router();
const User = require('../modules/User');
const bcrypt = require('bcrypt'); //For hashing ans salting of passwords
const jwt = require('jsonwebtoken'); //Used for giving a token for login to the user
const fetchuser = require('../middleware/fetchuser');
const JWT_SECRET = "shubhamisa@1greatboy";

// ROUTE 1: Creating a new user using: POST "/api/auth/createUser" - No Login required
router.post('/createUser', [
    body('email', 'Enter a valid email').isEmail(),
    body('name', 'Name must be atleast 3 characters long.').isLength({ min: 3 }),
    body('password', 'Password must be atleast 5 characters long.').isLength({ min: 5 })
], async (req, res) => {

    //Checking errors, if error occurs, it returns a bad request with an error message
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        //Checking the uniqueness of email id of new user
        let user = await User.findOne({ email: req.body.email });
        if (user) {
            return res.status(400).json({ error: 'This email id already exists. Please enter a unique email id' })
        }

        // Hashing ans Salting of password
        const salt = await bcrypt.genSalt(10);
        const securePassword = await bcrypt.hash(req.body.password, salt);
        
        //Creating a new user with unique email id and secure password
        user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: securePassword
        });

        const data={
            user: {
                id: user.id
            }
        }

        const token = jwt.sign(data, JWT_SECRET);
        res.json({token});
        //   .then(user => res.json(user))
        //   .catch(err=>{
        //     console.log(err);
        //     res.json({error: 'This email id already exists. Please enter a unique email id'})
        // });
        
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// ROUTE 2: Creating a user login using: POST "/api/auth/login" - No Login required

router.post('/login', [
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password cannot be blank').exists()
], async (req, res) => {

    //Checking errors, if error occurs, it returns a bad request with an error message
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {email, password} = req.body;
    try {

        let user = await User.findOne({email});
        if(!user){
            return res.status(400).json({error: 'Please enter valid login credentials.'});
        }

        let passwordCompare = await bcrypt.compare(password, user.password);

        if(!passwordCompare){
            return res.status(400).json({error: 'Please enter valid login credentials.'});
        }

        const data={
            user: {
                id: user.id
            }
        }

        const token = jwt.sign(data, JWT_SECRET);
        res.json({token});

    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }


});


// ROUTE 3: Getting the details of logged-in user using: POST "/api/auth/getuser" - Login required

router.post('/getuser', fetchuser, async (req, res) => {

    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("-password");
        res.send({user})
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");   
    }

});

module.exports = router;