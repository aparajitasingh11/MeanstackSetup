"use strict";

/*
 * Purpose : For User Rest Api
 * Package : Users
 * Company : Mobiweb Technology Pvt. Ltd.
 * Developed By  : Sorav Garg
 */

 module.exports = function(app, apiRouter, database, jwt, constant) {
    /* Load custom modules */
    /* var jwtOld = require('express-jwt');
    var jwt = require('jsonwebtoken');*/
    var appRoot = require('app-root-path'),
    async = require('async'),
    model = require(appRoot + '/lib/model.js'),
    notification = require(appRoot + '/lib/notification.js'),
    custom = require(appRoot + '/lib/custom.js'),
    constant = require(appRoot + '/config/constant.js'),
    helper = require(appRoot + '/lib/helper.js'),
    dateTime = require(appRoot + '/lib/datetime.js'),
    db = require(appRoot + '/lib/database.js'),
    mail = require(appRoot + '/lib/mail.js'),
    queryBuilder = require(appRoot + '/lib/query-builder.js').QueryBuilder();
    var fileUpload = require('express-fileupload');
    /*apiRouter.use(fileUpload());*/
    apiRouter.use(fileUpload({
        limits: {
            fileSize: 50 * 1024 * 1024
        },
    }));

    /*For signup*/
    apiRouter.post('/register', function(req, res) {
        var deviceType = req.body.deviceType;
        var deviceToken = req.body.deviceToken;
        var deviceId = req.body.deviceId;
        var appVersion = req.body.appVersion;
        var fullName = req.body.fullName;
        var userType = req.body.userType;
        var email = req.body.email;
        var password = req.body.password;
        var gender = req.body.gender;
        var contactNumber = req.body.contactNumber;
        var city = req.body.cityId;
        var userType = req.body.userType;
        var lawyerSpecializationId = req.body.lawyerSpecializationId;
        var lawyerDescription = req.body.lawyerDescription;
        var imagePath = "";
        if (userType == 0) {
            var lawyer = 0
        } else if (userType == 1) {
            var lawyer = lawyerSpecializationId;
            req.check('lawyerSpecializationId', 'Enter your lawyer specialization id').notEmpty();
            var lawyerServices = new Array();
            lawyerServices = (!req.body.lawyerSpecializationId) ? new Array() : req.body.lawyerSpecializationId;
            if (lawyerServices) {
                lawyerServices = (typeof lawyerServices === 'string') ? JSON.parse(lawyerServices) : lawyerServices;
            }
            if (req.files) {
                var file = req.files.file;
                console.log("file ", file);
                var originalfile = file.name;
                var ext = originalfile.split('.').pop();
                var fileName = custom.generateRandomString("RESUME") + '.' + ext;
                /* var pathToUpload = constant.BASE_URL + 'uploads/resume/' + fileName;*/
                var pathToUpload ='uploads/resume/' + fileName;
                var path = appRoot + '/uploads/resume/' + fileName;
                imagePath = pathToUpload;
                file.mv(path, function(err) {
                    console.log("resume uploading Failed error ", err);
                    if (err)
                        res.send({
                            "code": 200,
                            "status": 0,
                            "message": constant.RESUME_UPLOAD_ERR
                        });

                });
            }
        }
        /*Manage validations*/
        req.check('deviceType', 'Enter device type').notEmpty();
        req.check('deviceToken', 'Enter device token').notEmpty();
        req.check('deviceId', 'Enter device id').notEmpty();
        req.check('appVersion', 'Enter app version').notEmpty();
        req.check('userType', 'Enter your userType').notEmpty();
        req.check('fullName', 'Enter fullName').notEmpty();
        req.check('email', 'Enter your email').notEmpty();
        req.check('password', 'Enter your password').notEmpty();
        req.check('password', 'The password field must contain at least 6 characters, including UPPER/lower case & numbers & at-least a special character').matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/, "i");
        req.check('contactNumber', 'Enter your contact number').notEmpty();
        req.check('cityId', 'Enter your cityId').notEmpty();
        var errors = req.validationErrors();
        if (errors) {
            res.send({
                "code": 200,
                "status": 0,
                "message": custom.manageValidationMessages(errors)
            });
        } else {
            var checkIfUserExists = 'SELECT * FROM users WHERE email ="' + email + '"';;
            database.getConn(checkIfUserExists, function(err, getData) {
                if (err) {
                    res.send({
                        "code": 200,
                        "status": 0,
                        "message": err.sqlMessage
                    });
                    return false;
                } else {
                    if (getData.length > 0) {
                        res.send({
                            "code": 200,
                            "status": 0,
                            "message": constant.EMAIL_ALREADY_EXISTS
                        });
                    } else {
                        let getTempCode = custom.generateRandomNo();
                        if (!lawyerDescription) {
                            lawyerDescription = "";
                        }
                        var addUser = "Insert INTO users (fullName,userType,email,password,imagePath,cityId,contactNumber,lawyerDescription,tempCode) VALUES('" + fullName + "','" + userType + "','" + email + "','" + password + "','" + imagePath + "','" + city + "','" + contactNumber + "','" + lawyerDescription + "','" + getTempCode + "')";
                        console.log("add user query ", addUser);
                        database.getConn(addUser, function(err, result) {
                            if (err) {
                                res.send({
                                    "code": 200,
                                    "status": 0,
                                    "message": err.sqlMessage
                                });
                                return false;
                            } else {
                                if (result.affectedRows > 0) {
                                    let userId = result.insertId;
                                    async.waterfall([
                                        function(callback) {
                                            if (userType == 1) {
                                                var lawyerServiceArr = [];
                                                for (var i = 0; i < lawyerServices.length; i++) {
                                                    var dataObj = {};
                                                    dataObj.userId = userId;
                                                    dataObj.lawyerSpecializationId = lawyerServices[i];
                                                    lawyerServiceArr.push(dataObj);
                                                }
                                                model.insertBulkData(function(err, lawyerServiceRes) {
                                                    if (err) {
                                                        res.send(db.dbErrorResponse());
                                                        return false;
                                                    } else if (lawyerServiceRes.affectedRows > 0) {
                                                        callback(null, result)
                                                    } else {
                                                        res.send({
                                                            "code": 200,
                                                            "status": 0,
                                                            "message": constant.ADD_LAWYER_SERVICE_ERR
                                                        });
                                                    }
                                                }, "specializations", lawyerServiceArr);
                                            } else {
                                                callback(null, result)
                                            }
                                        }
                                        ], function(err, result) {
                                            /*Generate token using JWT*/
                                            var token = jwt.sign({
                                                userId: result.insertId
                                            }, app.get('superSecret'), {
                                            expiresIn: 86400 //24 hours
                                        });
                                            var updateLoginSessionKey = "UPDATE users SET loginSessionKey = '" + token + "' where userId='" + userId + "'";
                                            database.getConn(updateLoginSessionKey, function(err, tokenRes) {
                                                if (err) {
                                                    res.send({
                                                        "code": 200,
                                                        "status": 0,
                                                        "message": err.sqlMessage
                                                    });
                                                    return false;
                                                } else {
                                                    /*To check device id present or not */
                                                    let checkUserDeviceque = "SELECT * FROM userDevice WHERE deviceId = '" + deviceId + "'";
                                                    database.getConn(checkUserDeviceque, function(err, userDeviceRes) {
                                                        if (err) {
                                                            res.send({
                                                                "code": 200,
                                                                "status": 0,
                                                                "message": err.sqlMessage
                                                            });
                                                            return false;
                                                        } else {
                                                            if (userDeviceRes.length > 0) {
                                                                var addUserDeviceInfo = "UPDATE userDevice SET userId = " + userId + " ,deviceToken='" + deviceToken + "',deviceType='" + deviceType + "',appVersion='" + appVersion + "' where userId='" + userId + "'";
                                                            } else {
                                                                var addUserDeviceInfo = "INSERT INTO userDevice (userId,deviceType,deviceToken,deviceId,appVersion) VALUES ('" + userId + "','" + deviceType + "','" + deviceToken + "','" + deviceId + "','" + appVersion + "')";
                                                            }
                                                            database.getConn(addUserDeviceInfo, function(err, addUserDeviceRes) {
                                                                if (err) {
                                                                    res.send({
                                                                        "code": 200,
                                                                        "status": 0,
                                                                        "message": err.sqlMessage
                                                                    });
                                                                    return false;
                                                                } else {
                                                                    /*Send Veirifaction code*/
                                                                    var reqData = {};
                                                                    reqData.to_email = email;
                                                                    reqData.subject = "Verify Email!";
                                                                    reqData.message = helper.verificationMailMsg(fullName, getTempCode);
                                                                    mail.sendEmail(reqData.to_email, reqData.subject, reqData.message, function(respType) {

                                                                    });
                                                                    res.send({
                                                                        "code": 200,
                                                                        "response": {
                                                                            "loginSessionKey": token
                                                                        },
                                                                        "status": 2,
                                                                        "message": constant.USER_REGISTERED
                                                                    });
                                                                }

                                                            });
                                                        }
                                                    });

                                                }
                                            });
});
}
                            } //else ends
                        });
}
}
});
}
});



apiRouter.post('/upload-file', function(req, res) {
    console.log("req.files  ", req.files);
    if (!req.files)
        return res.status(400).send('No files were uploaded!');
    let file = req.files.file;

    /*For multiple file uploading */
    for (var i = 0; i < file.length; i++) {
        console.log("file array ", file[i]);
        var randomNo = Math.floor((Math.random() * 100000) + 1);
        var fileName = file[i].name + randomNo;
        var pathToUpload = constant.BASE_URL + 'uploads/resume/' + fileName;
        var path = appRoot + '/uploads/resume/' + fileName;
        console.log("pathToUpload ", pathToUpload);
        file[i].mv(path, function(err) {
            if (err)
                return res.status(500).send(err);
            res.send('File uploaded!');
        });
    }

    /*For single file uploading*/
        /* let file = req.files.file;
         var randomNo = Math.floor((Math.random() * 100000) + 1);
         var fileName = file.name + randomNo;
         var pathToUpload = constant.BASE_URL + 'uploads/resume/' + fileName;
         var path = appRoot + '/uploads/resume/' + fileName;
         console.log("pathToUpload ", pathToUpload);
         file.mv(path, function(err) {
             if (err)
                 return res.status(500).send(err);
             res.send('File uploaded!');
         });*/
     });


    /*
        To verify account
        @param {string} tempCode
        @param {string} email
        */
        apiRouter.post('/verify-account', function(req, res) {
            var tempCode = req.body.tempCode;
            var loginSessionKey = req.body.loginSessionKey;
            /*Validate input values*/
            req.check('tempCode', 'The User verification code is required').notEmpty();
            req.check('loginSessionKey', 'The loginSessionKey is required').notEmpty();
            let errors = req.validationErrors();
            if (errors) {
                res.send({
                    "code": 200,
                    "status": 0,
                    "message": custom.manageValidationMessages(errors)
                });
            } else {
                async.waterfall([
                    function(callback) {
                        var user_query = 'SELECT * FROM users WHERE tempCode="' + tempCode + '"';
                        console.log("user_query ", user_query);
                        database.getConn(user_query, function(err, results) {
                            if (err) {
                                res.send({
                                    "code": 200,
                                    "status": 0,
                                    "message": err.sqlMessage
                                });
                            } else {
                                if (results.length > 0) {
                                    callback(null, results);
                                } else {
                                    res.send({
                                        "code": 200,
                                        "status": 0,
                                        "message": constant.INVALID_CODE
                                    });
                                }
                            }
                        });
                    }
                    ], function(err, code_results) {
                        /*Update User Status*/
                        let update_query = 'UPDATE users SET isAccountVerified = 1, tempCode = NULL WHERE userId = ' + code_results[0].userId;
                        database.getConn(update_query, function(err, rows) {
                            if (err) {
                                res.send({
                                    "code": 200,
                                    "status": 0,
                                    "message": err.sqlMessage
                                });
                                return false;
                            } else {
                                /* Return user response */
                                var getUserDetail = 'SELECT * FROM users WHERE userId = "' + code_results[0].userId + '"';
                                database.getConn(getUserDetail, function(err, userInfo) {
                                    if (err) {
                                        res.send({
                                            "code": 200,
                                            "status": 0,
                                            "message": err.sqlMessage
                                        });
                                    } else {
                                        var userArr = [];
                                        for (var i = 0; i < userInfo.length; i++) {
                                            var userObj = {};
                                            userObj.userId = userInfo[i].userId;
                                            userObj.userType = userInfo[i].userType;
                                            userObj.fullName = userInfo[i].fullName;
                                            userObj.email = userInfo[i].email;
                                            userObj.password = userInfo[i].password;
                                            userObj.contactNumber = custom.nullChecker(userInfo[i].contactNumber);
                                            userObj.imagePath = custom.nullChecker(userInfo[i].imagePath);
                                            userObj.loginSessionKey = custom.nullChecker(userInfo[i].loginSessionKey);
                                            userObj.createdDate = dateTime.changeDateFormat(userInfo[i].createdDate);
                                            userArr.push(userObj);
                                        }
                                        res.send({
                                            "code": 200,
                                            "response": userArr[0],
                                            "status": 1,
                                            "message": constant.USER_VERIFIED
                                        });
                                        return false;
                                    }

                                })

                            }
                        });
                    });
}
});


/*Resend verification code*/
apiRouter.post('/resend-verification-code', function(req, res) {
    var email = req.body.email;
    req.check('email', 'Email id is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        async.waterfall([
            function(callback) {
                /* Get user details */
                model.getAllWhere(function(err, resp) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else {
                        if (resp.length > 0) {
                            if (resp[0].isAccountVerified == 1) {
                                res.send({
                                    "code": 405,
                                    "status": 2,
                                    "message": constant.ALREADY_VERIFIED
                                });
                            } else if (resp[0].accountStatus == 0) {
                                res.send({
                                    "code": 405,
                                    "status": 3,
                                    "message": constant.ACCOUNT_INACTIVE
                                });
                            } else if (resp[0].accountStatus == 2) {
                                res.send({
                                    "code": 405,
                                    "status": 4,
                                    "message": constant.ACCOUNT_BLOCKED
                                });
                            } else if (resp[0].accountStatus == 3) {
                                res.send({
                                    "code": 405,
                                    "status": 5,
                                    "message": constant.ACCOUNT_CLOSED
                                });
                            } else {
                                callback(null, resp);
                            }
                        } else {
                            res.send({
                                "code": 200,
                                "status": 0,
                                "message": constant.INVALID_EMAIL
                            });
                            return false;
                        }
                    }
                }, "users", {
                    email: email
                });
            },
            function(results, callback) {
                let getTempCode = custom.generateRandomNo();
                /* Update user details */
                var dataObj = {};
                dataObj.tempCode = getTempCode;
                model.updateData(function(err, resp) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else {
                        callback(null, results, getTempCode, results[0].email);
                    }
                }, "users", dataObj, {
                    userId: results[0].userId
                });
            }
            ], function(err, results, getTempCode, email) {
                /* Send verification email to user */
                let siteName = constant.site_name;
                let mailData = {};
                mailData.to_email = email;
                mailData.subject = "Resend Verification Code";
                mailData.message = helper.verificationMailMsg(results[0].fullName, getTempCode);
                mail.sendEmail(mailData.to_email, mailData.subject, mailData.message, function(err, resp) {
                    if (err) {
                        res.send(mail.mailErrorResponse());
                        return false;
                    } else {
                        res.send({
                            "code": 200,
                            "status": 2,
                            "message": constant.RESEND_VERIFICATION_CODE
                        });
                        return false;
                    }
                });
            });
    }
});


