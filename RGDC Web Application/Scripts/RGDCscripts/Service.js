app.service("RGDCWebApplicationService", function ($http) {

    //Email Check
    this.checkEmail = function (email, excludeAccID) {
        return $http({
            method: 'POST',
            url: '/RGDC/CheckEmail',
            data: { email: email, excludeAccID: excludeAccID }
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

    this.getBranch = function () {
        return $http.get("/RGDC/getBranch");
    };

    this.getPostOp = function () {
        return $http.get("/RGDC/getPostOp");
    };

    //Log In
    this.login = function (loginData) {
        return $http({
            method: "post",
            url: "/RGDC/login",
            data: loginData
        })
    }

    this.savePostOp = function (postOp) {
        return $http({
            method: "post",
            url: "/RGDC/savePostOp",
            data: postOp
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

    this.verifyOTP = function (otp) {
        return $http({
            method: "post",
            url: "/RGDC/verifyOTP",
            data: otp
        });
    }

    this.sendEmail = function (user_email) {
        return $http({
            method: "post",
            url: "/RGDC/sendEmail",
            data: user_email
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

    this.getPayments = function () {
        return $http.get("/RGDC/getPayments");
    }
    this.getOwnPayments = function () {
        return $http.get("/RGDC/getOwnPayments");
    }

    this.getDentists = function () {
        return $http.get("/RGDC/getDentists");
    }

    this.goToPatient = function (patientID) {
        return $http({
            method: "post",
            url: "/RGDC/goToPatient",
            data: patientID
        });
    }

    this.addPayment = function (paymentData) {
        return $http.post('/RGDC/addPayment', paymentData);
    };

    this.getPaymentInfo = function (paymentData) {
        return $http({
            method: "post",
            url: "/RGDC/getPaymentInfo",
            data: paymentData
        });
    };

    this.selectRemove = function (addID) {
        return $http({
            method: "post",
            url: "/RGDC/selectRemove",
            data: { addID: addID }
        });
    };

    this.updatePayment = function (data) {
        return $http.post('/RGDC/updatePayment', data);
    };

    this.deletePayment = function (id) {
        return $http.post('/RGDC/deletePayment', id);
    };

    this.undeletePayment = function (id) {
        return $http.post('/RGDC/undeletePayment', id);
    };
    this.getSelectedPatientDetails = function () {
        return $http.get("/RGDC/getSelectedPatientDetails");
    }
    this.getPending = function () {
        return $http.get("/RGDC/getPending");
    }

    this.saveDentalChart = function (payload) {
        return $http({
            method: "post",
            url: "/RGDC/SaveDentalChart",
            data: payload
        });
    };

    this.getPatientImages = function (patientID) {
        return $http.get("/RGDC/GetPatientImages?patientID=" + encodeURIComponent(patientID));
    };

    this.deletePostOp = function () {
        return $http.post('/RGDC/deletePostOp');
    }



    this.getOwnPatientDetails = function () {
        return $http.get("/RGDC/getOwnPatientDetails");
    }
    this.getDentistID = function () {
        return $http.get("/RGDC/getDentistID");
    }

    this.getAdminScheduledAppointments = function () {
        return $http.get("/RGDC/GetAdminScheduledAppointments");
    };

    this.getNextAppointmentForPatient = function (patientID) {
        return $http.get("/RGDC/GetNextAppointmentForPatient?patientID=" + encodeURIComponent(patientID));
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

    this.addAccount = function (accountData) {
        return $http({
            method: "post",
            url: "/RGDC/addAccount",
            data: accountData
        });
    };

    this.addOwner = function (ownerEmail) {
        return $http({
            method: "post",
            url: "/RGDC/addOwner",
            data: ownerEmail
        });
    };

    this.addDentist = function (dentistEmail) {
        return $http({
            method: "post",
            url: "/RGDC/addDentist",
            data: dentistEmail
        });
    };

    this.addStaff = function (staffEmail) {
        return $http({
            method: "post",
            url: "/RGDC/addStaff",
            data: staffEmail
        });
    };

    this.signUpStaff = function (staffData) {
        return $http({
            method: "post",
            url: "/RGDC/signUpStaff",
            data: staffData
        });
    };

    this.signUpDentist = function (dentistData) {
        return $http({
            method: "post",
            url: "/RGDC/signUpDentist",
            data: dentistData
        });
    };

    this.removeFromQueue = function (emailQueue) {
        return $http({
            method: "post",
            url: "/RGDC/removeFromQueue",
            data: emailQueue
        });
    };

    this.signUpOwner = function (ownerData) {
        return $http({
            method: "post",
            url: "/RGDC/signUpOwner",
            data: ownerData
        });
    };


    this.checkAddQueue = function (signUpStaffData) {
        return $http({
            method: "post",
            url: "/RGDC/checkAddQueue",
            data: signUpStaffData
        });
    };

    this.deleteOwner = function (ownerAcc) {
        return $http({
            method: "post",
            url: "/RGDC/deleteOwner",
            data: ownerAcc
        });
    };

    this.deleteStaff = function (staffAcc) {
        return $http({
            method: "post",
            url: "/RGDC/deleteStaff",
            data: staffAcc
        });
    };


    this.deletePatient = function (patAcc) {
        return $http({
            method: "post",
            url: "/RGDC/deletePatient",
            data: patAcc
        });
    };

    this.deleteDentist = function (dentistAcc) {
        return $http({
            method: "post",
            url: "/RGDC/deleteDentist",
            data: dentistAcc
        });
    };

    this.selectOwner = function (ownerAcc) {
        return $http({
            method: "post",
            url: "/RGDC/selectOwner",
            data: ownerAcc
        });
    };

    this.selectDentist = function (dentistAcc) {
        return $http({
            method: "post",
            url: "/RGDC/selectDentist",
            data: dentistAcc
        });
    };

    this.selectDentist = function (dentistAcc) {
        return $http({
            method: "post",
            url: "/RGDC/selectDentist",
            data: dentistAcc
        });
    };

    this.selectStaff = function (staffAcc) {
        return $http({
            method: "post",
            url: "/RGDC/selectStaff",
            data: staffAcc
        });
    };

    this.getStaffData = function () {
        return $http({
            method: "post",
            url: "/RGDC/getStaffData",
        });
    };

    this.getOwnerData = function () {
        return $http({
            method: "post",
            url: "/RGDC/getOwnerData",
        });
    };

    this.getDentistData = function () {
        return $http({
            method: "post",
            url: "/RGDC/getDentistData",
        });
    };

    this.editAccount = function (accDet) {
        return $http({
            method: "post",
            url: "/RGDC/updateAccount",
            data: accDet
        });
    };

    this.editOwner = function (ownerDet) {
        return $http({
            method: "post",
            url: "/RGDC/updateOwner",
            data: ownerDet
        });
    };

    this.editDentist = function (dentistDet) {
        return $http({
            method: "post",
            url: "/RGDC/updateDentist",
            data: dentistDet
        });
    };

    this.editStaff = function (staffDet) {
        return $http({
            method: "post",
            url: "/RGDC/updateStaff",
            data: staffDet
        });
    };

    this.addProgNotes = function (paymentData) {
        return $http({
            method: "post",
            url: "/RGDC/addProgNotes",
            data: paymentData
        });
    };

    this.selectPlan = function (trtPlan) {
        return $http({
            method: "post",
            url: "/RGDC/selectPlan",
            data: trtPlan
        });
    };

    this.editProgressNotes = function (updatedProgNote) {
        return $http({
            method: "post",
            url: "/RGDC/editProgressNotes",
            data: updatedProgNote
        });
    };

    this.deletePlan = function (trtPlan) {
        return $http({
            method: "post",
            url: "/RGDC/deletePlan",
            data: trtPlan
        });
    };

    this.getDentistOwner = function () {
        return $http.get("/RGDC/getDentistOwner");
    };

    this.getOverviewData = function () {
        return $http.get('/RGDC/getOverviewData');
    };

    this.getAnalyticsData = function () {
        return $http.get('/RGDC/getAnalyticsData');
    };

    this.getPatientTreatment = function () {
        return $http.get("/RGDC/getPatientTreatment");
    };

    this.patientPersonalInfo = function () {
        return $http.get("/RGDC/patientPersonalInfo");
    };

    this.getDentistList = function () {
        return $http.get("/RGDC/GetDentistList");
    };

    this.getPatientListForAppointment = function () {
        return $http.get("/RGDC/GetPatientListForAppointment");
    };

    this.getCurrentDentist = function () {
        return $http.get('/RGDC/GetCurrentDentist');
    };

    this.getCurrentUserPhoto = function () {
        return $http.get('/RGDC/GetCurrentUserPhoto');
    };

    this.createAppointmentRequest = function (appointmentData) {
        return $http({
            method: 'POST',
            url: '/RGDC/CreateAppointmentRequest',
            data: appointmentData
        });
    };


    //profile picsssssssssss
    this.uploadUserPhoto = function (file, accID) {
        var formData = new FormData();
        formData.append('file', file);
        if (typeof accID !== 'undefined' && accID !== null) formData.append('accID', accID);

        return $http({
            method: "POST",
            url: "/RGDC/UploadUserPhoto",
            data: formData,
            headers: { 'Content-Type': undefined },
            transformRequest: angular.identity
        });
    };

    this.getRequestedAppointments = function () {
        return $http.get("/RGDC/GetRequestedAppointments");
    };

    this.getPastAppointments = function () {
        return $http.get('/RGDC/GetPastAppointments');
    };

    this.archiveAppointment = function (apptID) {
        var payload = (typeof apptID === 'object') ? apptID : { apptID: apptID };
        return $http({
            method: 'POST',
            url: '/RGDC/ArchiveAppointment',
            data: (function (obj) {
                var str = [];
                for (var p in obj) if (obj.hasOwnProperty(p)) {
                    str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
                }
                return str.join('&');
            })(payload),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
        });
    };

    this.cancelAppointment = function (apptID) {
        var payload = (typeof apptID === 'object') ? apptID : { apptID: apptID };
        return $http({
            method: 'POST',
            url: '/RGDC/CancelAppointment',
            data: (function (obj) {
                var str = [];
                for (var p in obj) if (obj.hasOwnProperty(p)) {
                    str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
                }
                return str.join('&');
            })(payload),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
        });
    };

    this.acceptAppointment = function (apptID) {
        var payload = (typeof apptID === 'object') ? apptID : { apptID: apptID };
        // Send as form urlencoded so MVC will bind primitive apptID parameter reliably
        return $http({
            method: 'POST',
            url: '/RGDC/AcceptAppointment',
            data: (function (obj) {
                var str = [];
                for (var p in obj) if (obj.hasOwnProperty(p)) {
                    str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
                }
                return str.join('&');
            })(payload),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
        });
    };

    this.denyAppointment = function (payload) {
        // Accept either a primitive apptID or an object { apptID, reason }
        payload = (typeof payload === 'object') ? payload : { apptID: payload };
        return $http({
            method: 'POST',
            url: '/RGDC/DenyAppointment',
            data: (function (obj) {
                var str = [];
                for (var p in obj) if (obj.hasOwnProperty(p)) {
                    str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
                }
                return str.join('&');
            })(payload),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
        });
    };


    // create appointment
    this.createAppointment = function (appointment) {
        return $http({
            method: "POST",
            url: "/RGDC/CreateAppointment",
            data: appointment
        });
    };


    this.createScheduledAppointment = function (appointmentData) {
        return $http({
            method: 'POST',
            url: '/RGDC/CreateScheduledAppointment',
            data: appointmentData
        });
    };

    this.deleteAppointment = function (apptID) {
        var payload = (typeof apptID === 'object') ? apptID : { apptID: apptID };
        return $http({
            method: 'POST',
            url: '/RGDC/DeleteAppointment',
            data: (function (obj) {
                var str = [];
                for (var p in obj) if (obj.hasOwnProperty(p)) {
                    str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
                }
                return str.join('&');
            })(payload),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
        });
    };

    // clinic staff function
    this.getClinicStaff = function (apptID) {
        return $http({
            method: "POST",
            url: "/RGDC/getClinicStaff",
        });
    };

    //google calendar CODDDDDDEEEEESSSSSSSSSSS
    this.connectGoogle = function () {
        return $http.get('/RGDC/ConnectGoogle');
    };

    this.toggleGoogleCalendar = function (enabled) {
        return $http.post('/RGDC/ToggleGoogleCalendar', { enabled: enabled });
    };

    this.createGoogleEvent = function (apptID) {
        return $http.post('/RGDC/CreateGoogleEvent', { apptID: apptID });
    };



    this.addProgNotes = function (progressNotes) {
        return $http({
            method: "post",
            url: "/RGDC/addProgNotes",
            data: progressNotes
        });
    };


    //displaying of forms
    this.getPatientForms = function () {
        return $http.get("/RGDC/GetPatientForms");
    };

    // Delete form
    this.deleteForm = function (formID) {
        return $http({
            method: "POST",
            url: "/RGDC/DeleteForm",
            data: { formID: formID }
        });
    };

    this.saveDentistSignature = function (imagePath) {
        return $http({
            method: "POST",
            url: "/RGDC/SaveDentistSignature",
            data: { imagePath: imagePath }
        });
    };

    this.getDentistSchedule = function (dentistID) {
        return $http.get('/RGDC/GetDentistSchedule?dentistID=' + encodeURIComponent(dentistID));
    };

    this.saveDentistSchedule = function (scheduleArray) {
        // scheduleArray = [{ dentistID, dayOfWeek, startTime: "HH:mm", endTime: "HH:mm", slotMinutes }]
        return $http({
            method: 'POST',
            url: '/RGDC/SaveDentistSchedule',
            data: scheduleArray
        });
    };
});