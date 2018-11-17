"user strict";

app.controller('homeCtrl',['$filter','$scope','$rootScope','$location','$localStorage','$window','appDB',function($filter,$scope,$rootScope,$location,$localStorage,$window,appDB){

	/*For managing multiple questions in a array*/
	$scope.addQuestions=[{
		id: 1,
		subQuestion:[]
	}];

	/*For managing multiple choice questions*/
	$scope.multiChoice = [{
		id: 0,
		option: "option 1"
	},
	{
		id: 1,
		option: "option 2"
	},
	{
		id: 2,
		option: "option 3"
	},
	{
		id: 3,
		option: "option 4"
	},
	{
		id: 4,
		option: "option 5"
	}];

	/*On clicking on add new question, it will add a new question field*/
	$scope.addMoreQuestion = function(form) {	
		$scope.isSubmitted=true;
		if(!form.$valid){
			return false;
		}else{
			var optnLength = $scope.addQuestions.length;
			var id = optnLength + 1;
			var addQuesObj = {};
			addQuesObj.id = id;
			addQuesObj.subQuestion=[];
			$scope.addQuestions.push(addQuesObj);
		}
	}

	/*Sub question order*/
	var subOrder ="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	$scope.subOrder =subOrder.split('');

	/*On clicking add sub question*/
	/*On clicking on add sub question, it will add a new sub question field*/
	$scope.addSubQuestionField = function(indexMain) {
		var newArr =  $scope.addQuestions.map(function(el) {
			if (el.id==(indexMain+1)) {
				var id = indexMain + 1;
				var addQuesObj = {};
				addQuesObj.id = id;
				el.subQuestion.push(addQuesObj);
			};
			return el;
		})
	}


	/*Handle main question here*/
	$scope.addQuestionData=function(form){
		if (!form.$valid) {
			return false;
		}else{			
			var data={questionData:JSON.stringify($scope.addQuestions)};
			appDB
			.callPostForm('question/add-question',data) 
			.then(function success(data){ 
				console.log("data ",data);
				if(data.code == 200 && data.status == 1){
					$scope.questionData=data.response;
					$scope.questionMsg=data.message;
					$scope.questionErrorMsg="";
					form.$setPristine();
					$scope.ques={};
					alert("Questions have been added successfully!");
				}
			},
			function error(data){ 
				console.log("data err  ",data);
				$scope.questionErrorMsg=data.message;
				$scope.questionMsg="";
				alert("There is a problem while adding questions, please try again later!");
			});
		}
	}

	/*On clicking cancel button*/
	$scope.cancel = function($event) {
		$event.stopPropagation();
	}



}]);