/*Forgot password*/
apiRouter.post('/forgot-password', function(req, res) {
    var loginSessionKey = "";
    var email = req.body.email;
    req.check('email', 'Email id is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        async.waterfall([
            function(callback) {
                /* Get user email id */
                model.getAllWhere(function(err, resp) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else {
                        if (resp.length > 0) {
                            callback(null, resp, resp[0].userId);
                        } else {
                            res.send({
                                "code": 200,
                                "status": 0,
                                "message": constant.EMAIL_NOT_EXIST
                            });
                            return false;
                        }
                    }
                }, "users", {
                    email: email
                });
            },
            function(results, masterUserId, callback) {
                loginSessionKey = results[0].loginSessionKey;
                /* Get user details */
                model.getAllWhere(function(err, resp) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else {
                        if (resp.length > 0) {
                            if (resp[0].accountStatus == 0) {
                                res.send({
                                    "code": 405,
                                    "status": 3,
                                    "message": constant.ACCOUNT_INACTIVE
                                });
                                return false;
                            } else if (resp[0].accountStatus == 2) {
                                res.send({
                                    "code": 405,
                                    "status": 4,
                                    "message": constant.ACCOUNT_BLOCKED
                                });
                                return false;
                            } else if (resp[0].accountStatus == 3) {
                                res.send({
                                    "code": 405,
                                    "status": 5,
                                    "message": constant.ACCOUNT_CLOSED
                                });
                            } else {
                                let getTempCode = custom.generateRandomNo(6);

                                /* Update user details */
                                var dataObj = {};
                                dataObj.tempCode = getTempCode;
                                model.updateData(function(err, update_resp) {
                                    if (err) {
                                        res.send(db.dbErrorResponse());
                                        return false;
                                    } else {
                                        callback(null, resp[0].email, resp[0].fullName, results[0].email, results[0].userId, getTempCode);
                                    }
                                }, "users", dataObj, {
                                    userId: resp[0].userId
                                });
                            }
                        } else {
                            res.send({
                                "code": 200,
                                "status": 0,
                                "message": constant.USER_NOT_FOUND
                            });
                            return false;
                        }
                    }
                }, "users", {
                    userId: masterUserId
                });
            }
            ], function(err, useremail, userFirstName, email, masterUserId, getTempCode) {
                /* Send temporary code on user email id */
                let siteName = constant.SITE_NAME;
                let forgotPasswordMsg = mail.forgotPasswordMsg(userFirstName, getTempCode);
                let mailData = {};
                mailData.to_email = email;
                mailData.subject = "Forgot Password";
                mailData.message = forgotPasswordMsg;
                mail.sendEmail(mailData.to_email, mailData.subject, mailData.message, function(err, resp) {
                    if (err) {
                        res.send(mail.mailErrorResponse());
                        return false;
                    } else {
                        res.send({
                            "code": 200,
                            "response": {
                                email: useremail,
                                loginSessionKey: loginSessionKey
                            },
                            "status": 1,
                            "message": constant.RESET_PASSWORD
                        });
                        return false;
                    }
                });
            });
}
});


/*Reset password*/
apiRouter.post('/reset-password', function(req, res) {
    var newPassword = req.body.newPassword;
    var confirmPassword = req.body.confirmPassword;
    var tempCode = req.body.tempCode;
    /*Manage validation*/
    req.check('tempCode', 'Enter verification code!').notEmpty();
    req.check('newPassword', 'Enter new password').notEmpty();
    req.check('newPassword', 'The new password field must contain at least 6 characters, including UPPER/lower case & numbers & at-least a special character').matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/, "i");
    req.check('confirmPassword', 'Confirm your password').notEmpty();
    req.check('confirmPassword', 'The confirm password field must contain at least 6 characters, including UPPER/lower case & numbers & at-least a special character').matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/, "i");
    req.check('confirmPassword', 'New password & confirm password must be match!').equals(req.body.newPassword);
    let errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        async.waterfall([
            function(callback) {
                /* Get user details */
                model.getAllWhere(function(err, results) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else {
                        if (results.length > 0) {
                            if (results[0].accountStatus == 0) {
                                res.send({
                                    "code": 405,
                                    "status": 3,
                                    "message": constant.ACCOUNT_INACTIVE
                                });
                            } else if (results[0].accountStatus == 2) {
                                res.send({
                                    "code": 405,
                                    "status": 4,
                                    "message": constant.ACCOUNT_BLOCKED
                                });
                            } else if (results[0].accountStatus == 3) {
                                res.send({
                                    "code": 405,
                                    "status": 5,
                                    "message": constant.ACCOUNT_CLOSED
                                });
                                return false;
                            }
                            if (results[0].isAccountVerified == 0) {
                                let code = 405;
                                let status = 1;
                                callback(null, results, results[0].userId, results[0].loginSessionKey, code, status);
                                return false;
                            } else {
                                let code = 200;
                                let status = 1;
                                callback(null, results, results[0].userId, results[0].loginSessionKey, code, status);
                            }
                        } else {
                            res.send({
                                "code": 200,
                                "status": 0,
                                "message": constant.INVALID_CODE
                            });
                            return false;
                        }
                    }
                }, 'users', {
                    tempCode: tempCode
                });
            }
            ], function(err, results, userId, loginSessionKey, code, status, msg) {
                /* Update user details */
                var dataObj = {};
                /*dataObj.password = custom.getMd5Value(newPassword);*/
                if (code == 200) {
                    dataObj.password = newPassword;
                } else {
                    dataObj.isAccountVerified = 1;
                    dataObj.password = newPassword;
                }
                model.updateData(function(err, update_resp) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else {
                        res.send({
                            "code": code,
                            "response": {
                                loginSessionKey: loginSessionKey
                            },
                            "status": status,
                            "message": constant.CHANGE_PASSWORD
                        });
                    }
                }, "users", dataObj, {
                    userId: userId
                });
            });
    }
});


/*For user signin*/
apiRouter.post('/login', function(req, res) {
    var email = req.body.email;
    var password = req.body.password;
    var deviceType = req.body.deviceType;
    var password = req.body.password;
    var deviceId = req.body.deviceId;
    var deviceToken = req.body.deviceToken;
    var appVersion = req.body.appVersion;
    /*Manage all validations */
    req.check('email', 'Enter your email').notEmpty();
    req.check('email', 'Enter a valid email').isEmail();
    req.check('password', 'Enter password').notEmpty();
    req.check('deviceToken', 'The user device token field is required').notEmpty();
    req.check('deviceType', 'The user device type field is required').notEmpty();
    req.check('deviceType', 'The user device type field must be one of ANDROID,IOS').inList(['ANDROID', 'IOS']);
    req.check('deviceId', 'The user device id field is required').notEmpty();
    req.check('appVersion', 'Enter appVersion').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
            //let password = custom.getMd5Value(req.sanitize('password').escape().trim());
            //Check User Email Id and Password 
            async.waterfall([
                function(callback) {
                    var getUserQuery = 'SELECT * FROM users WHERE email="' + email + '" AND password = "' + password + '" ';
                    database.getConn(getUserQuery, function(err, results) {
                        if (err) {
                            res.send({
                                "code": 200,
                                "status": 0,
                                "message": err.sqlMessage
                            });
                        } else {
                            if (parseInt(results.length) != 0) {
                                callback(null, results);
                            } else {
                                res.send({
                                    "code": 200,
                                    "status": 0,
                                    "message": constant.INCORRECT_LOGIN
                                });
                            }
                        }
                    });
                },
                function(results, callback) {
                    // To get master user id /
                    var userId = parseInt(results[0].userId);
                    var user_details_query = 'SELECT * FROM users WHERE userId=' + userId;
                    database.getConn(user_details_query, function(err, detail_results) {
                        if (err) {
                            res.send({
                                "code": 200,
                                "status": 0,
                                "message": err.sqlMessage
                            });
                        } else {
                            if (parseInt(detail_results.length) != 0) {
                                callback(null, results, detail_results, userId);
                            } else {
                                res.send({
                                    "code": 200,
                                    "status": 0,
                                    "message": constant.GENERAL_ERROR
                                });
                            }
                        }
                    });
                },
                function(results, detail_results, userId, callback) {
                    if (detail_results[0].isAccountVerified == 0) {
                        let status = 2;
                        let code = 405;
                        let msg = constant.VERIFY_EMAIL;
                        callback(null, results, detail_results, status, code, msg);
                    } else if (detail_results[0].accountStatus == 0) {
                        res.send({
                            "code": 405,
                            "status": 3,
                            "message": constant.ACCOUNT_INACTIVE
                        });
                    } else if (detail_results[0].accountStatus == 2) {
                        res.send({
                            "code": 405,
                            "status": 4,
                            "message": constant.ACCOUNT_BLOCKED
                        });
                    } else if (detail_results[0].accountStatus == 3) {
                        res.send({
                            "code": 405,
                            "status": 5,
                            "message": constant.ACCOUNT_CLOSED
                        });
                    } else {
                        let status = 1;
                        let code = 200;
                        let msg = constant.LOGIN_SUCCESS
                        callback(null, results, detail_results, status, code, msg);
                    }
                }
                ], function(err, results, detail_results, status, code, msg) {
                    var userId = parseInt(results[0].userId);
                    var userType = results[0].userType;
                    let user_device_select_query = "SELECT * FROM userDevice WHERE deviceId = '" + deviceId + "'";
                    database.getConn(user_device_select_query, function(err, userDeviceRes) {
                        if (err) {
                            res.send({
                                "code": 200,
                                "status": 0,
                                "message": err.sqlMessage
                            });
                        } else {
                            if (userDeviceRes.length > 0) {
                                var user_device_query = "UPDATE userDevice SET userId='" + userId + "' , deviceToken='" + deviceToken + "' ,deviceType='" + deviceType + "',appVersion='" + appVersion + "' where deviceId='" + deviceId + "'";
                            } else {
                                var user_device_query = "INSERT INTO userDevice (userId,deviceToken,deviceType,deviceId,appVersion) VALUES ('" + userId + "','" + deviceToken + "','" + deviceType + "','" + deviceId + "','" + appVersion + "')";
                            }
                            database.getConn(user_device_query, function(err, userDeviceUpdt) {
                                if (err) {
                                    res.send({
                                        "code": 200,
                                        "status": 0,
                                        "message": err.sqlMessage
                                    });
                                } else if (userDeviceUpdt.affectedRows > 0) {
                                    /*Generate token using JWT*/
                                    var token = jwt.sign({
                                        userId: userId
                                    }, app.get('superSecret'), {
                                        expiresIn: 86400
                                    });
                                    let updateLoginSessionKey = "UPDATE users SET loginSessionKey = '" + token + "' WHERE email ='" + email + "'";
                                    database.getConn(updateLoginSessionKey, function(err, userUpdt) {
                                        if (err) {
                                            res.send({
                                                "code": 200,
                                                "status": 0,
                                                "message": err.sqlMessage
                                            });
                                        } else if (userUpdt.affectedRows > 0) {
                                            res.send({
                                                "code": code,
                                                "response": {
                                                    "userId": userId,
                                                    "userType": userType,
                                                    "loginSessionKey": token
                                                },
                                                "status": status,
                                                "message": msg
                                            });
                                        }
                                    });
                                } else {
                                    res.send({
                                        "code": code,
                                        "response": {
                                            "loginSessionKey": token
                                        },
                                        "status": status,
                                        "message": msg
                                    });
                                }
                            });

                        }
                    });

                });
}
})


/*User profile details*/
apiRouter.post('/get-user-profile', function(req, res) {
    var loginSessionKey = req.body.loginSessionKey;
    var userId = req.userId;
    req.check('loginSessionKey', 'Enter your loginSessionKey').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        var getUserQuery = "SELECT c.cityName, CONCAT('[',GROUP_CONCAT(CONCAT('{\"lawyerSpecializationId\":\"', s.lawyerSpecializationId, '\", \"serviceTitle\":\"',ls.title,'\"}')),']') AS lawyerServices, u.* FROM users u LEFT JOIN cities c ON u.cityId = c.cityId LEFT JOIN specializations s ON s.userId=u.userId LEFT JOIN lawyerSpecializations ls ON ls.lawyerSpecializationId = s.lawyerSpecializationId WHERE u.userId = '" + userId + "' GROUP BY u.email";
        console.log("getUserQuery ", getUserQuery);
        database.getConn(getUserQuery, function(err, userRes) {
            if (err) {
                res.send({
                    "code": 200,
                    "status": 0,
                    "message": err.sqlMessage
                });
            } else {
                if (parseInt(userRes.length) > 0) {
                    var userArr = [];
                    for (var i = 0; i < userRes.length; i++) {
                        var userObj = {}
                        userObj.userId = userRes[i].userId;
                        userObj.fullName = custom.nullChecker(userRes[i].fullName);
                        userObj.contactNumber = custom.nullChecker(userRes[i].contactNumber);
                        userObj.email = userRes[i].email;
                        userObj.userType = userRes[i].userType;
                        userObj.gender = custom.nullChecker(userRes[i].gender);
                        /*userObj.imagePath = custom.nullChecker(userRes[i].imagePath);*/

                        userObj.imagePath = custom.nullChecker(constant.BASE_URL+userRes[i].imagePath);

                        userObj.address = custom.nullChecker(userRes[i].address);
                        userObj.cityId = custom.nullChecker(userRes[i].cityId);
                        userObj.cityName = custom.nullChecker(userRes[i].cityName);
                        if (userRes[i].userType == 1) {
                            if (userRes[i].lawyerServices) {
                                userObj.lawyerServices = JSON.parse(userRes[i].lawyerServices);
                            } else {
                                userObj.lawyerServices = [];
                            }
                            userObj.lawyerSpecializationId = custom.nullChecker(userRes[i].lawyerSpecializationId);
                            /* userObj.lawyerService = custom.nullChecker(userRes[i].lawyerService);*/
                            userObj.lawyerRatings = userRes[i].lawyerRatings;
                            userObj.lawyerDescription = custom.nullChecker(userRes[i].lawyerDescription);
                            userObj.lawyerExperience = custom.nullChecker(userRes[i].lawyerExperience);
                        }
                        userObj.loginSessionKey = custom.nullChecker(userRes[i].loginSessionKey);
                        userObj.createdDate = dateTime.changeDateFormat(userRes[i].createdDate);
                        userArr.push(userObj);
                    }
                    res.send({
                        "code": 200,
                        "response": userArr[0],
                        "status": 1,
                        "message": constant.USER_FOUND
                    });
                } else {
                    res.send({
                        "code": 200,
                        "status": 7,
                        "message": constant.NO_DATA
                    });
                }
            }
        });
    }
})


