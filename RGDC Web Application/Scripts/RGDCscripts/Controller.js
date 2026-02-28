app.controller("RGDCWebApplicationController", function ($scope, $timeout, RGDCWebApplicationService, $http) {

    $scope.signaturePreview = null;
    $scope._uploadedSignaturePath = null;

    $scope.currentUserName = "";
    $scope.currentUserID = "";
    const STRENGTH = {
        WEAK: 'Weak',
        FAIR: 'Fair',
        GOOD: 'Good',
        STRONG: 'Strong'
    };
    $scope.showPatientForm = false;
    $scope.isUserOwner = false;
    $scope.isUserAdmin = false;
    $scope.isUserPatient = false;
    $scope.medical = {
        history: {
            women: {},
            other: {}
},
        conditions: {}
    };
    $scope.currentUserAuthorization;
    $scope.paymentsArray = [];
    $scope.paymentID;


    $scope.hasSpecialChar = function (pwd) {
        if (!pwd) return false;
        return /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(pwd);
    };

    $scope.passwordStrength = '';
    $scope.strengthColor = '';
    $scope.passwordsMatch = true;
    $scope.signUp_emailLocked = false;

    $scope.checkPasswordStrength = function () {
        const pwd = $scope.signUp_password || '';
        if (!pwd) {
            $scope.passwordStrength = '';
            $scope.strengthColor = '';
            $scope.pwdChecks = { length: false, upper: false, lower: false, number: false, special: false };
            return;
        }

        let score = 0;
        const checks = {
            length: pwd.length >= 8,
            upper: /[A-Z]/.test(pwd),
            lower: /[a-z]/.test(pwd),
            number: /\d/.test(pwd),
            special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(pwd)
        };

        // expose individual checks for the view
        $scope.pwdChecks = angular.copy(checks);

        for (const k in checks) {
            if (checks[k]) score++;
        }

        if (score <= 2) {
            $scope.passwordStrength = STRENGTH.WEAK;
            $scope.strengthColor = 'weak-strength';
        } else if (score === 3) {
            $scope.passwordStrength = STRENGTH.FAIR;
            $scope.strengthColor = 'fair-strength';
        } else if (score === 4) {
            $scope.passwordStrength = STRENGTH.GOOD;
            $scope.strengthColor = 'good-strength';
        } else {
            $scope.passwordStrength = STRENGTH.STRONG;
            $scope.strengthColor = 'strong-strength';
        }
    };

    $scope.checkPasswordMatch = function () {
        $scope.passwordsMatch = ($scope.signUp_password === $scope.signUp_confPassword);
    };

    // Watchers to update UI reactively
    $scope.$watch('signUp_password', function () {
        $scope.checkPasswordStrength();
        $scope.checkPasswordMatch();
    });

    $scope.$watch('signUp_confPassword', function () {
        $scope.checkPasswordMatch();
    });

    $scope.isPasswordValid = function () {
        // require all password checks to pass and passwords to match
        if (!$scope.signUp_password || !$scope.signUp_confPassword) return false;
        if (!$scope.passwordsMatch) return false;
        const c = $scope.pwdChecks || {};
        return !!(c.length && c.upper && c.lower && c.number && c.special);
    };

    // Email validation
    $scope.emailValid = false;

    $scope.emailChecks = { hasAt: false, noSpace: true, hasDotAfterAt: false };

    // track active input to show/hide requirement helpers
    $scope.active = '';

    $scope.hasValidEmail = function (email) {
        if (!email) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    $scope.checkEmail = function () {
        const email = $scope.signUp_email || '';
        $scope.emailValid = $scope.hasValidEmail(email);
        $scope.emailChecks.hasAt = /@/.test(email);
        $scope.emailChecks.noSpace = !/\s/.test(email);
        const atIndex = email.indexOf('@');
        $scope.emailChecks.hasDotAfterAt = atIndex > -1 && email.indexOf('.', atIndex) > atIndex + 1;
    };

    $scope.$watch('signUp_email', function () {
        $scope.checkEmail();
    });

    $scope.isFormValid = function () {
        return $scope.isPasswordValid() && $scope.emailValid;
    };

    // Field-level validity helpers for input border styling
    $scope.isEmailFieldValid = function () {
        return $scope.emailValid;
    };

    $scope.isPasswordFieldValid = function () {
        // consider valid if at least FAIR (not Weak)
        return $scope.passwordStrength && $scope.passwordStrength !== STRENGTH.WEAK;
    };

    $scope.isConfirmFieldValid = function () {
        return $scope.signUp_confPassword && $scope.passwordsMatch;
    };

    $scope.isBirthDateFieldValid = function () {
        return !!$scope.signUp_birthDate;
    };

    $scope.isContactFieldValid = function () {
        // require at least 10 digits
        const num = ($scope.signUp_contactNumber || '').toString();
        return num.length >= 10;
    };

    $scope.isAddressFieldValid = function () {
        return !!$scope.signUp_address && $scope.signUp_address.trim().length > 0;
    };

    $scope.isCurrentPhysicianValid = function () {
        // optional field: valid if empty or has characters
        return !!$scope.signUp_currentPhysician && $scope.signUp_currentPhysician.trim().length > 0;
    };

    $scope.isLastVisitFieldValid = function () {
        return !!$scope.signUp_lastVisit;
    };


    $scope.signUpInitial = function () {

        var getEmail = RGDCWebApplicationService.checkEmail($scope.signUp_email);
        getEmail.then(function (returnedData) {
            if (!returnedData.data.exists) {
                var modal = document.getElementById("patientInformationForm");
                if (modal) {
                    modal.style.display = "block";
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Email is already in use",
                        text: "Enter another email address",
                    });
                    return;
                }
            }
        });
    };

    $scope.editPayRec = function (paymentID) {
        $scope.getPatientsNDentist();
        var paymentData = {
            paymentID: paymentID
        }
        var getPaymentInfo = RGDCWebApplicationService.getPaymentInfo(paymentData);
        getPaymentInfo.then(function (payment) {
            $scope.paymentInfo = payment.data;
            console.log($scope.paymentInfo)
        });
    }

    $scope.deletePayRec = function (paymentID) {
        $scope.deletePayment = paymentID
    }

    $scope.deletePaymentThis = function () {
        var paymentData = {
            paymentID: $scope.deletePayment
        }
        RGDCWebApplicationService.deletePayment(paymentData)
            .then(function (response) {
                console.log("success")
                window.location.href = "/RGDC/adminFinance";
            });
    }

    $scope.editPayment = function () {

        var data = {
            paymentID: $scope.paymentInfo.paymentID,
            paymentMethod: $scope.paymentInfo.paymentMethod,
            cost: $scope.paymentInfo.cost,
            discount: $scope.paymentInfo.discount,
            amountPaid: $scope.paymentInfo.amountPaid,
            amountDue: $scope.paymentInfo.amountDue,
            description: $scope.paymentInfo.description
        };

        console.log("Updating:", data);

        RGDCWebApplicationService.updatePayment(data)
            .then(function (response) {
                window.location.href = "/RGDC/adminFinance";
});
    };

    $scope.signUpRemove = function () {
        var modal = document.getElementById("patientInformationForm");
        if (modal) {
            modal.style.display = "none";
        }
    }

    $scope.getGender = function () {
        // load gender lookup from server
        RGDCWebApplicationService.getGender()
            .then(function (returnedData) {
                $scope.genderArray = returnedData.data || [];

                // ensure genderIDs are numbers (server may return strings)
                $scope.genderArray.forEach(function (g) {
                    if (g && typeof g.genderID !== 'undefined') g.genderID = parseInt(g.genderID, 10);
                });

                // If a patient is already loaded, coerce model to numeric and ensure it's present in list
                if ($scope.selectedPatient && typeof $scope.selectedPatient.genderID !== 'undefined' && $scope.selectedPatient.genderID !== null) {
                    $scope.selectedPatient.genderID = parseInt($scope.selectedPatient.genderID, 10);
                }
            })
            .catch(function (err) {
                console.error('Failed to load genders', err);
                $scope.genderArray = [];
            });
    };

    $scope.signUp = function () {

        try {
            var birthDate = new Date($scope.signUp_birthDate);
            birthDate.setHours(0, 0, 0, 0); // 00:00:00

            if ($scope.signUp_firstName && $scope.signUp_lastName && $scope.signUp_genderID && $scope.signUp_birthDate && $scope.signUp_email && $scope.signUp_contactNumber && $scope.signUp_address && $scope.signUp_civilStatus && $scope.signUp_password) {
                var accountData = {
                    firstName: $scope.signUp_firstName,
                    middleName: $scope.signUp_middleName,
                    lastName: $scope.signUp_lastName,
                    genderID: $scope.signUp_genderID,
                    birthDate: birthDate,
                    email: $scope.signUp_email,
                    contactNumber: $scope.signUp_contactNumber,
                    address: $scope.signUp_address,
                    civilStatus: $scope.signUp_civilStatus,
                    password: $scope.signUp_password,
                    lastLogin: new Date(),
                    accCreatedAt: new Date(),
                    accUpdatedAt: new Date(),
                }

                if ($scope.signUp_agreement == true) {
                    var signUp = RGDCWebApplicationService.signUp(accountData);
                    signUp.then(function (signUpID) {
                        var patientData = {
                            currentPhysician: $scope.signUp_currentPhysician,
                            referral: $scope.signUp_referral,
                            lastVisit: $scope.signUp_lastVisit,
                            medicalHistory: "",
                            accID: signUpID.data.accID

                        }
                        var signUpPatient = RGDCWebApplicationService.signUpPatient(patientData);
                        signUpPatient.then(function () {
                            window.location.href = "/RGDC/logIn";
                        });
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Read and Accept the Following:",
                        text: "Terms and Conditions & Data Privacy Policy",
                    });

                }
            }
            else {
                Swal.fire({
                    icon: "error",
                    title: "Incomplete Inputs",
                    text: "Ensure all fields are filled up with valid information.",
                });
            }
        } catch (e) {
            console.log(e.message)
        }
    }

    $scope.login = function () {

        if (!$scope.login_email || $scope.login_email.trim() === "") {
            Swal.fire({
                icon: "error",
                title: "Invalid Input",
                text: "Email is required",
            });
            return;
        }

        if (!$scope.login_password || $scope.login_password.trim() === "") {
            Swal.fire({
                icon: "error",
                title: "Invalid Input",
                text: "Password is required",
            });
            return;
        }

        if (!$scope.hasValidEmail($scope.login_email)) {
            Swal.fire({
                icon: "error",
                title: "Invalid Email",
                text: "Enter a valid email address",
            });
            return;
        }

        var loginData = {
            email: $scope.login_email,
            password: $scope.login_password
        };

        var loginRequest = RGDCWebApplicationService.login(loginData);
        loginRequest.then(function (returnedData) {
            if (returnedData.data && returnedData.data.success) {
                $scope.currentUserFirstName = returnedData.data.firstName || "";
                $scope.currentUserAuthorization = String(returnedData.data.authorization || "");

                console.log($scope.currentUserFirstName)
                Swal.fire({
                    title: "Login Successful!",
                    text: "Welcome back, " + $scope.currentUserFirstName + "!",
                    icon: "success"
                }).then(() => {
                    // Redirect to home page after successful login
                    window.location.href = "/RGDC/adminDashboard";
                });
            } else {
                $scope.loginError = returnedData.data ? returnedData.data.message : "Invalid email or password";
                $scope.loginErrorType = "password";
                Swal.fire({
                    icon: "error",
                    title: "Login Failed",
                    text: returnedData.data ? returnedData.data.message : "Invalid email or password",
                });
            }
        }, function (error) {
            $scope.loginError = "An error occurred during login";
            $scope.loginErrorType = "password";
            Swal.fire({
                icon: "error",
                title: "Login Failed",
                text: error.data && error.data.message ? error.data.message : "An error occurred during login",
            });
        });
    }

    $scope.getSessionVariables = function () {
            return RGDCWebApplicationService.getSessionVariable()
            .then(function (returnedData) {
            $scope.currentUserName = returnedData.data.userName || "";
            $scope.currentUserID = returnedData.data.userID || "";
            $scope.currentUserAuthorization = returnedData.data.userAuthorization || "";
            $scope.currentUserFullName = returnedData.data.fullName || "";
            if ($scope.currentUserAuthorization == "0") {
                $scope.isUserOwner = true;
                $scope.isUserAdmin = true;
                $scope.userRole = "Owner"
            } else if ($scope.currentUserAuthorization == "1" || $scope.currentUserAuthorization == "2") {
                $scope.isUserAdmin = true;
                if ($scope.currentUserAuthorization == "1")
                    $scope.userRole = "Dental Staff"
                else
                    $scope.userRole = "Dentist"
            } else if ($scope.currentUserAuthorization == "3") {
                $scope.isUserPatient = true;
                $scope.userRole = "Patient"
                }
             return $scope.currentUserAuthorization;
        });
    }

    $scope.checkAuthEmail = function () {
        var authEmail = RGDCWebApplicationService.getAuthEmail();
        authEmail.then(function (response) {
            console.log(response.data.email)
            if (response.data.email) {
                $scope.signUp_email = response.data.email;
                $scope.signUp_emailLocked = true;
            }
        });
    };

    $scope.sendOTP = function () {
        if (!$scope.forgot_email) {
            Swal.fire({
                icon: "error",
                title: "Email is Required",
                text: "Input your Email",
            });
            return;
        }
        var forgot_email = {
            email: $scope.forgot_email
        }

        var sendOTP = RGDCWebApplicationService.sendOTP(forgot_email);
        sendOTP.then(function (response) {
            if (response.data.success) {
                Swal.fire({
                    icon: "success",
                    title: "OTP Sent",
                    text: "Check your Inbox."
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "OTP not Sent",
                    text: response.data.message,
                });
            }

        });
    };

    $scope.resetPassword = function () {

        if ($scope.forgot_newPassword !== $scope.forgot_confirmPassword) {
            Swal.fire({
                icon: "error",
                title: "Passwords does not match",
                text: "Make sure that passwords match",
            });
            return;
        }
        var forgot_info = {
            email: $scope.forgot_email,
            password: $scope.forgot_newPassword,
            otp: $scope.forgot_otp
        }
        var resetPassword = RGDCWebApplicationService.resetPassword(forgot_info);
        resetPassword.then(function () {
            var modal = document.getElementById("password-modal");
            if (modal) {
                modal.style.display = "none";
            }
            Swal.fire({
                icon: "success",
                title: "Password Changed Successfully",
                text: "Log In with your new password!",
            });
        });
    };

    $scope.getPatients = function () {
        if ($scope.userAuthorization != 3) {
            var getPatientList = RGDCWebApplicationService.getPatientList();
            getPatientList.then(function (patientList) {
                $scope.patientArray = patientList.data;
                $scope.patientArray.forEach(function (patient) {
                    if (patient.lastVisit) {
                        patient.lastVisit = formatDateToMDY(patient.lastVisit)
                    }
                });
            });
        }
    }


    $scope.getDentists = function () {
        if ($scope.userAuthorization != 3) {
            var getDentists = RGDCWebApplicationService.getDentists();
            getDentists.then(function (dentistList) {
                $scope.dentistArray = dentistList.data;
            });
        }
    }


    $scope.getPatientsNDentist = function () {
        $scope.getPatients();
        $scope.getDentists();
    }

    $scope.goToPatientInfo = function (patient) {
        var patientID = {
            patientID: patient.patientID.toString()
        }

        if ($scope.currentUserAuthorization != "3") {
            RGDCWebApplicationService.goToPatient(patientID)
                .then(function (response) {
                    if (response.data && response.data.success) {
                        window.location.href = "/RGDC/patientProfile";
                    }
                })
                .catch(function (err) {
                    console.error(err);
                });
        }
    };

    $scope.getSelectedPatientDetails = function () {
        $scope.getSessionVariables().then(function (auth) {
            console.log(auth)
            if ($scope.currentUserAuthorization != 3) {
                var getPatientInfo = RGDCWebApplicationService.getSelectedPatientDetails();
                getPatientInfo.then(function (patientInfo) {
                    if (!patientInfo || !patientInfo.data) return;

                    var p = patientInfo.data;

                    // format visit dates (existing)
                    if (p.lastVisit) p.lastVisit = formatDateToMDY(p.lastVisit);
                    if (p.nextVisit) p.nextVisit = formatDateToMDY(p.nextVisit);
                    if (p.medHistUpdate) p.medHistUpdate = formatDateToMDYTime(p.medHistUpdate);

                    $scope.fillMedicalHistoryForm(p.medHist);

                    // previous physician details
                    if (p.prevPhy) $scope.prevPhy = p.prevPhy;
                    if (p.prevPhyOffice) $scope.prevPhyOffice = p.prevPhyOffice;
                    if (p.prevPhyContact) $scope.prevPhyContact = p.prevPhyContact;

                    // preserve / coerce genderID to number for binding
                    if (typeof p.genderID !== 'undefined' && p.genderID !== null) {
                        p.genderID = parseInt(p.genderID, 10);
                    } else {
                        p.genderID = null;
                    }

                    if (p.birthDate) {
                        var birthJs = parseJsonDateToJsDate(p.birthDate);
                        if (birthJs) {
                            // Store raw date for datepicker
                            p.birthDateRaw = birthJs;
                            // Format for display
                            p.birthDate = birthJs.toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric"
                            });
                            // Calculate age
                            p.age = computeAgeFromDate(birthJs);
                        } else {
                            p.birthDateRaw = null;
                            p.birthDate = "";
                            p.age = "";
                        }
                    } else {
                        p.birthDateRaw = null;
                        p.birthDate = "";
                        p.age = "";
                    }

                    // format account creation date
                    if (p.accCreated) {
                        var accJs = parseJsonDateToJsDate(p.accCreated);
                        if (accJs) {
                            p.accCreated = accJs.toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric"
                            });
                        }
                    } else {
                        p.accCreated = "";
                    }

                    $scope.selectedPatient = p;

                    // ensure genderArray is loaded; if not, load it so select has options
                    if (!$scope.genderArray || $scope.genderArray.length === 0) {
                        $scope.getGender();
                    }

                    // Initialize datepicker after patient data loads
                    initializeDatepicker();
                });
                var getPatientTreatment = RGDCWebApplicationService.getPatientTreatment();
                getPatientTreatment.then(function (patientTreatment) {
                    $scope.patientTreatments = patientTreatment.data;
                    $scope.patientTreatments.forEach(function (patient) {
                        if (patient.date) {
                            patient.date = formatDateToMDY(patient.date)
                        }
                    });
                })
            } else {
                console.log("asasa")
                var getPatientInfo = RGDCWebApplicationService.getOwnPatientDetails();
                getPatientInfo.then(function (patientInfo) {
                    console.log(patientInfo.data)
                    if (!patientInfo || !patientInfo.data) return;

                    var p = patientInfo.data;

                    // format visit dates (existing)
                    if (p.lastVisit) p.lastVisit = formatDateToMDY(p.lastVisit);
                    if (p.nextVisit) p.nextVisit = formatDateToMDY(p.nextVisit);
                    if (p.medHistUpdate) p.medHistUpdate = formatDateToMDYTime(p.medHistUpdate);

                    $scope.fillMedicalHistoryForm(p.medHist);

                    // previous physician details
                    if (p.prevPhy) $scope.prevPhy = p.prevPhy;
                    if (p.prevPhyOffice) $scope.prevPhyOffice = p.prevPhyOffice;
                    if (p.prevPhyContact) $scope.prevPhyContact = p.prevPhyContact;

                    // preserve / coerce genderID to number for binding
                    if (typeof p.genderID !== 'undefined' && p.genderID !== null) {
                        p.genderID = parseInt(p.genderID, 10);
                    } else {
                        p.genderID = null;
                    }

                    if (p.birthDate) {
                        var birthJs = parseJsonDateToJsDate(p.birthDate);
                        if (birthJs) {
                            // Store raw date for datepicker
                            p.birthDateRaw = birthJs;
                            // Format for display
                            p.birthDate = birthJs.toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric"
                            });
                            // Calculate age
                            p.age = computeAgeFromDate(birthJs);
                        } else {
                            p.birthDateRaw = null;
                            p.birthDate = "";
                            p.age = "";
                        }
                    } else {
                        p.birthDateRaw = null;
                        p.birthDate = "";
                        p.age = "";
                    }

                    // format account creation date
                    if (p.accCreated) {
                        var accJs = parseJsonDateToJsDate(p.accCreated);
                        if (accJs) {
                            p.accCreated = accJs.toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric"
                            });
                        }

                        
                    } else {
                        p.accCreated = "";
                    }

                    $scope.selectedPatient = p;

                    console.log($scope.selectedPatient)
                    // ensure genderArray is loaded; if not, load it so select has options
                    if (!$scope.genderArray || $scope.genderArray.length === 0) {
                        $scope.getGender();
                    }

                    // Initialize datepicker after patient data loads
                    initializeDatepicker();
                });
                var getPatientTreatment = RGDCWebApplicationService.getPatientTreatment();
                getPatientTreatment.then(function (patientTreatment) {
                    $scope.patientTreatments = patientTreatment.data;
                    $scope.patientTreatments.forEach(function (patient) {
                        if (patient.date) {
                            patient.date = formatDateToMDY(patient.date)
                        }
                    });
                })
            }
        });
    };

    $scope.getPayments = function () {
        if ($scope.userAuthorization != 3) {
            var getPayments = RGDCWebApplicationService.getPayments();
            getPayments.then(function (paymentList) {
                $scope.paymentsArray = paymentList.data;
                $scope.paymentsArray.forEach(function (payment) {
                    if (payment.paymentDate) {
                        payment.paymentDate = formatDateToMDY(payment.paymentDate)
                    }
                });
            });
        }
    }
    function initializeDatepicker() {
        $timeout(function () {
            var birthDateElem = document.getElementById('birthDate');
            if (birthDateElem) {
                // Destroy any existing instance
                var existingInstance = M.Datepicker.getInstance(birthDateElem);
                if (existingInstance) {
                    existingInstance.destroy();
                }

                // Initialize new datepicker
                var datepicker = M.Datepicker.init(birthDateElem, {
                    format: 'mmmm dd, yyyy',
                    yearRange: [1900, new Date().getFullYear()],
                    autoClose: true,
                    maxDate: new Date(),
                    onSelect: function (date) {
                        $scope.$apply(function () {
                            // Store raw date
                            $scope.selectedPatient.birthDateRaw = date;

                            // Format for display
                            $scope.selectedPatient.birthDate = date.toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric"
                            });

                            // Calculate age
                            $scope.selectedPatient.age = computeAgeFromDate(date);

                            console.log('Selected birth date:', date);
                            console.log('Calculated age:', $scope.selectedPatient.age);
                        });
                    }
                });

                // Set initial date if patient has birthDateRaw
                if ($scope.selectedPatient && $scope.selectedPatient.birthDateRaw) {
                    var initialDate = new Date($scope.selectedPatient.birthDateRaw);
                    datepicker.setDate(initialDate);
                }
            }
        }, 300);
    }

    // helper: parse ASP.NET JSON date "/Date(1234567890)/" or accept already-ISO strings
    function parseJsonDateToJsDate(dateInput) {
        if (!dateInput) return null;

        // If it's already a Date object, return it
        if (Object.prototype.toString.call(dateInput) === '[object Date]') {
            return isNaN(dateInput.getTime()) ? null : dateInput;
        }

        // ASP.NET JSON format: "/Date(1234567890)/" (milliseconds)
        var msMatch = String(dateInput).match(/\/Date\((-?\d+)\)\//);
        if (msMatch) {
            var ts = parseInt(msMatch[1], 10);
            return new Date(ts);
        }

        // ISO or other string format - let Date parse it
        if (typeof dateInput === 'string') {
            var d = new Date(dateInput);
            return isNaN(d.getTime()) ? null : d;
        }

        // numeric timestamp (ms)
        if (typeof dateInput === 'number') {
            return new Date(dateInput);
        }

        return null;
    }

    function computeAgeFromDate(birthDate) {
        if (!birthDate) return "";

        var bYear = birthDate.getFullYear();
        var bMonth = birthDate.getMonth();
        var bDay = birthDate.getDate();

        var today = new Date();
        var tYear = today.getFullYear();
        var tMonth = today.getMonth();
        var tDay = today.getDate();

        var age = tYear - bYear;
        if (tMonth < bMonth || (tMonth === bMonth && tDay < bDay)) {
            age--;
        }
        return age;
    }

    function formatDateToMDY(dateString) {
        const match = String(dateString).match(/\d+/);
        if (!match) return dateString;
        const timestamp = parseInt(match[0], 10);
        const date = new Date(timestamp);

        return date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        });
    }

    function formatDateToMDYTime(dateString) {
        const match = String(dateString).match(/\d+/);
        if (!match) return dateString;

        const timestamp = parseInt(match[0], 10);
        const date = new Date(timestamp);

        return date.toLocaleString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
    }

    // UPDATE FUNCTION
    $scope.updatePatientProfile = function () {
        if (!$scope.selectedPatient) return;

        var profInfo = {
             patientID: $scope.selectedPatient.patientID,
             accID: $scope.selectedPatient.accID,
             firstName: $scope.selectedPatient.firstName,
             middleName: $scope.selectedPatient.middleName,
             lastName: $scope.selectedPatient.lastName,
             genderID: (typeof $scope.selectedPatient.genderID !== 'undefined' && $scope.selectedPatient.genderID !== null)
                ? parseInt($scope.selectedPatient.genderID)
                : null,
             birthDate: $scope.selectedPatient.birthDateRaw ? new Date($scope.selectedPatient.birthDateRaw) : null,
             email: $scope.selectedPatient.email,
             contactNumber: $scope.selectedPatient.contactNumber,
             address: $scope.selectedPatient.address,
             civilStatus: $scope.selectedPatient.civilStatus,
             religion: $scope.selectedPatient.religion,
             nationality: $scope.selectedPatient.nationality,
             currentPhysician: $scope.selectedPatient.currPhy || $scope.selectedPatient.currentPhysician,
             previousPhysician: $scope.selectedPatient.prevPhy || $scope.selectedPatient.previousPhysician,
             guardian: $scope.selectedPatient.guar,
             guardianNumber: $scope.selectedPatient.guarNum,
             insurance: $scope.selectedPatient.insurance,
             referral: $scope.selectedPatient.referral
         };

        var updateData = RGDCWebApplicationService.updatePatient(profInfo);
        updateData.then(function (response) {
            if (response.data.success) {
                Swal.fire({
                    icon: "success",
                    title: "Success!",
                    text: response.data.message || "Profile updated."
                });
                $scope.getSelectedPatientDetails();
                var modal = document.getElementById("modal-patient-info");
                if (modal) {
                    if (typeof M !== 'undefined' && M.Modal) {
                        var inst = M.Modal.getInstance(modal);
                        if (inst) inst.close();
                    } else {
                        modal.style.display = "none";
                    }
                }
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error!",
                    text: response.data.message || "Failed to update profile."
                });
            }
        }, function (error) {
            Swal.fire({
                icon: "error",
                title: "Error!",
                text: "Failed to update profile"
            });
            console.error(error);
        });
    };

    $scope.uploadFile = function () {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        document.body.appendChild(input);

        input.onchange = function (e) {
            var file = e.target.files[0];

            if (!file) {
                document.body.removeChild(input);
                return;
            }

            if (!file.type.startsWith('image/')) {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid File',
                    text: 'Please select an image file.'
                });
                document.body.removeChild(input);
                return;
            }

            Swal.fire({
                title: 'Uploading...',
                text: 'Please wait while we upload your dental chart.',
                allowOutsideClick: false,
                didOpen: function () {
                    Swal.showLoading();
                }
            });

            RGDCWebApplicationService.uploadFile(file)
                .then(function (response) {
                    console.log('Upload response:', response.data);
                    var json = response.data || {};

                    if (json.success === true && json.filePath) {
                        $timeout(function () {
                            // Close the dental chart modal
                            var modal = document.getElementById('modal-dental-chart');
                            if (modal && typeof M !== 'undefined' && M.Modal) {
                                var inst = M.Modal.getInstance(modal);
                                if (inst) inst.close();
                            }

                            if ($scope.selectedPatient) {
                                $scope.selectedPatient.dentalChartLink = json.filePath;
                            }

                            var cacheBuster = '?t=' + new Date().getTime();
                            var mainImg = document.getElementById('dentalChartMain');
                            var modalImg = document.getElementById('dentalChartModalImg');

                            if (mainImg) {
                                mainImg.src = json.filePath + cacheBuster;
                                console.log('Updated main image to:', json.filePath);
                            }
                            if (modalImg) {
                                modalImg.src = json.filePath + cacheBuster;
                                console.log('Updated modal image to:', json.filePath);
                            }

                            $scope.getSelectedPatientDetails();

                            Swal.fire({
                                icon: 'success',
                                title: 'Success!',
                                text: json.message || 'Dental chart uploaded successfully.'
                            });
                        }, 0);
                    } else {
                        console.error('Upload failed:', json);
                        Swal.fire({
                            icon: 'error',
                            title: 'Upload Failed',
                            text: json.message || 'Unknown server response.'
                        });
                    }

                    if (input && input.parentNode) {
                        document.body.removeChild(input);
                    }
                })
                .catch(function (err) {
                    console.error('Upload error:', err);
                    Swal.fire({
                        icon: 'error',
                        title: 'Upload Error',
                        text: err.data && err.data.message ? err.data.message : 'An error occurred while uploading.'
                    });

                    if (input && input.parentNode) {
                        document.body.removeChild(input);
                    }
                });
        };

        input.click();
    };

    $scope.getImages = function () {
        var getData = RGDCWebApplicationService.getImageService();
        getData.then(function (returnedData) {
            $scope.imageList = returnedData.data;
            $timeout(function () {
                var elems = document.querySelectorAll('.carousel');
                M.Carousel.init(elems);
            }, 0);
        });
    };


    // Open file picker and preview image in modal
    $scope.pickSignatureFile = function () {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        document.body.appendChild(input);

        input.onchange = function (e) {
            var file = e.target.files && e.target.files[0];
            if (!file) {
                document.body.removeChild(input);
                return;
            }

            if (!file.type.startsWith('image/')) {
                Swal.fire({ icon: 'error', title: 'Invalid File', text: 'Please select an image file.' });
                document.body.removeChild(input);
                return;
            }

            // preview locally
            var reader = new FileReader();
            reader.onload = function (evt) {
                $scope.$apply(function () {
                    $scope.signaturePreview = evt.target.result;
                    $scope._uploadedSignaturePath = null;
                });
            };
            reader.readAsDataURL(file);

            // store the file on the input for later upload on Save
            input._pickedFile = file;

            // attach Save action to upload immediately (or let user click Save)
            $scope._pickedSignatureFile = file;

            document.body.removeChild(input);
        };

        input.click();
    };

    // Save signature: upload image to server (tbl_images) then link to patient record and refresh UI
    $scope.saveSignature = function () {
        var file = $scope._pickedSignatureFile;
        if (!file && !$scope.signaturePreview && !$scope._uploadedSignaturePath) {
            Swal.fire({ icon: 'error', title: 'No Image', text: 'Pick an image first.' });
            return;
        }

        if ($scope._uploadedSignaturePath) {
            $scope._linkSignatureToPatient($scope._uploadedSignaturePath);
            return;
        }

        var uploader = null;
        if (RGDCWebApplicationService && typeof RGDCWebApplicationService.uploadSignature === 'function') {
            uploader = RGDCWebApplicationService.uploadSignature;
        } else if (RGDCWebApplicationService && typeof RGDCWebApplicationService.uploadFile === 'function') {
            uploader = RGDCWebApplicationService.uploadFile;
            console.warn('RGDCWebApplicationService.uploadSignature not found, falling back to uploadFile.');
        } else {
            Swal.fire({ icon: 'error', title: 'Upload Not Available', text: 'Upload service is not loaded.' });
            return;
        }

        // Upload file
        Swal.fire({ title: 'Uploading...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        uploader(file)
            .then(function (resp) {
                Swal.close();
                var data = resp && resp.data ? resp.data : resp;
                if (data && data.success && data.filePath) {
                    $scope._uploadedSignaturePath = data.filePath;
                    $scope._linkSignatureToPatient(data.filePath);
                } else {
                    var msg = (data && data.message) ? data.message : 'Unknown error uploading signature.';
                    Swal.fire({ icon: 'error', title: 'Upload failed', text: msg });
                }
            })
            .catch(function (err) {
                Swal.close();
                console.error('UploadSignature error', err);
                Swal.fire({ icon: 'error', title: 'Upload Error', text: 'Failed to upload signature' });
            });
    };

    $scope._linkSignatureToPatient = function (filePath) {
        Swal.fire({ title: 'Saving...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        var saver;
        if (RGDCWebApplicationService && typeof RGDCWebApplicationService.savePatientSignature === 'function') {
            saver = function (path) {
                return RGDCWebApplicationService.savePatientSignature(path);
            };
        } else {
            console.warn('RGDCWebApplicationService.savePatientSignature not found - using $http fallback.');
            saver = function (path) {
                return $http({
                    method: "POST",
                    url: "/RGDC/SavePatientSignature",
                    data: { imagePath: path }
                });
            };
        }

        saver(filePath)
            .then(function (resp) {
                Swal.close();
                var data = (resp && resp.data) ? resp.data : resp;
                if (data && data.success) {
                    // Refresh patient details so signatureLink is present and shown
                    $scope.getSelectedPatientDetails();

                    // Also update local preview shown in medical-history tab
                    $scope.signaturePreview = data.filePath || filePath;
                    $scope._uploadedSignaturePath = data.filePath || filePath;
                    // clear picked file
                    $scope._pickedSignatureFile = null;

                    Swal.fire({ icon: 'success', title: 'Saved', text: 'Signature saved.' });

                    // close modal if open (medical-history-modal)
                    var modal = document.getElementById('medical-history-modal');
                    if (modal && typeof M !== 'undefined' && M.Modal) {
                        var inst = M.Modal.getInstance(modal);
                        if (inst) inst.close();
                    }
                } else {
                    Swal.fire({ icon: 'error', title: 'Save Failed', text: (data && data.message) ? data.message : 'Could not save signature.' });
                }
            })
            .catch(function (err) {
                Swal.close();
                console.error('SavePatientSignature error', err);
                Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to save signature for patient.' });
            });
    };

    // When patient details reload, if server has signatureLink use that as preview in medical history
    var origGetSelectedPatientDetails = $scope.getSelectedPatientDetails;
    $scope.getSelectedPatientDetails = function () {
        if (typeof origGetSelectedPatientDetails === 'function') {
            origGetSelectedPatientDetails();
            $timeout(function () {
                if ($scope.selectedPatient && $scope.selectedPatient.signatureLink) {
                    $scope.signaturePreview = $scope.selectedPatient.signatureLink;
                }
            }, 400);
        }
    };

    $scope.logOut = function () {
        RGDCWebApplicationService.logOut();
        window.location.href = "/RGDC/logIn";
    }

    $scope.medicalHistoryUpdate = function () {
        var prevPhysicianDetails = {
            previousPhysician: $scope.prevPhy,
            previousPhysicianOffice: $scope.prevPhyOffice,
            previousPhysicianContact: $scope.prevPhyContact
        }
        var medHist = {
            history: $scope.medical.history,
            conditions: $scope.medical.conditions
        }
        console.log(medHist);
        var updateMedHistIni = RGDCWebApplicationService.updateMedHistIni(prevPhysicianDetails);
        updateMedHistIni.then(function (response) {
            if (response.data.success) {
                var modal = document.getElementById("medical-history-modal")
                var instance = M.Modal.getInstance(modal);
                instance.close();
                var updateMedHist = RGDCWebApplicationService.updateMedHist(medHist);
                updateMedHist.then(function (response) {
                    console.log(response.data.jsonstring);
                    if (response.data.success) {
                        Swal.fire({
                            icon: "success",
                            title: "SUCCESS",
                            text: "Medical History Updated!"
                        });
                    } else {
                        Swal.fire({
                            icon: "error",
                            title: "Error",
                            text: "Unable to update medical history",
                        });
                    }
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Unable to update medical history",
                });
            }
        });
    }

    $scope.pickFormFile = function (inputElem) {
        function handleFile(file, assignTo) {
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function (evt) {
                $scope.$apply(function () {
                    if (assignTo === 'new') {
                        $scope.newForm = $scope.newForm || {};
                        $scope.newForm.previewLink = evt.target.result;
                        $scope.newForm._file = file;
                        $scope._pickedFormFile = file;
                    } else {
                        $scope.selectedForm = $scope.selectedForm || {};
                        $scope.selectedForm.formLink = evt.target.result;
                        $scope.selectedForm._file = file;
                        $scope._pickedFormFileEdit = file;
                    }
                });
            };
            reader.readAsDataURL(file);
        }

        if (inputElem && inputElem.files && inputElem.files[0]) {
            handleFile(inputElem.files[0], 'new');
            return;
        }

        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,application/pdf';
        input.style.display = 'none';
        document.body.appendChild(input);

        input.onchange = function (e) {
            var file = e.target.files && e.target.files[0];
            handleFile(file, 'new');
            document.body.removeChild(input);
        };

        input.click();
    };

    $scope.pickFormFileForEdit = function () {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,application/pdf';
        input.style.display = 'none';
        document.body.appendChild(input);

        input.onchange = function (e) {
            var file = e.target.files && e.target.files[0];
            if (!file) {
                document.body.removeChild(input);
                return;
            }
            var reader = new FileReader();
            reader.onload = function (evt) {
                $scope.$apply(function () {
                    $scope.selectedForm = $scope.selectedForm || {};
                    $scope.selectedForm.formLink = evt.target.result;
                    $scope.selectedForm._file = file;
                    $scope._pickedFormFileEdit = file;
                });
            };
            reader.readAsDataURL(file);
            document.body.removeChild(input);
        };

        input.click();
    };

    // addForm: upload optional file then POST form metadata to server
    $scope.addForm = function (form) {
        if (!form) form = $scope.newForm || {};
        if (!form.firstName || !form.lastName || !form.acceptedTerms) {
            Swal.fire({ icon: 'error', title: 'Missing fields', text: 'Please complete required fields and accept Terms & Conditions.' });
            return;
        }

        var proceed = function (filePath) {
            // send metadata to server (server should implement /RGDC/AddForm to save the record)
            var payload = {
                firstName: form.firstName,
                middleName: form.middleName || '',
                lastName: form.lastName,
                genderID: form.genderID || null,
                birthDate: form.birthDate || null,
                civilStatus: form.civilStatus || '',
                contactNumber: form.contactNumber || '',
                address: form.address || '',
                acceptedTerms: !!form.acceptedTerms,
                formLink: filePath || null
            };
            $http({
                method: 'POST',
                url: '/RGDC/AddForm',
                data: payload
            }).then(function (resp) {
                var data = resp.data || resp;
                if (data && data.success) {
                    Swal.fire({ icon: 'success', title: 'Added', text: data.message || 'Form added.' });
                    $scope.getSelectedPatientDetails();
                    var modal = document.getElementById('modal-add-form');
                    if (modal && typeof M !== 'undefined' && M.Modal) {
                        var inst = M.Modal.getInstance(modal);
                        if (inst) inst.close();
                    }
                    $scope.newForm = {};
                } else {
                    Swal.fire({ icon: 'error', title: 'Error', text: (data && data.message) ? data.message : 'Failed to add form.' });
                }
            }).catch(function (err) {
                console.error('AddForm error', err);
                Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to add form.' });
            });
        };

        // upload file first if present
        var file = (form._file || $scope._pickedFormFile);
        if (file) {
            Swal.fire({ title: 'Uploading file...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            RGDCWebApplicationService.uploadFile(file).then(function (resp) {
                Swal.close();
                var d = resp.data || resp;
                if (d && d.success && d.filePath) {
                    proceed(d.filePath);
                } else {
                    Swal.fire({ icon: 'error', title: 'Upload failed', text: (d && d.message) ? d.message : 'File upload failed.' });
                }
            }).catch(function (err) {
                Swal.close();
                console.error('uploadFile error', err);
                Swal.fire({ icon: 'error', title: 'Upload Error', text: 'Failed to upload file.' });
            });
        } else {
            proceed(null);
        }
    };

    // saveForm: update an existing form record (server endpoint /RGDC/SaveForm expected)
    $scope.saveForm = function (form) {
        if (!form) form = $scope.selectedForm || {};
        if (!form.firstName || !form.lastName || !form.acceptedTerms) {
            Swal.fire({ icon: 'error', title: 'Missing fields', text: 'Please complete required fields and accept Terms & Conditions.' });
            return;
        }

        var proceed = function (filePath) {
            var payload = {
                formID: form.formID || null,
                firstName: form.firstName,
                middleName: form.middleName || '',
                lastName: form.lastName,
                genderID: form.genderID || null,
                birthDate: form.birthDate || null,
                civilStatus: form.civilStatus || '',
                contactNumber: form.contactNumber || '',
                address: form.address || '',
                acceptedTerms: !!form.acceptedTerms,
                formLink: filePath || form.formLink || null
            };
            $http({
                method: 'POST',
                url: '/RGDC/SaveForm',
                data: payload
            }).then(function (resp) {
                var data = resp.data || resp;
                if (data && data.success) {
                    Swal.fire({ icon: 'success', title: 'Saved', text: data.message || 'Form saved.' });
                    $scope.getSelectedPatientDetails();
                    var modal = document.getElementById('modal-edit-form');
                    if (modal && typeof M !== 'undefined' && M.Modal) {
                        var inst = M.Modal.getInstance(modal);
                        if (inst) inst.close();
                    }
                } else {
                    Swal.fire({ icon: 'error', title: 'Error', text: (data && data.message) ? data.message : 'Failed to save form.' });
                }
            }).catch(function (err) {
                console.error('SaveForm error', err);
                Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to save form.' });
            });
        };

        // if a new file was picked for edit, upload it
        var file = (form._file || $scope._pickedFormFileEdit);
        if (file) {
            Swal.fire({ title: 'Uploading file...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            RGDCWebApplicationService.uploadFile(file).then(function (resp) {
                Swal.close();
                var d = resp.data || resp;
                if (d && d.success && d.filePath) {
                    proceed(d.filePath);
                } else {
                    Swal.fire({ icon: 'error', title: 'Upload failed', text: (d && d.message) ? d.message : 'File upload failed.' });
                }
            }).catch(function (err) {
                Swal.close();
                console.error('uploadFile error', err);
                Swal.fire({ icon: 'error', title: 'Upload Error', text: 'Failed to upload file.' });
            });
        } else {
            proceed(null);
        }
    };

    // postOp helpers: templates, apply, save and print
    $scope.postOp = $scope.postOp || {};
    $scope.postOp.templates = [
        { key: 'simpleExtraction', name: 'Simple Extraction', title: 'Post-Op: Simple Extraction', instructions: '<ul><li>Avoid rinsing for 24 hours.</li><li>Apply ice for first 24 hours.</li><li>Take prescribed medication as directed.</li></ul>' },
        { key: 'surgicalExtraction', name: 'Surgical Extraction', title: 'Post-Op: Surgical Extraction', instructions: '<ul><li>Keep head elevated for 48 hours.</li><li>No strenuous activity for 7 days.</li><li>Follow-up in 5 days.</li></ul>' },
        { key: 'general', name: 'General Instructions', title: 'Post-Op Instructions', instructions: '<p>Maintain oral hygiene. Use soft diet for 48 hours. If bleeding persists, contact clinic.</p>' }
    ];
    $scope.postOp.selectedTemplate = null;
    $scope.postOp.title = '';
    $scope.postOp.instructions = '';

    $scope.postOp.applyTemplate = function () {
        var selectedKey = $scope.postOp.selectedTemplate;
        if (!selectedKey) return;
        var t = $scope.postOp.templates.find(function (x) { return x.key === selectedKey; });
        if (t) {
            $scope.postOp.title = t.title;
            // instructions may contain HTML; we store as string
            $scope.postOp.instructions = t.instructions;
        }
    };

    $scope.savePostOp = function () {
        var payload = {
            title: $scope.postOp.title,
            instructions: $scope.postOp.instructions
        };
        // optimistic: server endpoint expected at /RGDC/SavePostOp
        $http({
            method: 'POST',
            url: '/RGDC/SavePostOp',
            data: payload
        }).then(function (resp) {
            var data = resp.data || resp;
            if (data && data.success) {
                Swal.fire({ icon: 'success', title: 'Saved', text: data.message || 'Post-Op instructions saved.' });
                // update UI immediate (store in selectedPatient)
                if ($scope.selectedPatient) {
                    $scope.selectedPatient.postOpTitle = payload.title;
                    $scope.selectedPatient.postOpInstructions = payload.instructions;
                }
                var modal = document.getElementById('modal-edit-postOp');
                if (modal && typeof M !== 'undefined' && M.Modal) {
                    var inst = M.Modal.getInstance(modal);
                    if (inst) inst.close();
                }
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: (data && data.message) ? data.message : 'Failed to save post-op.' });
            }
        }).catch(function (err) {
            console.error('SavePostOp error', err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to save post-op.' });
        });
    };

    $scope.printPostOp = function () {
        // Build printable HTML from current postOp model
        var title = $scope.postOp.title || ($scope.selectedPatient && $scope.selectedPatient.postOpTitle) || 'Post-Op Instructions';
        var instructions = $scope.postOp.instructions || ($scope.selectedPatient && $scope.selectedPatient.postOpInstructions) || '<p>No instructions available.</p>';
        var html = '<html><head><title>' + title + '</title>';
        html += '<style>body{font-family: Arial, Helvetica, sans-serif; padding:20px;} h1{font-size:1.4rem;} .content{margin-top:10px;}</style></head><body>';
        html += '<h1>' + title + '</h1><div class="content">' + instructions + '</div>';
        html += '</body></html>';

        var win = window.open('', '_blank', 'width=900,height=700');
        if (!win) {
            Swal.fire({ icon: 'error', title: 'Popup blocked', text: 'Please allow popups for this site to print.' });
            return;
        }
        win.document.open();
        win.document.write(html);
        win.document.close();
        // Wait a moment to ensure content renders, then call print
        setTimeout(function () {
            win.focus();
            win.print();
        }, 400);
    };

    // ---- end new functions ----

    $scope.fillMedicalHistoryForm = function (medHistString) {
        var medHist = JSON.parse(medHistString);

        $scope.medical = $scope.medical || {};
        $scope.medical.history = $scope.medical.history || {};
        $scope.medical.conditions = $scope.medical.conditions || {};

        angular.copy(medHist.history, $scope.medical.history);
        angular.copy(medHist.conditions, $scope.medical.conditions);
    }

    $scope.addPayment = function () {
        var parts = $scope.selectedPatient.trim().split(' ');
        var idPart = parts[parts.length - 1];

        var id = parseInt(idPart);
        $scope.selectedPatientID = isNaN(id) ? null : id;

        var parts = $scope.selectedDentist.trim().split(' ');
        var idPart = parts[parts.length - 1];

        var id = parseInt(idPart);
        $scope.selectedDentistID = isNaN(id) ? null : id;

        if (!$scope.selectedPatientID || !$scope.selectedDentistID) {
            alert("Please select a valid patient and dentist.");
            return;
        }
        console.log($scope.currentUserID)

        var paymentData = {
            patientID: $scope.selectedPatientID,
            dentistID: $scope.selectedDentistID,
            paymentMethod: $scope.paymentMethod,
            cost: parseFloat($scope.paymentCost) || 0,
            discount: parseFloat($scope.paymentDiscount) || 0,
            amountPaid: parseFloat($scope.paymentPaid) || 0,
            amountDue: parseFloat($scope.paymentDue) || 0,
            description: $scope.paymentDescription,
            createdBy: $scope.currentUserID         
        };

        RGDCWebApplicationService.addPayment(paymentData).then(function (response) {
            if (response.data.success) {
                window.location.href = "/RGDC/adminPatientsTab";
            }
        })

    }
});
