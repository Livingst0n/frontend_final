var app = angular.module('finalProject', ['ngRoute']);

app.config(function ($routeProvider) {
    $routeProvider
        .when('/',
        {
            controller: 'FoodLog',
            templateUrl: 'FoodLog.html'
        })
});

app.controller('FoodLog', function ($scope, $http) {
    Parse.initialize("xplNIJGjeYGDlvdD9pRPyr01oOnACBSIiSPbFSJ3", "thYgHfjOBxBSFaZCpGpZqUf2pdilhPBTcPS7lBXD");
    var foodItemUrl = "https://xplNIJGjeYGDlvdD9pRPyr01oOnACBSIiSPbFSJ3:javascript-key=thYgHfjOBxBSFaZCpGpZqUf2pdilhPBTcPS7lBXD@api.parse.com/1/classes/FoodItem";
    $scope.foodItems = [];
    $scope.foodItem = {
        protein: '',
        carbs: '',
        fat: ''
    };

    $scope.dailyItem = {
        protein: '',
        carbs: '',
        fat: '',
        calories: ''
    };

    $scope.totalItem = {
        protein: '',
        carbs: '',
        fat: '',
        calories: ''
    };

    var date = new Date();
    $scope.todayDate = date.toDateString();

    getDailyFood();

    getFood();

    getDailyTotals();
    
    $scope.$watchCollection('foodItem', calculateCalories);

    function calculateCalories(foodItem) {
        if ($scope.foodItem.protein === '' && $scope.foodItem.carbs === '' && $scope.foodItem.fat === '') {
            $scope.calorieAmount = "";
        } else {
            $scope.calorieAmount = (foodItem.protein * 4) + (foodItem.carbs * 4) + (foodItem.fat * 9);
        }

        //validate number fields
        if (isNaN($scope.calorieAmount)) {
            $scope.calorieAmount = "Numbers only for Protein, Carbs and Fat fields";
        }
    }

    //add Food and validate on click
    $scope.addFood = function () {
        if (isNaN($scope.calorieAmount) || $scope.calorieAmount === "") { //failed logic goes here
            if (isNaN($scope.foodItem.protein)) {
                $scope.proteinError = "Protein must be a number";
            }
            if (isNaN($scope.foodItem.carbs)) {
                $scope.carbsError = "Carbs must be a number";
            }
            if (isNaN($scope.foodItem.fat)) {
                $scope.fatError = "Fat must be a number";
            }
            if ($scope.calorieAmount === "") {
                $scope.calorieAmount = "Please enter at  food";
            }
        } else { //successful logic goes here
            //reset error fields
            $scope.proteinError = "";
            $scope.carbsError = "";
            $scope.fatError = "";

            //if Food's name or macros are empty, set them to generic
            if (!$scope.foodItem.name) {
                $scope.foodItem.name = "Food #1";
            }
            if (!$scope.foodItem.protein) {
                $scope.foodItem.protein = 0;
            }
            if (!$scope.foodItem.carbs) {
                $scope.foodItem.carbs = 0;
            }
            if (!$scope.foodItem.fat) {
                $scope.foodItem.fat = 0;
            }

            var Food = Parse.Object.extend("Food");
            var food = new Food();
            food.save({ name: $scope.foodItem.name, protein: $scope.foodItem.protein.toString(), carbs: $scope.foodItem.carbs.toString(), fat: $scope.foodItem.fat.toString(), date: $scope.todayDate });
            //$scope.$apply();

            //push food item
            $scope.foodItems.push(
                {
                    name: $scope.foodItem.name,
                    protein: $scope.foodItem.protein,
                    carbs: $scope.foodItem.carbs,
                    fat: $scope.foodItem.fat,
                    calories: $scope.calorieAmount
                }
            );

            $scope.dailyProtein -= $scope.foodItem.protein;
            $scope.dailyCarbs -= $scope.foodItem.carbs;
            $scope.dailyFat -= $scope.foodItem.fat;
            $scope.dailyCalories -= $scope.calorieAmount;

            $scope.totalProtein += parseInt($scope.foodItem.protein);
            $scope.totalCarbs += parseInt($scope.foodItem.carbs);
            $scope.totalFat += parseInt($scope.foodItem.fat);
            $scope.totalCalories += $scope.calorieAmount;
            console.log($scope.totalProtein);
            console.log($scope.foodItem.protein);

            $scope.foodItem.name = "";
            $scope.foodItem.protein = '';
            $scope.foodItem.carbs = '';
            $scope.foodItem.fat = '';
            $scope.calorieAmount = '';
        }
    }

    $scope.resetAll = function () {
        var Food = Parse.Object.extend("Food");
        var queryFood = new Parse.Query(Food);
        queryFood.equalTo("date", $scope.todayDate);
        queryFood.find({
            success: function (myObj) {
                for (var i = 0; i < myObj.length; i++) {
                    myObj[i].destroy({});
                }
                $scope.foodItems = [];
                $scope.$apply();
            },
            error: function (object, error) {
                alert("something broke" + " " + error.code + " " + error.message);
            }
        });

        getDailyFood();

        getDailyTotals();
    }

    $scope.deleteItem = function (item) {
        var index = $scope.foodItems.indexOf(item);
        var itemDeleted = false;
        $scope.foodItems.splice(index, 1);
        var Food = Parse.Object.extend('Food');
        var queryFood = new Parse.Query(Food);
        queryFood.equalTo("date", $scope.todayDate);
        queryFood.find({
            success: function (results) {
                for (var i = 0; i < results.length; i++) {
                    if (item.name === results[i].get('name') && item.protein.toString() === results[i].get('protein') && item.carbs.toString() === results[i].get('carbs') && item.fat.toString() === results[i].get('fat') && !itemDeleted) {
                        $scope.dailyProtein += parseInt(results[i].get('protein'));
                        $scope.dailyCarbs += parseInt(results[i].get('carbs'));
                        $scope.dailyFat += parseInt(results[i].get('fat'));
                        $scope.dailyCalories += parseInt((results[i].get('protein') * 4) + (results[i].get('carbs') * 4) + (results[i].get('fat') * 9));
                        $scope.$apply();
                        results[i].destroy({});
                        itemDeleted = true;
                    }
                }
            },
            error: function (error) {
                alert("something broke " + error.code + " " + error.message);
            }
        });
        getDailyTotals();
    }

    $scope.updateItem = function (item) {
        var itemDeleted = false;
        var Food = Parse.Object.extend('Food');
        var queryFood = new Parse.Query(Food);
        queryFood.find({
            success: function (results) {
                for (var i = 0; i < results.length; i++) {
                    if (item.name === results[i].get('name') && item.protein.toString() === results[i].get('protein') && item.carbs.toString() === results[i].get('carbs') && item.fat.toString() === results[i].get('fat') && !itemDeleted) {
                        $scope.dailyProtein += parseInt(results[i].get('protein'));
                        $scope.dailyCarbs += parseInt(results[i].get('carbs'));
                        $scope.dailyFat += parseInt(results[i].get('fat'));
                        $scope.dailyCalories += parseInt((results[i].get('protein') * 4) + (results[i].get('carbs') * 4) + (results[i].get('fat') * 9));
                        $scope.foodItem.name = results[i].get('name');
                        $scope.foodItem.protein = parseInt(results[i].get('protein'));
                        $scope.foodItem.carbs = parseInt(results[i].get('carbs'));
                        $scope.foodItem.fat = parseInt(results[i].get('fat'));
                        var index = $scope.foodItems.indexOf(item);
                        $scope.foodItems.splice(index, 1);
                        $scope.$apply();
                        results[i].destroy({});
                        itemDeleted = true;
                    }
                }
            },
            error: function (error) {
                alert("something broke " + error.code + " " + error.message);
            }
        });
        getDailyTotals();
    }

    $scope.prevDay = function () {

        $scope.foodItems = [];
        var offset = new Date(date.setDate(date.getDate() - 1));
        $scope.compareTodayDate = offset;
        $scope.todayDate = offset.toDateString();

        getDailyFood();

        getFood();

        getDailyTotals();

    }

    $scope.nextDay = function () {
        $scope.foodItems = [];
        var todayDate = new Date();
        var dateString = new Date();

        if (!$scope.compareTodayDate) {
            $scope.compareTodayDate = todayDate;
        }
      
        if ($scope.compareTodayDate.setDate($scope.compareTodayDate.getDate() + 1) < todayDate) {
            dateString = new Date(date.setDate(date.getDate() + 1));
            $scope.compareTodayDate = dateString;
            $scope.todayDate = dateString.toDateString();
        } else {
            $scope.calorieAmount = "You can't travel to the future, only the past!";
        }

        getDailyFood();

        getFood();

        getDailyTotals();

    }

    function getFood() {
        var Food = Parse.Object.extend("Food");
        var queryFoodItems = new Parse.Query(Food);
        queryFoodItems.equalTo("date", $scope.todayDate);
        queryFoodItems.find({
            success: function (results) {
                //getting all the food items.
                for (var i = 0; i < results.length; i++) {
                    var food_name = results[i].get('name');
                    var food_protein = results[i].get('protein');
                    var food_carbs = results[i].get('carbs');
                    var food_fat = results[i].get('fat');
                    //pushing to the array which display in the $scope
                    $scope.foodItems.push(
                    {
                        name: food_name,
                        protein: food_protein,
                        carbs: food_carbs,
                        fat: food_fat,
                        calories: (food_protein * 4) + (food_carbs * 4) + (food_fat * 9)
                    });
                    $scope.$apply();
                }

                setTimeout(function () {
                    for (var i = 0; i < $scope.foodItems.length; i++) {
                        $scope.dailyProtein -= $scope.foodItems[i].protein;
                        $scope.dailyCarbs -= $scope.foodItems[i].carbs;
                        $scope.dailyFat -= $scope.foodItems[i].fat;
                        var tempCals = ($scope.dailyProtein * 4) + ($scope.dailyCarbs * 4) + ($scope.dailyFat * 9);
                        tempCals = $scope.dailyCalories - tempCals;
                        $scope.dailyCalories -= tempCals;
                        $scope.$apply();
                    }
                }, 100);
                //deduct from daily needs depending on how many food items are in the database
            },
            error: function (error) {
                alert("something broke" + " " + error.code + " " + error.message);
            }
        });
    }

    function getDailyFood() {
        var DailyFood = Parse.Object.extend("DailyFood");
        var queryDailyFood = new Parse.Query(DailyFood);
        queryDailyFood.find({
            success: function (results) {
                //getting daily amounts
                var daily_protein = results[0].get('protein');
                var daily_carbs = results[0].get('carbs');
                var daily_fat = results[0].get('fat');
                //setting in the $scope
                $scope.dailyProtein = daily_protein;
                $scope.dailyCarbs = daily_carbs;
                $scope.dailyFat = daily_fat;
                $scope.dailyCalories = ($scope.dailyProtein * 4) + ($scope.dailyCarbs * 4) + ($scope.dailyFat * 9);
                $scope.$apply();
            },
            error: function (error) {
                alert("something broke" + " " + error.code + " " + error.message);
            }
        });
    }

    function getDailyTotals() {
        var DailyFood = Parse.Object.extend("DailyFood");
        var queryDailyFood = new Parse.Query(DailyFood);
        queryDailyFood.find({
            success: function (results) {
                //getting daily amounts
                var daily_protein = results[0].get('protein');
                var daily_carbs = results[0].get('carbs');
                var daily_fat = results[0].get('fat');
                setTimeout(function () {
                    $scope.totalProtein = daily_protein - $scope.dailyProtein;
                    $scope.totalCarbs = daily_carbs - $scope.dailyCarbs;
                    $scope.totalFat = daily_fat - $scope.dailyFat;
                    $scope.totalCalories = ($scope.totalProtein * 4) + ($scope.totalCarbs * 4) + ($scope.totalFat * 9);
                    $scope.$apply();
                }, 200);
                
            },
            error: function (error) {
                alert("something broke" + " " + error.code + " " + error.message);
            }
        });
    }
    
});