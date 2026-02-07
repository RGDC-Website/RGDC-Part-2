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

    this.getAuthEmail = function () {
        return $http.get("/RGDC/GetAuthEmail");
    };

    //Reset Password
    this.sendOTP = function (forgot_email) {
        return $http({
            method: "post",
            url: "/RGDC/sendOTP",
            data: forgot_email
        });
    }

    this.resetPassword = function (info) {
        return $http({
            method: "post",
            url: "/RGDC/resetPassword",
            data: info
        });
    }

    this.getPatientList = function () {
        return $http.get("/RGDC/getPatientList");
    }

    this.goToPatient = function (patientID) {
        return $http({
            method: "post",
            url: "/RGDC/goToPatient",
            data: patientID
        });
    }

    this.getSelectedPatientDetails = function () {
        return $http.get("/RGDC/getSelectedPatientDetails");
    }

    this.updatePatient = function (patientData) {
        return $http({
            method: "post",
            url: "/RGDC/UpdatePatient",
            data: patientData
        });
    }

    this.getImageService = function () {
        return $http.get("/RGDC/GetImages");
    };

    this.uploadFile = function (file) {
        var formData = new FormData();
        formData.append('file', file);

        var response = $http({
            method: "POST",
            url: "/RGDC/Upload",
            data: formData,
            headers: {
                'Content-Type': undefined
            },
            transformRequest: angular.identity
        });
        return response;
    };
});