const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../models/userModel')
const HttpError = require("../models/errorModel")
const fs = require('fs');
const path = require('path');
const { trusted } = require('mongoose');
const { v4: uuid } = require('uuid')





// ============================REGISTER NEW USER============================ //
// POST: api/users/register


// UNPROTECTED
const registerUser = async (req, res, next) => {

    try {
        const { name, email, password, password2 } = req.body;
        if (!name || !email || !password) {
            return next(new HttpError("Fill in all fields.", 422))
        }
        const newEmail = email.toLowerCase()

        const emailExists = await User.findOne({ email: newEmail });
        if (emailExists) {
            return next(new HttpError("Email already exist.", 422))
        }

        if ((password.trim()).lenth < 6) {
            return next(new HttpError("Password should be at least 6 characters.", 422))
        }

        if (password != password2) {
            return next(new HttpError("Password do not match.", 422))
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPass = await bcrypt.hash(password, salt);
        const newUser = await User.create({ name, email: newEmail, password: hashedPass })
        res.status(201).json(`New User ${newUser.email} registered.`);
    } catch (error) {
        return next(new HttpError("User registration failed.", 422))

    }
}




// ============================LOGIN A REGISTERED USER============================ //
// POST: api/users/login
// UNPROTECTED
const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new HttpError("Fill in all fields.", 422));
        }
        const newEmail = email.toLowerCase();

        const user = await User.findOne({ email: newEmail })
        if (!user) {
            return next(new HttpError("Invalid credentials.", 422));
        }

        const comparePass = await bcrypt.compare(password, user.password)
        if (!comparePass) {
            return next(new HttpError("Invalid credentials.", 422));
        }

        const { _id: id, name } = user;

        const token = jwt.sign({ id, name }, process.env.JWT_SECRET, { expiresIn: '1d' })

        res.status(200).json({ token, id, name })


    } catch (error) {
        return next(new HttpError("Login failed, Please check your credentials.", 422))


    }
}




// ============================USER PROFILE============================ //
// POST: api/users/:id
// PROTECTED
const getUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-password');
        if (!user) {
            return next(new HttpError("User not found.", 404))
        }
        res.status(200).json(user);

    } catch (error) {
        return next(new HttpError(error))
    }
}






// ============================CHANGE USER AVATAR============================ //
// POST: api/users/change-avatar
// PROTECTED
const changeAvatar = async (req, res, next) => {
    try {
        if (!req.files.avatar) {
            return next(new HttpError("Please choose an image", 422))
        }

        // find user from database
        const user = await User.findById(req.user.id)
        // delete old avatarif exist
        if (user.avatar) {
            fs.unlink(path.join(__dirname, '..', 'uploads', user.avatar), (err) => {
                if (err) {
                    return next(new HttpError(err))
                }
            })
        }

        const { avatar } = req.files;
        //    check file size
        if (avatar.size > 500000) {
            return next(new HttpError("Profile picture too big. Should be less tha 500kb"), 422)
        }
        let fileName;
        fileName = avatar.name;
        let splittedFileName = fileName.split('.');
        let newFileName = splittedFileName[0] + uuid() + '.' + splittedFileName[splittedFileName.length - 1];
        avatar.mv(path.join(__dirname, '..', 'uploads', newFileName), async (err) => {
            if (err) {
                return next(new HttpError(err))
            }

            const updateAvatar = await User.findByIdAndUpdate(req.user.id, { avatar: newFileName }, { new: true })
            if (!updateAvatar) {
                return next(new HttpError("Avatar could not be changed", 422))
            }
            res.status(200).json(updateAvatar)
        })

    } catch (error) {
        return next(new HttpError(error))
    }
}











// ============================EDIT USERS DETAILS============================ //
// POST: api/users/edit-details
// PROTECTED
const editUser = async (req, res, next) => {
    try {
        const { name, email, currentPassword, newPassword, confirmNewPassword } = req.body;
        if (!name || !email || !currentPassword || !newPassword) {
            return next(new HttpError("Fill in all fields", 422))
        }
        // get user from database      
        const user= await User.findById(req.user.id);
        if(!user){
            return next(new HttpError("User not found",403))
        }
        // make surenew email does not already exist
        const emailExist = await User.findOne({email});
        if(emailExist && (emailExist._id != req.user.id)){
            return next(new HttpError("Email already exist",422))
        }
        // compare current password to db password
        const validUserPassword = await bcrypt.compare(currentPassword, user.password)
        if(!validUserPassword){
            return next(new HttpError("Invalid current password",422))
        }

        // compare new passwoRD
    if(newPassword !== confirmNewPassword){
        return next(new HttpError("New password do not match",422))
    }
    // hash new password
    const salt = await bcrypt.genSalt(10)
    const hash =await bcrypt.hash(newPassword, salt)

    // update user infi in db
    const newInfo = await User.findByIdAndUpdate(req.user.id, {name, email, password: hash}, {new:true})
    res.status(200).json(newInfo)
    } catch (error) {
        return next(new HttpError(error))
    }
}


















// ============================GET AUTHORS============================ //
// POST: api/users/authors
// UNPROTECTED
const getAuthors = async (req, res, next) => {
    try {
        const authors = await User.find().select('-password');
        res.json(authors);
    } catch (error) {
        return next(new HttpError(error))
    }
}

module.exports = { registerUser, loginUser, getUser, changeAvatar, editUser, getAuthors };