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

    this.signUpPatient = function (accDetails) {
        return $http({
            method: 'POST',
            url: '/RGDC/signUpPatient',
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

    this.getOwnPatientDetails = function () {
        return $http.get("/RGDC/getOwnPatientDetails");
    }

    this.getAdminScheduledAppointments = function () {
        return $http.get("/RGDC/GetAdminScheduledAppointments");
    };

    this.updateAppointment = function (appointmentData) {
        return $http({
            method: 'POST',
            url: '/RGDC/UpdateAppointment',
            data: appointmentData
        });
    };

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

    // primary signature uploader
    this.uploadSignature = function (file) {
        var formData = new FormData();
        formData.append('file', file);

        return $http({
            method: "POST",
            url: "/RGDC/UploadSignature",
            data: formData,
            headers: { 'Content-Type': undefined },
            transformRequest: angular.identity
        });
    };

    this.savePatientSignature = function (imagePath) {
        return $http({
            method: "POST",
            url: "/RGDC/SavePatientSignature",
            data: { imagePath: imagePath }
        });
    };

    if (typeof this.uploadSignature !== 'function') {
        var self = this;
        this.uploadSignature = function (file) {
            return self.uploadFile(file);
        };
    }

    if (typeof this.savePatientSignature !== 'function') {
        this.savePatientSignature = function (imagePath) {
            return $http({
                method: "POST",
                url: "/RGDC/SavePatientSignature",
                data: { imagePath: imagePath }
            });
        };
    }


    this.logOut = function () {
        return $http.get("/RGDC/logOut");
    };

    this.updateMedHist = function (medHist) {
        return $http({
            method: 'POST',
            url: '/RGDC/updateMedHist',
            data: medHist
        });
    };

    this.updateMedHistIni = function (prevPhys) {
        return $http({
            method: 'POST',
            url: '/RGDC/updateMedHistIni',
            data: prevPhys
        });
    };

    
    this.getPatientTreatment = function () {
        return $http.get("/RGDC/getPatientTreatment");
    };

    this.patientPersonalInfo = function () {
        return $http.get("/RGDC/patientPersonalInfo");
    };
});