/*Update user profile details*/
apiRouter.post('/update-user-profile', function(req, res) {
    var cityId = req.body.cityId;
    var userIdReq = req.userId;
    var userType = req.body.userType;
    var fullName = req.body.fullName;
    var loginSessionKey = req.body.loginSessionKey;
    var contactNumber = req.body.contactNumber;
    var password = req.body.password;
    var lawyerSpecializationId = req.body.lawyerSpecializationId;
    var lawyerDescription = req.body.lawyerDescription;
    var lawyerExperience = req.body.lawyerExperience;
    req.check('loginSessionKey', 'Enter your loginSessionKey').notEmpty();
    req.check('fullName', 'Enter your full name').notEmpty();
    req.check('userType', 'Enter user type').notEmpty();
    req.check('contactNumber', 'Enter your contact number').notEmpty();
    req.check('cityId', 'Enter your city id ').notEmpty();
    if (password) {
        req.check('password', 'Password field must contain at least 6 characters, including UPPER, lower case & numbers & at-least a special character').matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/, "i");
    }
    if (userType == 1) {
       req.check('lawyerSpecializationId', 'Enter your lawyerSpecializationId').notEmpty();
       req.check('lawyerExperience', 'Enter lawyer experience').notEmpty();
       var lawyerServices = new Array();
       lawyerServices = (!req.body.lawyerSpecializationId) ? new Array() : req.body.lawyerSpecializationId;
       if (lawyerServices) {
        lawyerServices = (typeof lawyerServices === 'string') ? JSON.parse(lawyerServices) : lawyerServices;
    }
}
var errors = req.validationErrors();
if (errors) {
    res.send({
        "code": 200,
        "status": 0,
        "message": custom.manageValidationMessages(errors)
    });
} else {
    /* check unique user */
    var checkUser = 'SELECT * FROM users WHERE userId = "' + userIdReq + '"';
    database.getConn(checkUser, function(err, rows) {
        if (err) {
            res.send({
                "code": 200,
                "status": 0,
                "message": err.sqlMessage
            });
            return false;
        } else {
            if (rows.length > 0) {
                var userId = rows[0].userId;
                var password = rows[0].password;
                var loginSessionKey = rows[0].loginSessionKey;
                var password = (!req.body.password) ? password : req.sanitize('password').trim();
                async.waterfall([
                    function(callback) {
                        if (!lawyerDescription) {
                            lawyerDescription = "";
                        }
                        if (!lawyerExperience) {
                            lawyerExperience = "";
                        }
                        /*password = custom.getMd5Value(req.sanitize('password').escape().trim());*/
                        let updateProfile = "UPDATE  users SET fullName =" + '"' + fullName + '"' + ",contactNumber='" + contactNumber + "',cityId='" + cityId + "',password='" + password + "',lawyerDescription='" + lawyerDescription + "',lawyerExperience='" + lawyerExperience + "' WHERE userId ='" + userIdReq + "'";
                        database.getConn(updateProfile, function(err, updateUserRes) {
                            if (err) {
                                res.send({
                                    "code": 200,
                                    "status": 0,
                                    "message": err.sqlMessage
                                });
                            } else {
                                if (updateUserRes.affectedRows > 0) {
                                    if (userType == 1) {
                                        callback(null, userId, loginSessionKey);
                                    } else {
                                        res.send({
                                            "code": 200,
                                            "response": {
                                                "userId": userId,
                                                "loginSessionKey": loginSessionKey
                                            },
                                            "status": 1,
                                            "message": constant.USER_UPDATED
                                        });
                                    }
                                } else {
                                    res.send({
                                        "code": 200,
                                        "status": 0,
                                        "message": constant.USER_UPDATED_ERR
                                    });
                                }
                            }
                        });
                    }
                    ], function(err, userId, loginSessionKey) {
                        /* Update user details */
                        var lawyerServicesArr = [];
                        for (var i = 0; i < lawyerServices.length; i++) {
                            var dataObj = {};
                            dataObj.userId = userId;
                            dataObj.lawyerSpecializationId = lawyerServices[i];
                            lawyerServicesArr.push(dataObj);
                        }
                        var deleteLawyerService = "DELETE FROM `specializations` WHERE userId=" + userId + "";
                        database.getConn(deleteLawyerService, function(err, lawyerServiceRes) {
                            if (err) {
                                res.send({
                                    "code": 200,
                                    "status": 0,
                                    "message": err.sqlMessage
                                });
                            } else if (lawyerServiceRes.affectedRows > 0) {
                                model.insertBulkData(function(err, update_resp) {
                                    if (err) {
                                        res.send(db.dbErrorResponse());
                                        return false;
                                    } else {
                                        res.send({
                                            "code": 200,
                                            "response": {
                                                "userId": userId,
                                                "loginSessionKey": loginSessionKey
                                            },
                                            "status": 1,
                                            "message": constant.USER_UPDATED
                                        });
                                    }
                                }, "specializations", lawyerServicesArr);
                            } else {
                                res.send({
                                    "code": 200,
                                    "status": 0,
                                    "message": constant.USER_UPDATED_ERR
                                });
                            }
                        });

                    });
} else {
    res.send({
        "code": 200,
        "status": 7,
        "message": constant.NO_DATA
    });
}
}
});
}
});

/*Change password*/
apiRouter.post('/change-password', function(req, res) {
    var loginSessionKey = req.body.loginSessionKey;
    var currentPassowrd = req.body.currentPassword;
    var newPassword = req.body.newPassword;
    var confirmPassword = req.body.confirmPassword;
    var userIdReq=req.userId;
    console.log("userIdReq ",userIdReq);
    /*Manage validation*/
    req.check('loginSessionKey', 'The User login session key field is required').notEmpty();
    req.check('confirmPassword', 'Enter confirm password!').notEmpty();
    req.check('newPassword', 'Enter new password').notEmpty();
    req.check('newPassword', 'The new password field must contain at least 6 characters, including UPPER/lower case & numbers & at-least a special character').matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/, "i");
    req.check('confirmPassword', 'Confirm your password').notEmpty();
    req.check('confirmPassword', 'The confirm password field must contain at least 6 characters, including UPPER/lower case & numbers & at-least a special character').matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/, "i");
    req.check('confirmPassword', 'New password & confirm password must be match!').equals(req.body.newPassword);
    let errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        async.waterfall([
            function(callback) {
                /* Get user details */
                model.getAllWhere(function(err, results) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else {
                        if (results.length > 0) {
                            var userPassword = results[0].password;
                            if (userPassword == currentPassowrd) {
                                callback(null, results, results[0].userId, results[0].loginSessionKey);
                            } else {
                                res.send({
                                    "code": 200,
                                    "status": 0,
                                    "message": constant.INCORRECT_CURRENT_PASSWORD
                                });
                            }
                        } else {
                            res.send({
                                "code": 200,
                                "status": 0,
                                "message": constant.INVALID_LOGIN_SESSION_KEY
                            });
                            return false;
                        }
                    }
                }, 'users', {
                    userId: userIdReq
                });
            }
            ], function(err, results, userId, loginSessionKey) {
                /* Update user details */
                var dataObj = {};
                dataObj.password = newPassword;
                model.updateData(function(err, update_resp) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else {
                        res.send({
                            "code": 200,
                            "response": {
                                loginSessionKey: loginSessionKey
                            },
                            "status": 1,
                            "message": constant.CHANGE_PASSWORD
                        });
                    }
                }, "users", dataObj, {
                    userId: userId
                });
            });
    }
});

/*Block user*/
apiRouter.post('/block-user', function(req, res) {
    var userId = req.body.userId;
    req.check('userId', 'Enter your userId').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        var getUserQuery = 'SELECT * FROM users WHERE userId="' + userId + '"';
        database.getConn(getUserQuery, function(err, userRes) {
            if (err) {
                res.send({
                    "code": 200,
                    "status": 0,
                    "message": err.sqlMessage
                });
            } else {
                if (parseInt(userRes.length) > 0) {
                    var acStatus = userRes[0].accountStatus;
                    if (acStatus == 2) {
                        acStatus = 1;
                    } else {
                        acStatus = 2;
                    }
                    let updateUserStatus = "UPDATE  users SET accountStatus =" + acStatus + " WHERE userId ='" + userId + "'";
                    database.getConn(updateUserStatus, function(err, userBlockRes) {
                        if (err) {
                            res.send({
                                "code": 200,
                                "status": 0,
                                "message": err.sqlMessage
                            });
                        } else {
                            res.send({
                                "code": 200,
                                "status": 1,
                                "message": constant.USER_BLOCKED
                            });
                        }
                    });
                } else {
                    res.send({
                        "code": 200,
                        "status": 7,
                        "message": constant.NO_DATA
                    });
                }
            }
        });
    }
})


/*logout*/
apiRouter.post('/logout', function(req, res) {
    var deviceId = req.body.deviceId;
    /*Validate input values*/
    req.check('deviceId', 'Device id is required').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        async.waterfall([
            function(callback) {
                var userDevice = 'SELECT * FROM userDevice WHERE deviceId="' + deviceId + '"';
                console.log("logout userDevice ", userDevice);
                database.getConn(userDevice, function(err, results) {
                    if (err) {
                        res.send({
                            "code": 200,
                            "status": 0,
                            "message": err.sqlMessage
                        });
                    } else {
                        if (results.length > 0) {
                            callback(null, results);
                        } else {
                            res.send({
                                "code": 200,
                                "status": 0,
                                "message": constant.NO_DATA
                            });
                        }
                    }
                });
            }
            ], function(err, code_results) {
                /*Update User Status*/
                let deleteQuery = 'Delete from userDevice WHERE deviceId = "' + code_results[0].deviceId + '"';
                database.getConn(deleteQuery, function(err, rows) {
                    if (err) {
                        res.send({
                            "code": 200,
                            "status": 0,
                            "message": err.sqlMessage
                        });
                        return false;
                    } else {
                        res.send({
                            "code": 200,
                            "status": 1,
                            "message": constant.LOGOUT
                        });

                    }
                });
            });
    }
});


/*Add city for admin use*/
apiRouter.post('/add-city', function(req, res) {
    var cityName = req.body.cityName;
    var cityDescription = req.body.cityDescription;
    req.check('cityName', 'Enter your city').notEmpty();
    req.check('cityDescription', 'Enter your city description').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        var addCityQuery = "Insert INTO cities (cityName,cityDescription) VALUES('" + cityName + "','" + cityDescription + "')";
        database.getConn(addCityQuery, function(err, cityRes) {
            if (err) {
                res.send({
                    "code": 200,
                    "status": 0,
                    "message": err.sqlMessage
                });
            } else {
                if (parseInt(cityRes.affectedRows) > 0) {
                    res.send({
                        "code": 200,
                        "status": 1,
                        "message": constant.CITY_ADDED
                    });
                } else {
                    res.send({
                        "code": 200,
                        "status": 0,
                        "message": constant.CITY_ADDED_ERR
                    });
                }
            }
        });
    }
});

/*Add case*/
apiRouter.post('/add-case', function(req, res) {
    var caseId = req.body.caseId;
    var assignedLawyerId = req.body.assignedLawyerId;
    var deleteFileIds = req.body.deleteFileIds;
    var deleteFilesArr = (!req.body.deleteFileIds) ? new Array() : req.body.deleteFileIds;
    if (deleteFilesArr) {
        deleteFilesArr = (typeof deleteFilesArr === 'string') ? JSON.parse(deleteFilesArr) : deleteFilesArr;
    }
    console.log("deleteFilesArr ", deleteFilesArr, typeof deleteFilesArr);
    /*Case id,deleteFileId & assignedLawyerId will be optional, we need this only in case of update*/
    var caseTitle = req.body.caseTitle;
    var typeOfLawyerService = req.body.lawyerSpecializationId;
    var caseDescription = req.body.caseDescription;
    var caseStatus = req.body.caseStatus;
    var loginSessionKey = req.body.loginSessionKey;
    console.log("caseStatus ", caseStatus);
    /*Manage validation*/
    req.check('caseTitle', 'Enter your case title').notEmpty();
    req.check('lawyerSpecializationId', 'Enter your lawyer specialization id').notEmpty();
    req.check('caseDescription', 'Enter your case description').notEmpty();
    req.check('caseStatus', 'Enter your case status').notEmpty();
    req.check('loginSessionKey', 'Enter your loginSessionKey').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        jwt.verify(loginSessionKey, app.get('superSecret'), function(err, decoded) {
            if (err) {
                res.send({
                    "code": 407,
                    "status": 6,
                    "message": "Failed to authenticate token!"
                });
            } else {
                /*If everything is good, save to request for use in other routes*/
                req.decoded = decoded;
                var userIdReq = decoded.userId;
                var getUserInfo = "SELECT * FROM `users` WHERE userId='" + userIdReq + "'";
                database.getConn(getUserInfo, function(err, userRes) {
                    if (err) {
                        res.send({
                            "code": 200,
                            "status": 0,
                            "message": err.sqlMessage
                        });
                    } else {
                        if (userRes.length > 0) {
                            var userId = userRes[0].userId;
                            /*For uploading files*/
                            var attachFileArr = [];
                            console.log("req.files ", req.files);
                            if (req.files) {
                                var file = req.files.attachFile;
                                console.log("check file type ", Array.isArray(file));
                                if (Array.isArray(file) == true) {
                                    for (var i = 0; i < file.length; i++) {
                                        var fileObj = {};
                                        var originalfile = file[i].name;
                                        var fileId = custom.generateRandomString("CASEFILEID")
                                        var ext = originalfile.split('.').pop();
                                        var fileName = custom.generateRandomString("CASEFILE") + '.' + ext;
                                        /* var pathToUpload = constant.BASE_URL + '/uploads/cases/' + fileName;*/

                                        var pathToUpload = '/uploads/cases/' + fileName;

                                        fileObj.attachFile = pathToUpload;
                                        fileObj.fileId = fileId;
                                        attachFileArr.push(fileObj);
                                        var path = appRoot + '/uploads/cases/' + fileName;
                                        file[i].mv(path, function(err) {
                                            if (err)
                                                res.send({
                                                    "code": 200,
                                                    "status": 0,
                                                    "message": constant.FILE_UPLOAD_ERR
                                                });
                                        });
                                    }
                                } else {
                                    var fileObj = {};
                                    var originalfile = file.name;
                                    var fileId = custom.generateRandomString("CASEFILEID")
                                    var ext = originalfile.split('.').pop();
                                    var fileName = custom.generateRandomString("CASEFILE") + '.' + ext;
                                    /*var pathToUpload = constant.BASE_URL + '/uploads/cases/' + fileName;*/
                                    var pathToUpload = '/uploads/cases/' + fileName;
                                    fileObj.attachFile = pathToUpload;
                                    fileObj.fileId = fileId;
                                    attachFileArr.push(fileObj);
                                    var path = appRoot + '/uploads/cases/' + fileName;
                                    file.mv(path, function(err) {
                                        if (err)
                                            res.send({
                                                "code": 200,
                                                "status": 0,
                                                "message": constant.FILE_UPLOAD_ERR
                                            });
                                    });
                                }
                            }
                            var uniqueCaseId = custom.generateRandomString("CASE");
                            model.getAllWhere(function(err, caseResult) {
                                if (err) {
                                    res.send(db.dbErrorResponse());
                                    return false;
                                } else {
                                    if (caseResult.length > 0) {
                                        console.log("new uploaded attachFileArr ", attachFileArr);
                                        var whereObj = {};
                                        whereObj.caseId = caseId;
                                        var storedFiles = caseResult[0].attachFile;
                                        storedFiles = (typeof storedFiles === 'string') ? JSON.parse(storedFiles) : storedFiles;
                                        if (storedFiles) {
                                            if (deleteFilesArr.length > 0) {
                                                for (var j = 0; j < deleteFilesArr.length; j++) {
                                                    var deleteFileId = deleteFilesArr[j];
                                                    custom.removeByValue(storedFiles, deleteFileId);
                                                }
                                                console.log("storedFiles  ", storedFiles);
                                                Array.prototype.push.apply(attachFileArr, storedFiles)
                                            } else {
                                                Array.prototype.push.apply(attachFileArr, storedFiles)
                                            }
                                        } else {
                                            Array.prototype.push.apply(attachFileArr, [])
                                        }

                                        var lawyerSpecializationIdNew = (!typeOfLawyerService) ? caseResult[0].lawyerSpecializationId : typeOfLawyerService;
                                        var caseTitleNew = (!caseTitle) ? caseResult[0].caseTitle : caseTitle;
                                        var caseDescriptionNew = (!caseDescription) ? caseResult[0].caseDescription : caseDescription;
                                        var assignedLawyerIdNew = (!assignedLawyerId) ? caseResult[0].assignedLawyerId : assignedLawyerId;

                                        var dataObj = {};
                                        dataObj.lawyerSpecializationId = lawyerSpecializationIdNew;
                                        dataObj.caseTitle = caseTitleNew;
                                        dataObj.caseStatus = caseStatus;
                                        dataObj.caseDescription = caseDescriptionNew;
                                        dataObj.assignedLawyerId = assignedLawyerIdNew;
                                        dataObj.uniqueCaseId = uniqueCaseId;
                                        dataObj.userId = userId;
                                        dataObj.attachFile = JSON.stringify(attachFileArr);
                                        model.updateData(function(err, resp) {
                                            if (err) {
                                                res.send(db.dbErrorResponse());
                                                return false;
                                            } else {
                                                if (resp.affectedRows > 0) {
                                                    res.send({
                                                        "code": 200,
                                                        "status": 1,
                                                        "message": constant.CASE_UPDATED
                                                    });
                                                } else {
                                                    res.send({
                                                        "code": 200,
                                                        "status": 0,
                                                        "message": constant.CASE_UPDATED_ERR
                                                    });
                                                }
                                            }
                                        }, "cases", dataObj, whereObj);
                                    } else {
                                        /*Calling insert function in model library*/
                                        var dataObj = {};
                                        dataObj.userId = userId;
                                        dataObj.uniqueCaseId = uniqueCaseId;
                                        dataObj.caseTitle = caseTitle;
                                        dataObj.lawyerSpecializationId = typeOfLawyerService;
                                        dataObj.caseDescription = caseDescription;
                                        dataObj.attachFile = JSON.stringify(attachFileArr);
                                        dataObj.caseStatus = caseStatus;
                                        model.insertData(function(err, resp) {
                                            if (err) {
                                                return res.send(db.dbErrorResponse());
                                            } else {
                                                if (resp.affectedRows > 0) {
                                                    return res.send({
                                                        "code": 200,
                                                        "status": 1,
                                                        "message": constant.ADD_CASE
                                                    });
                                                } else {
                                                    return res.send({
                                                        "code": 200,
                                                        "status": 0,
                                                        "message": constant.ADD_CASE_ERR
                                                    });
                                                }

                                            }
                                        }, "cases", dataObj);
                                    }
                                }
                            }, "cases", {
                                caseId: caseId
                            });

} else {
    res.send({
        "code": 200,
        "status": 7,
        "message": constant.NO_DATA
    });
}
}
});
}
});


}
});

