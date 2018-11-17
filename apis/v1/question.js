"use strict";


module.exports = function(app, database, custom) {
    /* Load custom modules */
    var appRoot = require('app-root-path'),
    async = require('async'),
    model = require(appRoot + '/lib/model.js'),
    custom = require(appRoot + '/lib/custom.js'),
    helper = require(appRoot + '/lib/helper.js'),
    queryBuilder = require(appRoot + '/lib/query-builder.js').QueryBuilder();
    var shortid = require('shortid');
    var fileUpload = require('express-fileupload');
    app.use(fileUpload());

    /*To add question*/
    app.post('/question/add-question', function(req, res) {
        var questionData = req.body.questionData;
        /*Manage validations*/
        req.check('questionData', 'Enter question details!').notEmpty();
        var errors = req.validationErrors();
        if (errors) {
            res.send({
                "code": 200,
                "status": 0,
                "message": custom.manageValidationMessages(errors)
            });
        } else {
            if (typeof questionData == "string") {
                questionData = JSON.parse(questionData);
            };
            var questionDataLength = questionData.length;
            for (var i = 0; i < questionData.length; i++) {
                var questionCounter = 0;
                (function(i) {
                    /*Manage main question data*/
                    var questionType = questionData[i].questionType;
                    var addMainQuesObj = {};
                    addMainQuesObj.questionTitle = questionData[i].title;
                    addMainQuesObj.questionType = questionType;
                    if (questionType != 2) {
                        addMainQuesObj.answer = questionData[i].answer;
                    } else {
                        addMainQuesObj.answer = "";
                        var mainQuesOptions = questionData[i].options;
                        var mainOptionLength = Object.keys(mainQuesOptions).length;
                        /*Manage main question option */
                        var mainOptionArr = [];
                        for (var key in mainQuesOptions) {
                            var optObj = {};
                            optObj.optionTitle = mainQuesOptions[key];
                            mainOptionArr.push(optObj);
                        }
                    }
                    /*Check if main question contain a subquestion, add subquestion in a variable*/
                    if (questionData[i].hasOwnProperty('subQuestion')) {
                        var subQuestion = questionData[i].subQuestion;
                    } else {
                        var subQuestion = [];
                    }
                    /*Insert main questions data*/
                    async.waterfall([function(callback) {
                        model.insertData(function(err, addEveRes) {
                            if (err) {
                                questionCounter++;
                                return res.send(helper.dbErrorResponse());
                            } else {
                                /*If data has been inserted */
                                if (parseInt(addEveRes.affectedRows) === 1) {
                                    var mainQuestionId = addEveRes.insertId;
                                    questionCounter++;
                                    /*Check if question type is multiple choice then add main question options*/
                                    if (questionType == 2) {
                                        var newOptionArr = mainOptionArr.map(function(el) {
                                            el.mainQuestionId = mainQuestionId;
                                            return el;
                                        })
                                        /*To insert option at a time, we can use */
                                        model.insertBulkData(function(err, results) {
                                            if (err) {
                                                return res.send(helper.dbErrorResponse());
                                            } else {
                                                if (results != null) {
                                                    callback(null, mainQuestionId, subQuestion)
                                                } else {
                                                    return res.send({
                                                        "code": 200,
                                                        "status": 0,
                                                        "message": "There is a problem in adding question options into DB!"
                                                    });
                                                }
                                            }
                                        }, "questionoptions", newOptionArr);
                                    }
                                    /*If question type is not multiple choice(it could be multi-line text or single choice)*/
                                    else {
                                        callback(null, mainQuestionId, subQuestion);
                                    }
                                } else {
                                    return res.send({
                                        "code": 200,
                                        "status": 0,
                                        "message": "There is a problem in adding questions into DB!"
                                    });
                                }
                            }
                        }, "mainquestions", addMainQuesObj);

                    }, function(mainQuestionId, subQuestion, callback) {
                        /*If there is any subquetion then store them in a subquestion table*/
                        if (subQuestion.length > 0) {
                            for (var subQues = 0; subQues < subQuestion.length; subQues++) {
                                (function(i) {
                                    var subQuestionObj = {};
                                    subQuestionObj.mainQuestionId = mainQuestionId;
                                    subQuestionObj.subQuestionTitle = subQuestion[subQues].title;
                                    var subQuestionType = subQuestion[subQues].questionType;
                                    subQuestionObj.questionType = subQuestionType;
                                    var subOptionArr = [];
                                    if (subQuestionType != 2) {
                                        subQuestionObj.answer = subQuestion[subQues].answer;
                                    } else {
                                        subQuestionObj.answer = "";
                                        var subQuesOptions = subQuestion[subQues].options;
                                        /*Manage  question option */
                                        for (var key in subQuesOptions) {
                                            var optObj = {};
                                            optObj.optionTitle = subQuesOptions[key];
                                            subOptionArr.push(optObj);
                                        }
                                    }
                                    /*Insert sub question data*/
                                    model.insertData(function(err, resp) {
                                        if (err) {
                                            return res.send(db.dbErrorResponse());
                                        } else {
                                            if (resp.affectedRows > 0) {
                                                var subQuesId = resp.insertId;
                                                /*Check if sub question is multi choice type*/
                                                if (subQuestionType == 2) {
                                                    var newSubQuesOptionArr = subOptionArr.map(function(el) {
                                                        el.mainQuestionId = mainQuestionId;
                                                        el.subQuestionId = subQuesId;
                                                        return el;
                                                    })
                                                    /*If yes, then store option data here*/
                                                    model.insertBulkData(function(err, results) {
                                                        if (err) {
                                                            return res.send(helper.dbErrorResponse());
                                                        } else {
                                                            if (results != null) {
                                                                callback(null, mainQuestionId, subQuestion)
                                                            } else {
                                                                return res.send({
                                                                    "code": 200,
                                                                    "status": 0,
                                                                    "message": "There is a problem in adding question options into DB!"
                                                                });
                                                            }
                                                        }
                                                    }, "questionoptions", newSubQuesOptionArr);
                                                } else {
                                                    /*If question is single choice type*/
                                                    callback(null, subQuestion)
                                                }
                                            } else {
                                                return res.send({
                                                    "code": 200,
                                                    "status": 0,
                                                    "message": "There is a problem while adding sub questions, please try again later!"
                                                });
                                            }

                                        }
                                    }, "subquestions", subQuestionObj);
                                })(i)
                            };
                        } else {
                            /*If there is no subquestion*/
                            callback(null, subQuestion)
                        };
                    }], function(err, callback) {
                        /*Final callback to handle success response*/
                        if (questionCounter == questionDataLength) {
                            return res.send({
                                "code": 200,
                                "status": 1,
                                "message": "Questions have been added successfully!"
                            });
                        };
                    });
                })(i);
            }
        }
    });



}