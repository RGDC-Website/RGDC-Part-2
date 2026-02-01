app.service("RGDCWebApplicationService", function ($http) {

    //Email Check
    this.checkEmail = function (email) {
        return $http({
            method: 'POST',
            url: '/RGDC/CheckEmail', 
            data: { email: email }
        });
    };

    //Sign Up
    this.signUp = function (accDetails) {
        return $http({
            method: 'POST',
            url: '/RGDC/signUpAcc',
            data: accDetails
        });
    };

    //Get Genders
    this.getGender = function () {
        return $http.get("/RGDC/getGender");
    };

    //Log In
    this.login = function (loginData) {
        return $http({
            method: "post",
            url: "/RGDC/login",
            data: loginData
        })
    }

    //Get Sessions
    this.getSessionVariable = function () {
        return $http.get("/RGDC/getSessionVariable");
    };


});