apiRouter.post('/add-case-old', function(req, res) {
    var caseTitle = req.body.caseTitle;
    var typeOfLawyerService = req.body.lawyerSpecializationId;
    var caseDescription = req.body.caseDescription;
    var caseStatus = req.body.caseStatus;
    var loginSessionKey = req.body.loginSessionKey;
    /*Manage validation*/
    req.check('caseTitle', 'Enter your case title').notEmpty();
    req.check('lawyerSpecializationId', 'Enter your lawyer specialization id').notEmpty();
    req.check('caseDescription', 'Enter your case description').notEmpty();
    req.check('caseStatus', 'Enter your case status').notEmpty();
    req.check('loginSessionKey', 'Enter your loginSessionKey').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        jwt.verify(loginSessionKey, app.get('superSecret'), function(err, decoded) {
            if (err) {
                res.send({
                    "code": 407,
                    "status": 6,
                    "message": "Failed to authenticate token!"
                });
            } else {
                /*If everything is good, save to request for use in other routes*/
                req.decoded = decoded;
                var getUserInfo = "SELECT * FROM `users` WHERE userId='" + userIdReq + "'";
                database.getConn(getUserInfo, function(err, userRes) {
                    if (err) {
                        res.send({
                            "code": 200,
                            "status": 0,
                            "message": err.sqlMessage
                        });
                    } else {
                        if (userRes.length > 0) {
                            var attachFileArr = [];
                            if (req.files) {
                                var file = req.files.attachFile;
                                for (var i = 0; i < file.length; i++) {
                                    var fileObj = {};
                                    var originalfile = file[i].name;
                                    var ext = originalfile.split('.').pop();
                                    var fileName = custom.generateRandomString("CASEFILE") + '.' + ext;
                                    var pathToUpload = constant.BASE_URL + 'uploads/cases/' + fileName;
                                    fileObj.attachFile = pathToUpload;
                                    attachFileArr.push(fileObj);
                                    var path = appRoot + '/uploads/cases/' + fileName;
                                    file[i].mv(path, function(err) {
                                        if (err)
                                            res.send({
                                                "code": 200,
                                                "status": 0,
                                                "message": constant.FILE_UPLOAD_ERR
                                            });
                                    });
                                }
                            }
                            /* var uniqueCaseId="ORDER"+custom.generateRandomString();*/
                            var uniqueCaseId = custom.generateRandomString("CASE");
                            var addCaseQuery = "Insert INTO cases (userId,uniqueCaseId,caseTitle,lawyerSpecializationId,caseDescription,attachFile,caseStatus) VALUES('" + userRes[0].userId + "','" + uniqueCaseId + "','" + caseTitle + "','" + typeOfLawyerService + "','" + caseDescription + "','" + JSON.stringify(attachFileArr) + "','" + caseStatus + "')";
                            console.log("addCaseQuery ", addCaseQuery);
                            database.getConn(addCaseQuery, function(err, caseRes) {
                                if (err) {
                                    res.send({
                                        "code": 200,
                                        "status": 0,
                                        "message": err.sqlMessage
                                    });
                                } else {
                                    if (parseInt(caseRes.affectedRows) > 0) {
                                        res.send({
                                            "code": 200,
                                            "status": 1,
                                            "message": constant.ADD_CASE
                                        });
                                    } else {
                                        res.send({
                                            "code": 200,
                                            "status": 0,
                                            "message": constant.ADD_CASE_ERR
                                        });
                                    }
                                }
                            });
                        } else {
                            res.send({
                                "code": 200,
                                "status": 7,
                                "message": constant.NO_DATA
                            });
                        }
                    }
                });
            }
        });
}
});

/*Get all case list*/
apiRouter.post('/get-case-list', function(req, res) {
    var getCases = 'SELECT * FROM cases';
    database.getConn(getCases, function(err, casesRes) {
        if (err) {
            res.send({
                "code": 200,
                "status": 0,
                "message": err.sqlMessage
            });
        } else {
            if (parseInt(casesRes.length) > 0) {
                res.send({
                    "code": 200,
                    "response": casesRes,
                    "status": 1,
                    "message": constant.GET_ALL_CASE
                });
            } else {
                res.send({
                    "code": 200,
                    "status": 7,
                    "message": constant.NO_DATA
                });
            }
        }
    });
})

/*Lawyer service list*/
apiRouter.post('/get-service-list', function(req, res) {
    var getServices = 'SELECT * FROM lawyerSpecializations';
    database.getConn(getServices, function(err, serviceRes) {
        if (err) {
            res.send({
                "code": 200,
                "status": 0,
                "message": err.sqlMessage
            });
        } else {
            if (parseInt(serviceRes.length) > 0) {
                var serviceArr = [];
                for (var i = 0; i < serviceRes.length; i++) {
                    var serviceObj = {};
                    serviceObj.lawyerSpecializationId = serviceRes[i].lawyerSpecializationId;
                    serviceObj.title = custom.nullChecker(serviceRes[i].title);
                    serviceObj.description = custom.nullChecker(serviceRes[i].description);
                    serviceObj.createdDate = dateTime.changeDateFormat(serviceRes[i].createdDate);
                    serviceArr.push(serviceObj)
                }
                res.send({
                    "code": 200,
                    "response": serviceArr,
                    "status": 1,
                    "message": constant.LAWYER_SERVICE_FOUND
                });
            } else {
                res.send({
                    "code": 200,
                    "status": 7,
                    "message": constant.NO_DATA
                });
            }
        }
    });
})


/*Get city list*/
apiRouter.post('/get-city-list', function(req, res) {
    var getCities = 'SELECT * FROM cities';
    database.getConn(getCities, function(err, citiesRes) {
        if (err) {
            res.send({
                "code": 200,
                "status": 0,
                "message": err.sqlMessage
            });
        } else {
            if (parseInt(citiesRes.length) > 0) {
                var cityArr = [];
                for (var i = 0; i < citiesRes.length; i++) {
                    var cityObj = {};
                    cityObj.cityId = citiesRes[i].cityId;
                    cityObj.cityName = citiesRes[i].cityName;
                    cityObj.cityDescription = custom.nullChecker(citiesRes[i].cityDescription);
                    cityObj.createdDate = dateTime.changeDateFormat(citiesRes[i].createdDate);
                    cityArr.push(cityObj)
                }
                res.send({
                    "code": 200,
                    "response": cityArr,
                    "status": 1,
                    "message": constant.CITIES_FOUND
                });
            } else {
                res.send({
                    "code": 200,
                    "status": 7,
                    "message": constant.NO_DATA
                });
            }
        }
    });
})

/*Get case details*/

apiRouter.post('/get-case-details', function(req, res) {
    var caseId = req.body.caseId;
    var userId = req.userId;
    console.log("case details ip uid ", userId);
    req.check('caseId', 'Enter your caseId').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        async.waterfall([
            function(callback) {
                model.getAllWhere(function(err, results) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else if (results.length > 0) {
                        var userType = results[0].userType;
                        callback(null, userType);
                    } else {
                        res.send({
                            "code": 200,
                            "status": 7,
                            "message": constant.NO_DATA
                        });
                    }
                }, "users", {
                    userId: userId
                });
            },
            function(userType, callback) {
                model.getAllWhere(function(err, caseResults) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else if (caseResults.length > 0) {
                        var caseStatus = caseResults[0].caseStatus;
                        var assignedLawyerId = caseResults[0].assignedLawyerId;
                        callback(null, userType, caseStatus, assignedLawyerId);
                    } else {
                        res.send({
                            "code": 200,
                            "status": 7,
                            "message": constant.NO_DATA
                        });
                    }
                }, "cases", {
                    caseId: caseId
                });
            },
            function(userType, caseStatus, assignedLawyerId, callback) {
                console.log("userTyp 3rd callback ", userType, "caseStatus ", caseStatus);
                /*Update under review status=4*/
                var dataObj = {};
                dataObj.caseStatus = 4;
                if (caseStatus == 1) {
                    model.updateData(function(err, resp) {
                        if (err) {
                            res.send(db.dbErrorResponse());
                            return false;
                        } else if (resp.affectedRows > 0) {
                            callback(null, userType, assignedLawyerId);
                        } else {
                            res.send({
                                "code": 200,
                                "status": 0,
                                "message": constant.UNDER_REVIEW_ERR
                            });
                        }
                    }, "cases", dataObj, {
                        caseId: caseId
                    });
                } else {
                    callback(null, userType, assignedLawyerId);
                }
            },
            function(userType, assignedLawyerId, callback) {
                var getSolvedCases = "  SELECT SUM(IF(caseStatus=7 AND assignedLawyerId=" + assignedLawyerId + ",1,0)) As solvedCases FROM `cases`";
                console.log("getSolvedCases ", getSolvedCases);
                model.customQuery(function(err, solvedCasesRes) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else if (solvedCasesRes.length > 0) {
                        callback(null, userType, assignedLawyerId, solvedCasesRes[0].solvedCases);
                    } else {
                        callback(null, userType, assignedLawyerId, solvedCasesRes[0].solvedCases);
                    }
                }, getSolvedCases);
            }
            ], function(err, userType, assignedLawyerId, solvedCases) {
                console.log("4th callback res assignedLawyerId ", assignedLawyerId, "solvedCases ", solvedCases);
                if (userType == 0) {
                    var getCaseDetails = "SELECT u.fullName AS clientName,u.email AS clientEmail,u.contactNumber AS clientContactNumber,ul.fullName As lawyerName,ul.email As lawyerEmail,ul.contactNumber As lawyerContactNumber,ul.lawyerExperience As lawyerExperience,ul.lawyerDescription As lawyerDescription,ul.lawyerRatings As avgLawyerRatings, CONCAT('[',GROUP_CONCAT(CONCAT('{\"lawyerSpecializationId\":\"',s.lawyerSpecializationId,'\",\"serviceTitle\":\"', ls.title, '\"}' ) ), ']' ) AS lawyerServices, ls.title AS caseType, ct.cityId, ct.cityName,cr.acceptedPercent As clientAcceptedPercent,cr.requestActionDate,COUNT(cr.caseId) AS requestCount,IF(c.userId = c.userId, 'true', 'false') AS isOwner, c.* FROM cases c LEFT JOIN users u ON u.userId = c.userId LEFT JOIN users ul ON ul.userId = c.assignedLawyerId LEFT JOIN caseRequest cr ON cr.caseId = c.caseId LEFT JOIN cities ct ON ct.cityId=u.cityId LEFT JOIN specializations s ON s.userId = c.assignedLawyerId LEFT JOIN lawyerSpecializations ls ON ls.lawyerSpecializationId = c.lawyerSpecializationId WHERE c.caseId = " + caseId + " ORDER BY c.caseId DESC";
                } else {
                    var getCaseDetails = "SELECT u.fullName AS clientName,u.email AS clientEmail,u.contactNumber AS clientContactNumber,   ul.fullName As lawyerName,ul.email As lawyerEmail,ul.contactNumber As lawyerContactNumber,ul.lawyerExperience As lawyerExperience,ul.lawyerRatings As avgLawyerRatings,  CONCAT('[',GROUP_CONCAT(CONCAT('{\"lawyerSpecializationId\":\"',s.lawyerSpecializationId,'\", \"serviceTitle\":\"', ls.title, '\"}' ) ), ']' ) AS lawyerServices, ls.title AS caseType, ct.cityId, ct.cityName,cr.acceptedPercent As clientAcceptedPercent,cr.requestActionDate,COUNT(cr.caseId) AS requestCount, IF(cr.lawyerId =" + userId + ", 'true', 'false')  AS isRequested,IF(c.userId =" + userId + ", 'true', 'false')  AS isOwner,  c.* FROM cases c LEFT JOIN users u ON u.userId = c.userId LEFT JOIN users ul ON ul.userId = c.assignedLawyerId LEFT JOIN caseRequest cr ON cr.caseId = c.caseId AND cr.lawyerId=" + userId + " LEFT JOIN cities ct ON ct.cityId=u.cityId LEFT JOIN specializations s ON s.userId = " + userId + " LEFT JOIN lawyerSpecializations ls ON ls.lawyerSpecializationId = c.lawyerSpecializationId WHERE c.caseId = " + caseId + " ORDER BY c.caseId DESC";
                }
                console.log("getCaseDetails ", getCaseDetails);
                database.getConn(getCaseDetails, function(err, caseRes) {
                    if (err) {
                        res.send({
                            "code": 200,
                            "status": 0,
                            "message": err.sqlMessage
                        });
                    } else {
                        if (parseInt(caseRes.length) > 0) {
                            var caseArr = [];
                            for (var i = 0; i < caseRes.length; i++) {
                                var caseObj = {};
                                var clientObj = {};
                                caseObj.caseId = caseRes[i].caseId;
                                caseObj.uniqueCaseId = caseRes[i].uniqueCaseId;
                                caseObj.userId = caseRes[i].userId;

                                caseObj.acceptedPercent = custom.nullChecker(caseRes[i].clientAcceptedPercent);
                                /*Client obj*/
                                clientObj.clientName = custom.nullChecker(caseRes[i].clientName);
                                clientObj.clientEmail = custom.nullChecker(caseRes[i].clientEmail);
                                clientObj.clientContactNumber = custom.nullChecker(caseRes[i].clientContactNumber);
                                clientObj.cityId = caseRes[i].cityId;
                                clientObj.cityName = custom.nullChecker(caseRes[i].cityName);
                                caseObj.clientDetails = clientObj;
                                if (assignedLawyerId) {
                                    var lawyerObj = {};
                                    lawyerObj.lawyerName = custom.nullChecker(caseRes[i].lawyerName);
                                    lawyerObj.lawyerEmail = custom.nullChecker(caseRes[i].lawyerEmail);
                                    lawyerObj.lawyerDescription = custom.nullChecker(caseRes[i].lawyerDescription);
                                    lawyerObj.lawyerContactNumber = custom.nullChecker(caseRes[i].lawyerContactNumber);
                                    lawyerObj.lawyerExperience = custom.nullChecker(caseRes[i].lawyerExperience);
                                    lawyerObj.lawyerRatings = custom.nullChecker(caseRes[i].avgLawyerRatings);
                                    lawyerObj.solvedCases = custom.nullChecker(solvedCases);
                                    var lawyerService = caseRes[i].lawyerServices;
                                    if (lawyerService) {
                                        lawyerObj.lawyerServices = JSON.parse(lawyerService);
                                    } else {
                                        lawyerObj.lawyerServices = [];
                                    }
                                    caseObj.lawyerDetails = lawyerObj;
                                }
                                caseObj.lawyerSpecializationId = custom.nullChecker(caseRes[i].lawyerSpecializationId);
                                caseObj.assignedLawyerId = custom.nullChecker(caseRes[i].assignedLawyerId);
                                caseObj.caseType = custom.nullChecker(caseRes[i].caseType);
                                if (caseRes[i].isOwner == "true") {
                                    caseObj.isOwner = true;
                                } else {
                                    caseObj.isOwner = false;
                                }
                                if (userType == 1) {
                                    if (caseRes[i].isRequested == "true") {
                                        caseObj.isRequested = true;
                                    } else {
                                        caseObj.isRequested = false;
                                    }
                                }
                                caseObj.requestActionDate = dateTime.changeDateFormat(caseRes[i].requestActionDate);
                                caseObj.requestCount = caseRes[i].requestCount;

                                caseObj.caseTitle = custom.nullChecker(caseRes[i].caseTitle);
                                caseObj.caseDescription = custom.nullChecker(caseRes[i].caseDescription);
                                var filesArr = caseRes[i].attachFile;
                                if (!filesArr) {
                                    caseObj.attachFile = [];
                                } else {
                                    filesArr = (typeof filesArr === 'string') ? JSON.parse(filesArr) : filesArr;
                                    /* caseObj.attachFile = filesArr;*/
                                    var newFileArr=[];
                                    for (var j = 0; j < filesArr.length; j++) {
                                        var newFileObj={};
                                        newFileObj.attachFile= constant.BASE_URL+filesArr[j].attachFile;
                                        newFileObj.fileId=filesArr[j].fileId
                                    }
                                    newFileArr.push(newFileObj);
                                    caseObj.attachFile = newFileArr
                                }
                                caseObj.lawyerRatings = custom.nullChecker(caseRes[i].avgLawyerRatings);
                                caseObj.caseStatus = caseRes[i].caseStatus;
                                caseObj.acceptedDate = dateTime.changeDateFormat(caseRes[i].acceptedDate);
                                caseObj.solvedDate = dateTime.changeDateFormat(caseRes[i].solvedDate);
                                caseObj.createdDate = dateTime.changeDateFormat(caseRes[i].createdDate);
                                caseArr.push(caseObj);
                            }
                            res.send({
                                "code": 200,
                                "response": caseArr[0],
                                "status": 1,
                                "message": constant.GET_CASE_DETAILS
                            });
                        } else {
                            res.send({
                                "code": 200,
                                "status": 7,
                                "message": constant.NO_DATA
                            });
                        }
                    }
                });

});
}
})



/*Get case list of user by case type*/
apiRouter.post('/get-cases', function(req, res) {
    var loginSessionKey = req.body.loginSessionKey;
    var caseType = req.body.caseType;
    var pageNo = parseInt(req.body.pageNo);
    var userIdReq = req.userId;
    console.log("userIdReq get-cases ", userIdReq, "caseType ", caseType);
    req.check('loginSessionKey', 'Enter your loginSessionKey').notEmpty();
    req.check('caseType', 'Enter your case type').notEmpty();
    req.check('pageNo', 'Page number is required').notEmpty();
    req.check('pageNo', 'Page number minimum value should be 1').minValue(1);
    var errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        var query = "";
        if (caseType == "open") {
            query = ' AND (c.caseStatus ="0" OR c.caseStatus ="1" OR c.caseStatus ="2" OR c.caseStatus ="3" OR c.caseStatus ="4" OR c.caseStatus ="6")';
        } else if (caseType == "received") {
            query = ' AND (c.caseStatus ="1" OR c.caseStatus ="4")';
        } else if (caseType == "accepted") {
            query = ' AND (c.caseStatus ="2" OR c.caseStatus ="6")';
        } else if (caseType == "solved") {
            query = ' AND c.caseStatus ="7"';
        }
        var getUserInfo = "SELECT * FROM users WHERE userId='" + userIdReq + "'";
        database.getConn(getUserInfo, function(err, userRes) {
            if (err) {
                res.send({
                    "code": 200,
                    "status": 0,
                    "message": err.sqlMessage
                });
            } else {
                if (parseInt(userRes.length) > 0) {
                    let offset = custom.getOffset(pageNo);
                    var userType = userRes[0].userType;
                    var userId = userRes[0].userId;
                    console.log("userType ", userType, "userId ",userId);
                    async.waterfall([
                        function(callback) {
                            if (userType == 0) {
                                /*UserType 0 ie client*/
                                console.log("userType is client  ", userType);
                                var getCaseByCaseType = 'SELECT ls.title AS caseType, ul.fullName AS lawyerName, ul.email AS lawyerEmail, ul.contactNumber AS lawyerContactNumber,ul.lawyerDescription AS lawyerDescription, ul.email AS lawyerEmail,  u.fullName AS clientName,u.email AS clientEmail,u.contactNumber AS clientContactNumber,u.lawyerDescription AS clientDescription, u.email AS clientEmail,ct.cityId,cr.acceptedPercent AS clientAcceptedPercent, ct.cityName,COUNT(cr.caseId) AS requestCount, IF(c.userId = "' + userId + '", "true", "false") AS isOwner, c.* FROM cases c LEFT JOIN lawyerSpecializations ls ON ls.lawyerSpecializationId = c.lawyerSpecializationId LEFT JOIN users u ON u.userId = c.userId LEFT JOIN users ul ON u.userId = c.assignedLawyerId LEFT JOIN caseRequest cr ON cr.caseId = c.caseId LEFT JOIN cities ct ON ct.cityId=u.cityId WHERE c.userId = "' + userId + '" ' + query + ' GROUP BY c.caseId ORDER BY c.createdDate DESC LIMIT 10 OFFSET ' + offset;

                                /*  var getCaseByCaseType = 'SELECT ls.title AS caseType, u.fullName AS lawyerName, u.email AS lawyerEmail, u.contactNumber AS lawyerContactNumber,u.lawyerDescription AS lawyerDescription, u.email AS lawyerEmail, ct.cityId,cr.acceptedPercent AS clientAcceptedPercent, ct.cityName,COUNT(cr.caseId) AS requestCount, IF(c.userId = "' + userId + '", "true", "false") AS isOwner, c.* FROM cases c LEFT JOIN lawyerSpecializations ls ON ls.lawyerSpecializationId = c.lawyerSpecializationId LEFT JOIN users u ON u.userId = c.assignedLawyerId LEFT JOIN caseRequest cr ON cr.caseId = c.caseId LEFT JOIN cities ct ON ct.cityId=u.cityId WHERE c.userId = "' + userId + '" ' + query + ' GROUP BY c.caseId ORDER BY c.createdDate DESC LIMIT 10 OFFSET ' + offset;*/
                                callback(null, getCaseByCaseType);
                            } else if (userType == 1) {
                                /*userType 1 ie lawyer*/
                                console.log("userType is lawyer  ", userType);
                                model.getAllWhere(function(err, skipResults) {
                                    if (err) {
                                        res.send(db.dbErrorResponse());
                                        return false;
                                    } else {
                                        var skipCaseArr = [];
                                        for (var i = 0; i < skipResults.length; i++) {
                                            var skipCaseId = skipResults[i].caseId;
                                            skipCaseArr.push(skipCaseId);
                                        }
                                        if (skipCaseArr.length > 0) {
                                            var skipCases = 'AND c.caseId NOT IN (' + skipCaseArr.toString() + ')';
                                        } else {
                                            var skipCases = "";
                                        }
                                        /*callback(null, skipCaseArr);*/
                                        if (caseType == "received") {
                                            model.getAllWhere(function(err, results) {
                                                if (err) {
                                                    res.send(db.dbErrorResponse());
                                                    return false;
                                                } else {
                                                    var lawyerServiceArr = [];
                                                    for (var i = 0; i < results.length; i++) {
                                                        var lawyerSpecializationId = results[i].lawyerSpecializationId;
                                                        lawyerServiceArr.push(lawyerSpecializationId);
                                                    }
                                                    var getLawyerService = 'SELECT s.userId, c.caseId, c.lawyerSpecializationId, c.uniqueCaseId,IF(c.userId = "' + userId + '", "true", "false") AS isOwner,IF(cr.lawyerId = "' + userId + '","true","false") AS isRequested,COUNT(cr.caseId) AS requestCount,cr.acceptedPercent AS clientAcceptedPercent, c.caseTitle, c.caseDescription,c.attachFile, c.caseStatus, c.acceptedDate, c.solvedDate, c.createdDate, u.fullName AS clientName, u.contactNumber AS clientContactNumber, u.email AS clientEmail,ct.cityId,ct.cityName,ls.title AS caseType FROM cases c LEFT JOIN specializations s ON s.lawyerSpecializationId IN(' + lawyerServiceArr.toString() + ') JOIN users u ON u.userId = c.userId LEFT JOIN caseRequest cr ON cr.caseId = c.caseId AND cr.lawyerId="' + userId + '" LEFT JOIN skippedCases sc ON sc.caseId = c.caseId LEFT JOIN cities ct ON ct.cityId = u.cityId JOIN lawyerSpecializations ls ON ls.lawyerSpecializationId = c.lawyerSpecializationId WHERE  s.userId = ' + userId + ' ' + skipCases + ' AND (c.caseStatus = 1 OR c.caseStatus=4) AND ls.lawyerSpecializationId IN(' + lawyerServiceArr.toString() + ') GROUP BY c.caseId ORDER BY c.createdDate DESC  LIMIT 10 OFFSET ' + offset;
                                                    callback(null, getLawyerService);
                                                }
                                            }, "specializations", {
                                                userId: userId
                                            });
                                        } else {
                                            console.log("else case type is accepted or solved");
                                            var getCaseByCaseType = 'SELECT u.fullName AS clientName,u.email AS clientEmail,u.cityId AS cityId, ls.title AS caseType,cr.acceptedPercent AS clientAcceptedPercent, ct.cityId,ct.cityName,COUNT(cr.caseId) AS requestCount,IF(c.userId = "' + userId + '", "true", "false") AS isOwner,  IF(cr.lawyerId = "' + userId + '","true","false") AS isRequested, c.* FROM cases c LEFT JOIN users u ON u.userId = c.userId LEFT JOIN caseRequest cr ON cr.caseId = c.caseId AND cr.lawyerId="' + userId + '" LEFT JOIN cities ct ON ct.cityId = u.cityId LEFT JOIN lawyerSpecializations ls ON c.lawyerSpecializationId=ls.lawyerSpecializationId WHERE c.assignedLawyerId = "' + userId + '" ' + skipCases + ' ' +query + ' GROUP BY c.caseId ORDER BY c.createdDate DESC LIMIT 10 OFFSET ' + offset;
                                            callback(null, getCaseByCaseType);
                                        }
                                    }
                                }, "skippedCases", {
                                    lawyerId: userId
                                });


}
},
], function(err, getQuery) {
    console.log("get Cases new changes  ", getQuery);
    database.getConn(getQuery, function(err, caseRes) {
        if (err) {
            res.send({
                "code": 200,
                "status": 0,
                "message": err.sqlMessage
            });
        } else {
            if (parseInt(caseRes.length) > 0) {
                var caseArr = [];
                console.log("caseRes.length ",caseRes.length);
                for (var i = 0; i < caseRes.length; i++) {
                    var caseObj = {};
                    var lawyerObj = {};
                    var clientObj = {};
                    if (userType == 0) {
                        if (caseRes[i].assignedLawyerId) {
                            lawyerObj.lawyerName = custom.nullChecker(caseRes[i].lawyerName);
                            lawyerObj.lawyerEmail = custom.nullChecker(caseRes[i].lawyerEmail);
                            lawyerObj.lawyerDescription = custom.nullChecker(caseRes[i].lawyerDescription);
                            lawyerObj.lawyerContactNumber = custom.nullChecker(caseRes[i].lawyerContactNumber);
                            lawyerObj.assignedLawyerId = custom.nullChecker(caseRes[i].assignedLawyerId);
                            lawyerObj.lawyerRatings = caseRes[i].lawyerRatings;
                            lawyerObj.cityId = caseRes[i].cityId;
                            lawyerObj.cityName = custom.nullChecker(caseRes[i].cityName);
                            caseObj.lawyerDetails = lawyerObj;
                        }
                    }
                    if (userType == 1) {
                        clientObj.clientName = custom.nullChecker(caseRes[i].clientName);
                        clientObj.clientEmail = caseRes[i].clientEmail;
                        clientObj.clientContactNumber = custom.nullChecker(caseRes[i].clientContactNumber);
                        clientObj.cityId = caseRes[i].cityId;
                        clientObj.cityName = custom.nullChecker(caseRes[i].cityName);
                        caseObj.clientDetails = clientObj;
                        if (caseRes[i].isRequested == "true") {
                            caseObj.isRequested = true;
                        } else {
                            caseObj.isRequested = false;
                        }
                    }
                    caseObj.requestCount = caseRes[i].requestCount;
                    caseObj.acceptedPercent = custom.nullChecker(caseRes[i].clientAcceptedPercent);
                    caseObj.lawyerSpecializationId = custom.nullChecker(caseRes[i].lawyerSpecializationId);
                    caseObj.caseId = caseRes[i].caseId;
                    caseObj.uniqueCaseId = custom.nullChecker(caseRes[i].uniqueCaseId);
                    caseObj.userId = caseRes[i].userId;
                    caseObj.caseType = custom.nullChecker(caseRes[i].caseType);
                    caseObj.caseTitle = custom.nullChecker(caseRes[i].caseTitle);
                    caseObj.caseDescription = custom.nullChecker(caseRes[i].caseDescription);
                    if (caseRes[i].isOwner == "true") {
                        caseObj.isOwner = true;
                    } else {
                        caseObj.isOwner = false;
                    }
                    var filesArr = caseRes[i].attachFile;
                    if (!filesArr) {
                        caseObj.attachFile = [];
                    } else {
                        filesArr = (typeof filesArr === 'string') ? JSON.parse(filesArr) : filesArr;
                        /*caseObj.attachFile = filesArr*/
                        console.log("filesArr length ",filesArr.length);

                        var newFileArr=[];
                        for (var j = 0; j < filesArr.length; j++) {
                            var newFileObj={};
                            newFileObj.attachFile=constant.BASE_URL+filesArr[j].attachFile;
                            newFileObj.fileId=filesArr[j].fileId;
                            newFileArr.push(newFileObj);
                        }
                        caseObj.attachFile = newFileArr;

                    }
                    caseObj.caseStatus = caseRes[i].caseStatus;
                    caseObj.acceptedDate = dateTime.changeDateFormat(caseRes[i].acceptedDate);
                    caseObj.solvedDate = dateTime.changeDateFormat(caseRes[i].solvedDate);
                    caseObj.createdDate = dateTime.changeDateFormat(caseRes[i].createdDate);
                    caseArr.push(caseObj)
                }
                res.send({
                    "code": 200,
                    "response": caseArr,
                    "status": 1,
                    "message": constant.GET_CASE_LIST
                });
            } else {
                res.send({
                    "code": 200,
                    "status": 7,
                    "message": constant.NO_DATA
                });
            }
        }
    });
});

} else {
    res.send({
        "code": 200,
        "status": 7,
        "message": constant.NO_DATA
    });
}
}
});
}
})

/*Get case list by userId*/
apiRouter.post('/get-case-by-user', function(req, res) {
    var loginSessionKey = req.body.loginSessionKey;
    req.check('loginSessionKey', 'Enter your loginSessionKey').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        var getCaseByUser = 'SELECT * FROM `cases` c LEFT JOIN users u ON u.userId= c.userId WHERE u.loginSessionKey="' + loginSessionKey + '"';
        database.getConn(getCaseByUser, function(err, caseRes) {
            if (err) {
                res.send({
                    "code": 200,
                    "status": 0,
                    "message": err.sqlMessage
                });
            } else {
                if (parseInt(caseRes.length) > 0) {
                    var caseArr = [];
                    for (var i = 0; i < caseRes.length; i++) {
                        var caseObj = {};
                        caseObj.cityId = caseRes[i].caseId;
                        caseObj.userId = caseRes[i].userId;
                        caseObj.lawyerSpecializationId = custom.nullChecker(caseRes[i].lawyerSpecializationId);
                        caseObj.caseTitle = custom.nullChecker(caseRes[i].caseTitle);
                        caseObj.caseDescription = custom.nullChecker(caseRes[i].caseDescription);
                        caseObj.attachFile = custom.nullChecker(caseRes[i].attachFile);
                        caseObj.assignedLawyerId = custom.nullChecker(caseRes[i].assignedLawyerId);
                        caseObj.lawyerRatings = caseRes[i].lawyerRatings;
                        caseObj.caseStatus = caseRes[i].caseStatus;
                        caseObj.createdDate = dateTime.changeDateFormat(caseRes[i].createdDate);
                        caseArr.push(caseObj)
                    }
                    res.send({
                        "code": 200,
                        "response": caseArr,
                        "status": 1,
                        "message": constant.GET_CASE_LIST
                    });
                } else {
                    res.send({
                        "code": 200,
                        "status": 7,
                        "message": constant.NO_DATA
                    });
                }
            }
        });
    }
})

/*Get case list by lawyer*/
apiRouter.post('/get-case-by-lawyer', function(req, res) {
    var loginSessionKey = req.body.loginSessionKey;
    req.check('loginSessionKey', 'Enter your loginSessionKey').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        var getCaseByLawyer = 'SELECT * FROM `cases` c LEFT JOIN users u ON u.userId= c.assignedLawyerId WHERE u.loginSessionKey="' + loginSessionKey + '"';
        database.getConn(getCaseByLawyer, function(err, caseRes) {
            if (err) {
                res.send({
                    "code": 200,
                    "status": 0,
                    "message": err.sqlMessage
                });
            } else {
                if (parseInt(caseRes.length) > 0) {
                    var caseArr = [];
                    for (var i = 0; i < caseRes.length; i++) {
                        var caseObj = {};
                        caseObj.cityId = caseRes[i].caseId;
                        caseObj.userId = caseRes[i].userId;
                        caseObj.lawyerSpecializationId = custom.nullChecker(caseRes[i].lawyerSpecializationId);
                        caseObj.caseTitle = custom.nullChecker(caseRes[i].caseTitle);
                        caseObj.caseDescription = custom.nullChecker(caseRes[i].caseDescription);
                        caseObj.attachFile = custom.nullChecker(caseRes[i].attachFile);
                        caseObj.assignedLawyerId = custom.nullChecker(caseRes[i].assignedLawyerId);
                        caseObj.lawyerRatings = caseRes[i].lawyerRatings;
                        caseObj.caseStatus = caseRes[i].caseStatus;
                        caseObj.createdDate = dateTime.changeDateFormat(caseRes[i].createdDate);
                        caseArr.push(caseObj)
                    }
                    res.send({
                        "code": 200,
                        "response": caseArr,
                        "status": 1,
                        "message": constant.GET_CASE_LIST
                    });
                } else {
                    res.send({
                        "code": 200,
                        "status": 7,
                        "message": constant.NO_DATA
                    });
                }
            }
        });
    }
})

/*Update case(Currently not using anywhere)*/

apiRouter.post('/update-case', function(req, res) {
    var caseId = req.body.caseId;
    var lawyerSpecializationId = req.body.lawyerSpecializationId;
    var caseTitle = req.body.caseTitle;
    var caseDescription = req.body.caseDescription;
    var assignedLawyerId = req.body.assignedLawyerId;
    /*Manage validations*/
    req.check('caseId', 'Enter your caseId').notEmpty();
    req.check('lawyerSpecializationId', 'Enter your lawyerSpecializationId').notEmpty();
    req.check('caseTitle', 'Enter your case title').notEmpty();
    req.check('caseDescription', 'Enter your case description').notEmpty();
    req.check('assignedLawyerId', 'Enter your assignedLawyerId').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        async.waterfall([
            function(callback) {
                model.getAllWhere(function(err, results) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else {
                        var caseStatus = results[0].caseStatus;
                        if (caseStatus == 2) {
                            res.send({
                                "code": 200,
                                "status": 0,
                                "message": constant.UPDATE_CASE_ERR
                            });
                        } else {
                            callback(null, results);
                        }
                    }
                }, "cases", {
                    caseId: caseId
                });
            }
            ], function(err, caseResult) {
                var lawyerSpecializationIdNew = (!lawyerSpecializationId) ? caseResult[0].lawyerSpecializationId : lawyerSpecializationId;
                var caseTitleNew = (!caseTitle) ? caseResult[0].caseTitle : caseTitle;
                var caseDescriptionNew = (!caseDescription) ? caseResult[0].caseDescription : caseDescription;
                var assignedLawyerIdNew = (!assignedLawyerId) ? caseResult[0].assignedLawyerId : assignedLawyerId;
                var dataObj = {};
                dataObj.lawyerSpecializationId = lawyerSpecializationIdNew;
                dataObj.caseTitle = caseTitleNew;
                dataObj.caseDescription = caseDescriptionNew;
                dataObj.assignedLawyerId = assignedLawyerIdNew;
                var whereObj = {};
                whereObj.caseId = caseResult[0].caseId;
                model.updateData(function(err, resp) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else {
                        res.send({
                            "code": 200,
                            "status": 1,
                            "message": constant.CASE_UPDATED
                        });
                    }
                }, "cases", dataObj, whereObj);
            });
    }
})

/*Update case status to unpublish*/
apiRouter.post('/unpublish-case', function(req, res) {
    var caseId = req.body.caseId;
    /*Manage validations*/
    req.check('caseId', 'Enter your caseId').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        async.waterfall([
            function(callback) {
                model.getAllWhere(function(err, results) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else {
                        var caseStatus = results[0].caseStatus;
                        if (caseStatus == 0) {
                            res.send({
                                "code": 200,
                                "status": 0,
                                "message": constant.CASE_UNPUBLISHED_EXIST
                            });
                        } else if (caseStatus == 2) {
                            res.send({
                                "code": 200,
                                "status": 0,
                                "message": constant.CASE_UNPUBLISHED_ACCEPTED
                            });
                        } else {
                            callback(null, results);
                        }
                    }
                }, "cases", {
                    caseId: caseId
                });
            }
            ], function(err, caseResult) {
                var dataObj = {};
                dataObj.caseStatus = 0;
                var whereObj = {};
                whereObj.caseId = caseResult[0].caseId;
                model.updateData(function(err, resp) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else if (resp.affectedRows > 0) {
                        res.send({
                            "code": 200,
                            "status": 1,
                            "message": constant.CASE_UNPUBLISHED
                        });
                    } else {
                        res.send({
                            "code": 200,
                            "status": 0,
                            "message": constant.CASE_UNPUBLISHED_ERR
                        });
                    }
                }, "cases", dataObj, whereObj);
            });
    }
})


/*Delete unpublished cases*/
apiRouter.post('/delete-case', function(req, res) {
    var caseId = req.body.caseId;
    req.check('caseId', 'Please enter valid case Id!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        /*Calling delete function in model library*/
        var whereObj = {};
        whereObj.caseId = caseId;
        whereObj.caseStatus = 0;
        console.log("whereObj ", whereObj);
        model.deleteData(function(err, resp) {
            if (err) {
                return res.send(db.dbErrorResponse());
            } else {
                if (resp.affectedRows > 0) {
                    return res.send({
                        "code": 200,
                        "status": 1,
                        "message": constant.CASE_DELETE_SUCCESS
                    });
                } else {
                    return res.send({
                        "code": 200,
                        "status": 0,
                        "message": constant.CASE_DELETE_ERR
                    });
                }

            }
        }, "cases", whereObj);
    }
});

/*Rate lawyer by a case*/
apiRouter.post('/lawyer-reviews', function(req, res) {
    var caseId = req.body.caseId;
    var ratings = req.body.ratings;
    var suggestion = req.body.suggestion;
    req.check('caseId', 'Enter your caseId').notEmpty();
    req.check('ratings', 'Enter your ratings').notEmpty();

    var ratings = (!req.body.ratings) ? new Array() : req.body.ratings;
    if (ratings) {
        ratings = (typeof ratings === 'string') ? JSON.parse(ratings) : ratings;
    }
    var errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        var rateLawyer = 'SELECT * FROM cases WHERE caseId="' + caseId + '"';
        database.getConn(rateLawyer, function(err, caseRes) {
            if (err) {
                res.send({
                    "code": 200,
                    "status": 0,
                    "message": err.sqlMessage
                });
            } else {
                if (parseInt(caseRes.length) > 0) {
                    var lawyerId = caseRes[0].assignedLawyerId;
                    if (caseRes[0].caseStatus == 7) {
                        async.waterfall([
                            function(callback) {
                                var reviewArr = [];
                                for (var i = 0; i < ratings.length; i++) {
                                    var dataObj = {};
                                    dataObj.lawyerId = lawyerId;
                                    dataObj.caseId = caseId;
                                    dataObj.question = ratings[i].question;
                                    var rating = ratings[i].answer;
                                    if (rating == "GOOD") {
                                        rating = 10;
                                    } else if (rating == "SOMEWHAT") {
                                        rating = 5;
                                    } else if (rating == "BAD") {
                                        rating = 1;
                                    }
                                    else if (rating == "NO") {
                                        rating = 1;
                                    }
                                    dataObj.ratings = rating;
                                    reviewArr.push(dataObj);
                                }
                                model.insertBulkData(function(err, resp) {
                                    if (err) {
                                        return res.send(db.dbErrorResponse());
                                    } else {
                                        if (resp.affectedRows > 0) {
                                            callback(null, lawyerId);
                                        } else {
                                            return res.send({
                                                "code": 200,
                                                "status": 0,
                                                "message": constant.ADD_REVIEWS_ERR
                                            });
                                        }
                                    }
                                }, "reviews", reviewArr);
                            },
                            function(lawyerId, callback) {
                                var avgReviewRatings = "SELECT AVG(ratings) AS caseAverageRatings FROM reviews where lawyerId=" + lawyerId + " AND caseId=" + caseId + "";
                                model.customQuery(function(err, resultsReviews) {
                                    if (err) {
                                        res.send(db.dbErrorResponse());
                                        return false;
                                    } else {
                                        if (resultsReviews.length > 0) {
                                            callback(null, lawyerId, resultsReviews[0].caseAverageRatings);
                                        } else {
                                            res.send({
                                                "code": 200,
                                                "status": 0,
                                                "message": constant.ADD_RATINGS_ERR
                                            });
                                        }
                                    }
                                }, avgReviewRatings);
                            },
                            function(lawyerId, caseAverageRatings, callback) {
                                var updateCaseRatingObj = {};
                                updateCaseRatingObj.lawyerRatings = caseAverageRatings;
                                updateCaseRatingObj.clientSuggestion = suggestion;
                                model.updateData(function(err, caseRate) {
                                    if (err) {
                                        res.send(db.dbErrorResponse());
                                        return false;
                                    } else {
                                        if (caseRate.affectedRows > 0) {
                                            callback(null, lawyerId);
                                        } else {
                                            res.send({
                                                "code": 200,
                                                "status": 0,
                                                "message": constant.ADD_RATINGS_ERR
                                            });
                                        }
                                    }
                                }, "cases", updateCaseRatingObj,{
                                    caseId: caseId,
                                });
                            },
                            function(lawyerId, callback) {
                                var avgCasesRatings = "SELECT AVG(lawyerRatings) AS lawyerAverageRatings FROM cases where assignedLawyerId=" + lawyerId + "";
                                model.customQuery(function(err, ratingResults) {
                                    if (err) {
                                        res.send(db.dbErrorResponse());
                                        return false;
                                    } else {
                                        if (ratingResults.length > 0) {
                                            callback(null, lawyerId, ratingResults[0].lawyerAverageRatings);
                                        } else {
                                            res.send({
                                                "code": 200,
                                                "status": 0,
                                                "message": constant.ADD_RATINGS_ERR
                                            });
                                        }
                                    }
                                }, avgCasesRatings);
                            }
                            ], function(err, lawyerId, lawyerAverageRatings) {
                                var updateLawyerRatingObj = {};
                                updateLawyerRatingObj.lawyerRatings = lawyerAverageRatings;
                                model.updateData(function(err, lawyerRatings) {
                                    if (err) {
                                        res.send(db.dbErrorResponse());
                                        return false;
                                    } else {
                                        if (lawyerRatings.affectedRows > 0) {
                                            res.send({
                                                "code": 200,
                                                "status": 1,
                                                "message": constant.ADD_RATINGS
                                            });
                                        } else {
                                            res.send({
                                                "code": 200,
                                                "status": 0,
                                                "message": constant.ADD_RATINGS_ERR
                                            });
                                        }
                                    }
                                }, "users", updateLawyerRatingObj, {
                                    userId: lawyerId,
                                });
                            });
} else {
    res.send({
        "code": 200,
        "status": 0,
        "message": constant.ADD_RATINGS_VALIDATION
    });
}
} else {
    res.send({
        "code": 200,
        "status": 7,
        "message": constant.NO_DATA
    });
}
}
});
}
})


apiRouter.post('/rate-lawyer-by-case-old', function(req, res) {
    var caseId = req.body.caseId;
    var ratings = req.body.ratings;
    req.check('caseId', 'Enter your caseId').notEmpty();
    req.check('ratings', 'Enter your ratings').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        var rateLawyer = 'SELECT * FROM cases WHERE caseId="' + caseId + '"';
        database.getConn(rateLawyer, function(err, caseRes) {
            if (err) {
                res.send({
                    "code": 200,
                    "status": 0,
                    "message": err.sqlMessage
                });
            } else {
                if (parseInt(caseRes.length) > 0) {
                    var lawyerId = caseRes[0].assignedLawyerId;
                    if (caseRes[0].caseStatusAfter == 2) {
                        let updateLawyerRatings = "UPDATE  cases SET lawyerRatings =" + ratings + " WHERE caseId ='" + caseId + "'";
                        database.getConn(updateLawyerRatings, function(err, rateRes) {
                            if (err) {
                                res.send({
                                    "code": 200,
                                    "status": 0,
                                    "message": err.sqlMessage
                                });
                            } else if (rateRes.affectedRows > 0) {
                                var getAvgRatings = "SELECT AVG(lawyerRatings) AS AverageRatings FROM cases where assignedLawyerId=" + lawyerId + "";
                                database.getConn(getAvgRatings, function(err, avgRatingsRes) {
                                    if (err) {
                                        res.send({
                                            "code": 200,
                                            "status": 0,
                                            "message": err.sqlMessage
                                        });
                                    } else if (avgRatingsRes.length > 0) {
                                        let avgRating = avgRatingsRes[0].AverageRatings;
                                        let updateLawyerRatingsInUsers = "UPDATE users SET lawyerRatings =" + avgRating + " WHERE userId ='" + lawyerId + "'";
                                        database.getConn(updateLawyerRatingsInUsers, function(err, updateLawyerRatingsRes) {
                                            if (err) {
                                                res.send({
                                                    "code": 200,
                                                    "status": 0,
                                                    "message": err.sqlMessage
                                                });
                                            } else if (updateLawyerRatingsRes.affectedRows > 0) {
                                                res.send({
                                                    "code": 200,
                                                    "status": 1,
                                                    "message": constant.ADD_RATINGS
                                                });
                                            } else {
                                                res.send({
                                                    "code": 200,
                                                    "status": 0,
                                                    "message": constant.ADD_RATINGS_ERR
                                                });
                                            }
                                        });
                                    }
                                });
                            } else {
                                res.send({
                                    "code": 200,
                                    "status": 0,
                                    "message": constant.ADD_RATINGS_ERR
                                });
                            }
                        });
                    } else {
                        res.send({
                            "code": 200,
                            "status": 0,
                            "message": constant.ADD_RATINGS_VALIDATION
                        });
                    }

                } else {
                    res.send({
                        "code": 200,
                        "status": 7,
                        "message": constant.NO_DATA
                    });
                }
            }
        });
}
})

/*Get published cases by lawyer specializations*/
apiRouter.post('/get-published-cases', function(req, res) {
    var userId = req.userId;
    var lawyerSpecializationId = req.body.lawyerSpecializationId;
    var loginSessionKey = req.body.loginSessionKey;
    req.check('lawyerSpecializationId', 'Enter your lawyer specialization id').notEmpty();
    req.check('loginSessionKey', 'Enter your loginSessionKey').notEmpty();
    var lawyerServices = (!req.body.lawyerSpecializationId) ? new Array() : req.body.lawyerSpecializationId;
    if (lawyerServices) {
        lawyerServices = (typeof lawyerServices === 'string') ? JSON.parse(lawyerServices) : lawyerServices;
    }
    var errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        var getUserId = "SELECT userId from users where userId='" + userId + "'";
        database.getConn(getUserId, function(err, userRes) {
            if (err) {
                res.send({
                    "code": 200,
                    "status": 0,
                    "message": err.sqlMessage
                });
            } else if (userRes.length > 0) {
                var userId = userRes[0].userId;
                var getCases = 'SELECT s.userId, c.caseId,c.lawyerSpecializationId, c.uniqueCaseId, c.caseTitle, c.createdDate, u.fullName AS clientName, ls.title AS caseType FROM cases c LEFT JOIN specializations s ON s.userId = c.userId AND s.lawyerSpecializationId IN(' + lawyerServices.toString() + ') JOIN users u ON u.userId = c.userId JOIN lawyerSpecializations ls ON ls.lawyerSpecializationId = c.lawyerSpecializationId WHERE caseStatus = 1 AND s.userId = ' + userId + ' AND ls.lawyerSpecializationId IN(' + lawyerServices.toString() + ') GROUP BY c.caseId';
                database.getConn(getCases, function(err, casesRes) {
                    if (err) {
                        res.send({
                            "code": 200,
                            "status": 0,
                            "message": err.sqlMessage
                        });
                    } else {
                        if (parseInt(casesRes.length) > 0) {
                            var caseArr = [];
                            for (var i = 0; i < casesRes.length; i++) {
                                var caseObj = {};
                                caseObj.caseId = casesRes[i].caseId;
                                caseObj.lawyerSpecializationId = casesRes[i].lawyerSpecializationId;
                                caseObj.uniqueCaseId = casesRes[i].uniqueCaseId;
                                caseObj.caseTitle = custom.nullChecker(casesRes[i].caseTitle);
                                caseObj.clientName = custom.nullChecker(casesRes[i].clientName);
                                caseObj.caseType = custom.nullChecker(casesRes[i].caseType);
                                caseObj.createdDate = dateTime.changeDateFormat(casesRes[i].createdDate);
                                caseArr.push(caseObj)
                            }
                            res.send({
                                "code": 200,
                                "response": caseArr,
                                "status": 1,
                                "message": constant.GET_PUBLISHED_CASE
                            });
                        } else {
                            res.send({
                                "code": 200,
                                "status": 7,
                                "message": constant.NO_DATA
                            });
                        }
                    }
                });
            } else {
                res.send({
                    "code": 200,
                    "status": 7,
                    "message": constant.NO_DATA
                });
            }
        });
    }

})

/*Send case request from lawyer to client or owner*/

apiRouter.post('/send-case-request', function(req, res) {
    var caseId = req.body.caseId;
    var acceptedPercent = req.body.acceptedPercent;
    var lawyerId = req.userId;
    /*Validate input fields*/
    req.check('caseId', 'Please enter valid case Id!').notEmpty();
    req.check('acceptedPercent', 'Please enter valid accepted percent!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        async.waterfall([
            function(callback) {
                model.getAllWhere(function(err, results) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else if (results.length > 0) {
                        var clientId = results[0].userId;
                        callback(null, clientId);
                    } else {
                        res.send({
                            "code": 200,
                            "status": 7,
                            "message": constant.NO_DATA
                        });
                    }
                }, "cases", {
                    caseId: caseId,
                });
            }
            ], function(err, clientId) {
                /*Calling getAllWhere function in model library(Check if already requested)*/
                model.getAllWhere(function(err, resp) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else {
                        if (resp.length > 0) {
                            res.send({
                                "code": 200,
                                "status": 0,
                                "message": constant.CASE_REQUEST_EXIST
                            });
                        } else {
                            /*Calling getAllWhere function in model library(Check if case has skipped)*/
                            model.getAllWhere(function(err, resp) {
                                if (err) {
                                    res.send(db.dbErrorResponse());
                                    return false;
                                } else {
                                    if (resp.length > 0) {
                                        res.send({
                                            "code": 200,
                                            "status": 0,
                                            "message": constant.CASE_SKIP_CHECK
                                        });
                                    } else {
                                        /*Calling insert function in model library*/
                                        var dataObj = {};
                                        dataObj.caseId = caseId;
                                        dataObj.lawyerId = lawyerId;
                                        dataObj.acceptedPercent = acceptedPercent;
                                        dataObj.requestActionDate = dateTime.getCurrentTime();
                                        model.insertData(function(err, resp) {
                                            if (err) {
                                                return res.send(db.dbErrorResponse());
                                            } else {
                                                if (resp.affectedRows > 0) {
                                                    /*Send notification to client*/
                                                    var userMessage = "You have a new case request, Please check!";
                                                    var extraParams = {};
                                                    extraParams.notificationType = "NEW_CASE_REQUEST";
                                                    extraParams.notificationTitle = "New Case Request";
                                                    extraParams.caseId = caseId;
                                                    notification.sendPushNotifications(userMessage, clientId, extraParams)
                                                    return res.send({
                                                        "code": 200,
                                                        "status": 1,
                                                        "message": constant.CASE_REQUEST_SUCCESS
                                                    });
                                                } else {
                                                    return res.send({
                                                        "code": 200,
                                                        "status": 0,
                                                        "message": constant.CASE_REQUEST_ERR
                                                    });
                                                }
                                            }
                                        }, "caseRequest", dataObj);
                                    }
                                }
                            }, "skippedCases", {
                                caseId: caseId,
                                lawyerId,
                                lawyerId
                            });
                        }
                    }
                }, "caseRequest", {
                    caseId: caseId,
                    lawyerId,
                    lawyerId
                });
});

}
});


/*Skip case for lawyer*/
apiRouter.post('/skip-case', function(req, res) {
    var caseId = req.body.caseId;
    var lawyerId = req.userId;
    console.log("skip-case lawyerId ", lawyerId);
    /*Validate input fields*/
    req.check('caseId', 'Please enter valid case Id!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        /*Calling getAllWhere function in model library(Check if already skipped)*/
        model.getAllWhere(function(err, resp) {
            if (err) {
                res.send(db.dbErrorResponse());
                return false;
            } else {
                if (resp.length > 0) {
                    res.send({
                        "code": 200,
                        "status": 0,
                        "message": constant.CASE_SKIP_EXIST
                    });
                } else {
                    /*Calling getAllWhere function in model library(Check if case has requested)*/
                    model.getAllWhere(function(err, resp) {
                        if (err) {
                            res.send(db.dbErrorResponse());
                            return false;
                        } else {
                            if (resp.length > 0) {
                                res.send({
                                    "code": 200,
                                    "status": 0,
                                    "message": constant.CASE_REQUEST_EXIST
                                });
                            } else {
                                /*Calling insert function in model library*/
                                var dataObj = {};
                                dataObj.caseId = caseId;
                                dataObj.lawyerId = lawyerId;
                                model.insertData(function(err, resp) {
                                    if (err) {
                                        return res.send(db.dbErrorResponse());
                                    } else {
                                        if (resp.affectedRows > 0) {
                                            return res.send({
                                                "code": 200,
                                                "status": 1,
                                                "message": constant.CASE_SKIP_SUCCESS
                                            });
                                        } else {
                                            return res.send({
                                                "code": 200,
                                                "status": 0,
                                                "message": constant.CASE_SKIP_ERR
                                            });
                                        }
                                    }
                                }, "skippedCases", dataObj);
                            }
                        }
                    }, "caseRequest", {
                        caseId: caseId,
                        lawyerId,
                        lawyerId
                    });

                }
            }
        }, "skippedCases", {
            caseId: caseId,
            lawyerId,
            lawyerId
        });

    }
});

/*Get case request list for client or case owner*/
apiRouter.post('/get-case-request', function(req, res) {
    var loginSessionKey = req.body.loginSessionKey;
    var caseId = req.body.caseId;
    var clientId = req.userId;
    var pageNo = req.body.pageNo;
    console.log("get case request clientId ", clientId, "pageNo ", pageNo);
    /*Validate input fields*/
    req.check('loginSessionKey', 'Please enter valid loginSessionKey!').notEmpty();
    req.check('caseId', 'Please enter valid caseId!').notEmpty();
    req.check('pageNo', 'Please enter valid pageNo!').notEmpty();
    req.check('pageNo', 'Page number minimum value should be 1').minValue(1)

    let errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        /*Calling getAllWhere function in model library(Check if user exists)*/
        model.getAllWhere(function(err, resp) {
            if (err) {
                res.send(db.dbErrorResponse());
                return false;
            } else {
                if (resp.length > 0) {
                    /*Calling customQuery function in model library(Check if already skipped)*/
                    let offset = custom.getOffset(pageNo);
                    var getCaseRequestList = "SELECT cr.caseRequestId, cr.lawyerId, u.fullName As lawyerName,u.email AS lawyerEmail, u.contactNumber As lawyerContactNumber,u.lawyerDescription As lawyerDescription,u.lawyerExperience As lawyerExperience,u.lawyerRatings, CONCAT('[',GROUP_CONCAT(CONCAT('{\"lawyerSpecializationId\":\"', s.lawyerSpecializationId, '\", \"serviceTitle\":\"',ls.title,'\"}')),']') AS lawyerServices,c.caseId, c.uniqueCaseId, c.caseTitle,c.caseDescription,cr.acceptedPercent FROM caseRequest cr JOIN cases c ON cr.caseId=c.caseId JOIN users u ON cr.lawyerId=u.userId JOIN specializations s ON s.userId =u.userId JOIN lawyerSpecializations ls ON ls.lawyerSpecializationId=s.lawyerSpecializationId WHERE c.userId=" + clientId + " AND c.caseId=" + caseId + " AND cr.isAccepted=0 GROUP BY cr.caseRequestId ORDER BY c.createdDate DESC LIMIT 10 OFFSET  " + offset + "";
                    console.log("getCaseRequestList ", getCaseRequestList);
                    model.customQuery(function(err, resultReq) {
                        if (err) {
                            res.send(db.dbErrorResponse());
                            return false;
                        } else if (resultReq.length > 0) {

                            var caseReqArr = [];
                            var countDown = 0;
                            for (var i = 0; i < resultReq.length; i++) {
                                (function(i) {
                                    var getSolvedCases = "  SELECT SUM(IF(caseStatus=7 AND assignedLawyerId=" + resultReq[i].lawyerId + ",1,0)) As solvedCases FROM `cases`";
                                    var caseReqObj = {};
                                    var lawyerObj = {};
                                    caseReqObj.caseRequestId = resultReq[i].caseRequestId;
                                    caseReqObj.caseId = resultReq[i].caseId;
                                    caseReqObj.uniqueCaseId = resultReq[i].uniqueCaseId;
                                    caseReqObj.caseTitle = resultReq[i].caseTitle;
                                    caseReqObj.caseDescription = custom.nullChecker(resultReq[i].caseDescription);
                                    caseReqObj.acceptedPercent = custom.nullChecker(resultReq[i].acceptedPercent);
                                    /*Manage lawyer info in a separate object*/
                                    lawyerObj.lawyerId = resultReq[i].lawyerId;
                                    lawyerObj.lawyerName = resultReq[i].lawyerName;
                                    lawyerObj.lawyerEmail = resultReq[i].lawyerEmail;
                                    lawyerObj.lawyerRatings = resultReq[i].lawyerRatings;
                                    lawyerObj.lawyerExperience = custom.nullChecker(resultReq[i].lawyerExperience);
                                    lawyerObj.lawyerDescription = custom.nullChecker(resultReq[i].lawyerDescription);
                                    lawyerObj.lawyerContactNumber = custom.nullChecker(resultReq[i].contactNumber);

                                    if (resultReq[i].lawyerServices) {
                                        lawyerObj.lawyerServices = JSON.parse(resultReq[i].lawyerServices);
                                    } else {
                                        lawyerObj.lawyerServices = [];
                                    }

                                    model.customQuery(function(err, solvedCasesRes) {
                                        if (err) {
                                            countDown++;
                                            res.send(db.dbErrorResponse());
                                            return false;
                                        } else {
                                            if (solvedCasesRes.length > 0) {
                                                var solvedCases = solvedCasesRes[0].solvedCases;
                                            } else {
                                                var solvedCases = 0;
                                            }
                                            countDown++;
                                            lawyerObj.solvedCases = solvedCases;
                                            caseReqObj.lawyerDetails = lawyerObj;
                                            caseReqArr.push(caseReqObj);
                                            console.log(countDown, i, resultReq.length)
                                            if (resultReq.length == (countDown)) {
                                                res.send({
                                                    "code": 200,
                                                    "status": 1,
                                                    "response": caseReqArr,
                                                    "message": constant.CASE_REQUEST_FOUND
                                                });
                                            }
                                        }
                                    }, getSolvedCases);
                                })(i)
                            }
                        } else {
                            res.send({
                                "code": 200,
                                "status": 0,
                                "message": constant.CASE_REQUEST_NOT_FOUND
                            });
                        }
                    }, getCaseRequestList);
} else {
    res.send({
        "code": 200,
        "status": 0,
        "message": constant.NO_DATA
    });
    return false;
}
}
}, "users", {
    userId: clientId
});
}
});


/*Accept case request by client*/
apiRouter.post('/accept-case-request', function(req, res) {
    var caseId = req.body.caseId;
    var assignedLawyerId = req.body.assignedLawyerId;
    /*Manage validations*/
    req.check('caseId', 'Enter your caseId').notEmpty();
    req.check('assignedLawyerId', 'Enter your assignedLawyerId').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        async.waterfall([
            function(callback) {
                model.getAllWhere(function(err, results) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else if (results.length > 0) {
                        var caseStatus = results[0].caseStatus;
                        var isLawyerAssign = results[0].assignedLawyerId;
                        if (caseStatus == 2) {

                            res.send({
                                "code": 200,
                                "status": 0,
                                "message": constant.CASE_ALREADY_ACCEPTED
                            });
                        } else {
                            callback(null, results);
                        }
                    } else {
                        res.send({
                            "code": 200,
                            "status": 7,
                            "message": constant.NO_DATA
                        });
                    }
                }, "cases", {
                    caseId: caseId,
                });
            },
            function(caseResult, callback) {
                var updateIsAccepted = {};
                updateIsAccepted.isAccepted = 1;
                model.updateData(function(err, resultsCaseReq) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else {
                        if (resultsCaseReq.affectedRows > 0) {
                            callback(null, caseResult);
                        } else {
                            res.send({
                                "code": 200,
                                "status": 0,
                                "message": constant.CASE_ACCEPT_ERR
                            });
                        }
                    }
                }, "caseRequest", updateIsAccepted, {
                    caseId: caseId,
                    lawyerId: assignedLawyerId
                });
            },
            function(caseResult, callback) {
                console.log("4th callback");
                var checkMoreCaseRequsts = "SELECT * FROM `caseRequest` WHERE caseId=" + caseId + " AND lawyerId!=" + assignedLawyerId + "";
                model.customQuery(function(err, resultsCaseData) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else {
                        if (resultsCaseData.length > 0) {
                            var autoRejectQuery = "UPDATE caseRequest SET isAccepted = '3' where caseId ='" + caseId + "' AND lawyerId!=" + assignedLawyerId + "";
                            model.customQuery(function(err, resultsCaseReq) {
                                if (err) {
                                    res.send(db.dbErrorResponse());
                                    return false;
                                } else {
                                    if (resultsCaseReq.affectedRows > 0) {
                                        callback(null, caseResult);
                                    } else {
                                        res.send({
                                            "code": 200,
                                            "status": 0,
                                            "message": constant.CASE_AUTO_REJECT_ERR
                                        });
                                    }
                                }
                            }, autoRejectQuery);
                        } else {
                            callback(null, caseResult);
                        }
                    }
                }, checkMoreCaseRequsts);
            }
            ], function(err, caseResult) {
                console.log("5th callback");
                var dataObj = {};
                dataObj.caseStatus = 2;
                dataObj.acceptedDate = dateTime.getCurrentTime();
                dataObj.assignedLawyerId = assignedLawyerId;
                var whereObj = {};
                whereObj.caseId = caseResult[0].caseId;
                model.updateData(function(err, resp) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else if (resp.affectedRows > 0) {
                        var userMessage = "Congratulations! client has been accepted your case request!";
                        var extraParams = {};
                        extraParams.notificationType = "CASE_REQUEST_ACCEPTED";
                        extraParams.notificationTitle = "Case Request Accepted";
                        extraParams.caseId = caseId;
                        notification.sendPushNotifications(userMessage, assignedLawyerId, extraParams);
                        res.send({
                            "code": 200,
                            "status": 1,
                            "message": constant.CASE_ACCEPTED
                        });
                    } else {
                        res.send({
                            "code": 200,
                            "status": 0,
                            "message": constant.CASE_ACCEPT_ERR
                        });
                    }
                }, "cases", dataObj, whereObj);
            });
}
})


/*Case close confirmation request by lawyer */
apiRouter.post('/close-case-confirmation', function(req, res) {
    var loginSessionKey = req.body.loginSessionKey;
    var caseId = req.body.caseId;
    req.check('loginSessionKey', 'loginSessionKey  is required!').notEmpty();
    req.check('caseId', 'caseId is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        async.waterfall([
            function(callback) {
                /* Get case details */
                model.getAllWhere(function(err, results) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else if (results.length > 0) {
                        callback(null, results);
                    } else {
                        res.send({
                            "code": 200,
                            "status": 7,
                            "message": constant.NO_DATA
                        });
                    }
                }, "cases", {
                    caseId: caseId
                });
            },
            function(results, callback) {
                var dataObj = {};
                /*Update case status to close confirmation=6*/
                dataObj.caseStatus = 6;
                model.updateData(function(err, resp) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else if (resp.affectedRows > 0) {
                        callback(null, results);
                    } else {
                        callback(null, err);
                    }
                }, "cases", dataObj, {
                    caseId: caseId
                });
            }
            ], function(err, results) {
                var clientId = results[0].userId;
                console.log("clientId close case confirm ", clientId);
                if (err) {
                    res.send({
                        "code": 200,
                        "status": 0,
                        "message": constant.SEND_REQUESDT_ERR
                    });

                } else {
                    /*Send notification to client*/
                    var userMessage = "Hey! lawyer has sent you a confirmation request for closing the case. Please check!";
                    var extraParams = {};
                    extraParams.notificationType = "CASE_CLOSE_CONFIRMATION";
                    extraParams.notificationTitle = "Confirmation Request for Closing Your Case";
                    extraParams.caseId = caseId;
                    notification.sendPushNotifications(userMessage, clientId, extraParams)
                    res.send({
                        "code": 200,
                        "status": 1,
                        "message": constant.SEND_REQUESDT_SUCCESS
                    });
                }

            });
    }
});


/*Solved case confirmation by client*/
apiRouter.post('/case-solved', function(req, res) {
    var loginSessionKey = req.body.loginSessionKey;
    var caseId = req.body.caseId;
    var userIdReq = req.userId;
    console.log("case-solved userIdReq ", userIdReq);
    req.check('loginSessionKey', 'loginSessionKey  is required!').notEmpty();
    req.check('caseId', 'caseId is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        async.waterfall([
            function(callback) {
                /* Get case details */
                model.getAllWhere(function(err, resultsUser) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else if (resultsUser.length > 0) {
                        var userType = resultsUser[0].userType;
                        if (userType == 1) {
                            res.send({
                                "code": 200,
                                "status": 0,
                                "message": "Invalid user!"
                            });
                        } else {
                            callback(null, resultsUser);
                        }
                    } else {
                        res.send({
                            "code": 200,
                            "status": 7,
                            "message": constant.NO_DATA
                        });
                    }
                }, "users", {
                    userId: userIdReq
                });
            },
            function(resultsUser, callback) {
                /* Get case details */
                model.getAllWhere(function(err, resultsCase) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else if (resultsCase.length > 0) {
                        var caseStatus = resultsCase[0].caseStatus;
                        console.log("caseStatus ", caseStatus);
                        if (caseStatus == 6) {
                            callback(null, resultsCase);
                        } else if (caseStatus == 7) {
                            res.send({
                                "code": 200,
                                "status": 0,
                                "message": constant.CASE_ALREADY_SOLVED
                            });
                        } else {
                            res.send({
                                "code": 200,
                                "status": 0,
                                "message": constant.CASE_SOLVED_ERR
                            });
                        }
                    } else {
                        res.send({
                            "code": 200,
                            "status": 7,
                            "message": constant.NO_DATA
                        });
                    }
                }, "cases", {
                    caseId: caseId
                });
            },
            function(results, callback) {
                /*Update case status to solved case=7*/
                var dataObj = {};
                dataObj.caseStatus = 7;
                dataObj.solvedDate = dateTime.getCurrentTime();
                model.updateData(function(err, resp) {
                    if (err) {
                        res.send(db.dbErrorResponse());
                        return false;
                    } else if (resp.affectedRows > 0) {
                        callback(null, results);
                    } else {
                        callback(null, err);
                    }
                }, "cases", dataObj, {
                    caseId: caseId
                });
            }
            ], function(err, results) {
                var lawyerId = results[0].assignedLawyerId;
                if (err) {
                    res.send({
                        "code": 200,
                        "status": 0,
                        "message": constant.CASE_CLOSE_ERR
                    });
                } else {
                    var userMessage = "Congratulations! Client has been approved your confirmation request for closing the case!";
                    var extraParams = {};
                    extraParams.notificationType = "CASE_SOLVED";
                    extraParams.notificationTitle = "Case Solved";
                    extraParams.caseId = caseId;
                    notification.sendPushNotifications(userMessage, lawyerId, extraParams)
                    res.send({
                        "code": 200,
                        "status": 1,
                        "message": constant.CASE_CLOSE_SUCCESS
                    });
                }

            });
}
});


/*Get notification list*/
apiRouter.post('/get-notification-list', function(req, res) {
    var loginSessionKey = req.body.loginSessionKey;
    var pageNo = parseInt(req.body.pageNo);
    var userId = req.userId;
    req.check('loginSessionKey', 'Enter your loginSessionKey').notEmpty();
    req.check('pageNo', 'Page number is required').notEmpty();
    req.check('pageNo', 'Page number minimum value should be 1').minValue(1);
    var errors = req.validationErrors();
    if (errors) {
        res.send({
            "code": 200,
            "status": 0,
            "message": custom.manageValidationMessages(errors)
        });
    } else {
        let offset = custom.getOffset(pageNo);
        var getNotificationList = "SELECT * FROM `notification` WHERE userId=" + userId + "  ORDER BY createdDate DESC LIMIT 10 OFFSET " + offset;;
        database.getConn(getNotificationList, function(err, notiRes) {
            if (err) {
                res.send({
                    "code": 200,
                    "status": 0,
                    "message": err.sqlMessage
                });
            } else {
                if (parseInt(notiRes.length) > 0) {
                    var notiArr = [];
                    for (var i = 0; i < notiRes.length; i++) {
                        var notiObj = {};
                        notiObj.notificationId = notiRes[i].notificationId;
                        notiObj.userId = notiRes[i].userId;
                        notiObj.caseId = custom.nullChecker(notiRes[i].caseId);
                        notiObj.notificationType = custom.nullChecker(notiRes[i].notificationType);
                        notiObj.notificationTitle = custom.nullChecker(notiRes[i].notificationTitle);
                        notiObj.message = custom.nullChecker(notiRes[i].message);
                        notiObj.isRead = notiRes[i].isRead;
                        notiObj.createdDate = dateTime.changeDateFormat(notiRes[i].createdDate);
                        notiArr.push(notiObj);
                    }
                    var dataObj = {};
                    dataObj.isRead = 1;
                    model.updateData(function(err, resp) {
                        if (err) {
                            res.send(db.dbErrorResponse());
                            return false;
                        } else if (resp.affectedRows > 0) {
                            res.send({
                                "code": 200,
                                "response": notiArr,
                                "status": 1,
                                "message": "Notification list found successfully!"
                            });
                        } else {
                            res.send({
                                "code": 200,
                                "status": 0,
                                "message": "There is a problem while updating read status!"
                            });
                        }
                    }, "notification", dataObj, {
                        userId: userId
                    });
                } else {
                    res.send({
                        "code": 200,
                        "status": 7,
                        "message": constant.NO_DATA
                    });
                }
            }
        });
    }
})


/*Generate token sample example*/
apiRouter.post('/authenticate', function(req, res) {
    var token = jwt.sign({
        admin: "mobiweb",
        exp: Math.floor(Date.now() / 1000) + (60 * 60)
    }, app.get('superSecret'));
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {
        if (err) {
            return res.json({
                success: false,
                message: 'Failed to authenticate token.'
            });
        } else {
            /*If everything is good, save to request for use in other routes*/
            req.decoded = decoded;
        }
    });
    res.json({
        success: true,
        message: 'Enjoy your token!',
        token: token
    });
});

/*Get feedback questions*/
apiRouter.post('/get-feedback-questions', function(req, res) {
    var getQuestions = "SELECT * FROM  feedbackQuestion";
    database.getConn(getQuestions, function(err, result) {
        if (err) {
            res.send({
                "code": 200,
                "status": 0,
                "message": err.sqlMessage
            });
        } else {
            if (parseInt(result.length) > 0) {
                var fbQuestionArr=[];
                for (var i = 0; i < result.length; i++) {
                   var fbQuestionObj={};
                   fbQuestionObj.questionId=result[i].questionId;
                   fbQuestionObj.questionTitle=result[i].questionTitle;
                   var options=result[i].options;
                   if (options) {
                    fbQuestionObj.options=JSON.parse(options);
                }
                fbQuestionArr.push(fbQuestionObj);
            }
            res.send({
                "code": 200,
                "response": fbQuestionArr,
                "status": 1,
                "message": "Feedback questions found successfully!"
            });
        } else {
            res.send({
                "code": 200,
                "status": 0,
                "message": 'Not found!'
            });
        }
    }
});
})

}