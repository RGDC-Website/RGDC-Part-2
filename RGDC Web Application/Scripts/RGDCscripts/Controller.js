app.controller("RGDCWebApplicationController", function ($scope, $timeout, RGDCWebApplicationService) {

    $scope.currentUserName = "";
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
        // simple, commonly used email regex
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    $scope.checkEmail = function () {
        const email = $scope.signUp_email || '';
        $scope.emailValid = $scope.hasValidEmail(email);
        // progressive checks
        $scope.emailChecks.hasAt = /@/.test(email);
        $scope.emailChecks.noSpace = !/\s/.test(email);
        // dot after at
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

    $scope.signUpRemove = function () {
        var modal = document.getElementById("patientInformationForm");
        if (modal) {
            modal.style.display = "none";
        }
    }

    $scope.getGender = function () {
        var genders = RGDCWebApplicationService.getGender();
        genders.then(function (returnedData) {
            $scope.genderArray = returnedData.data;
        });
    }

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
        var session = RGDCWebApplicationService.getSessionVariable();
        session.then(function (returnedData) {
            $scope.currentUserName = returnedData.data.userName || "";
            $scope.currentUserID = returnedData.data.userID || "";
            $scope.currentUserAuthorization = returnedData.data.userAuthorization || "";
            $scope.currentUserFullName = returnedData.data.fullName || "";
            console.log($scope.currentUserAuthorization)
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

    $scope.goToPatientInfo = function (patient) {
        var patientID = {
            patientID: patient.patientID.toString()
        }

        console.log(patientID)

        if ($scope.userAuthorization != 3) {
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
        if ($scope.userAuthorization != 3) {
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
            var getPersonalInfo = RGDCWebApplicationService.getPersonalInfo();
            getPersonalInfo.then(function (patientInfo) {
                if (!patientInfo || !patientInfo.data) return;

                var p = patientInfo.data;

                if (p.lastVisit) p.lastVisit = formatDateToMDY(p.lastVisit);
                if (p.nextVisit) p.nextVisit = formatDateToMDY(p.nextVisit);

                if (p.birthDate) {
                    var birthJs = parseJsonDateToJsDate(p.birthDate);
                    if (birthJs) {
                        p.birthDateRaw = birthJs;
                        p.birthDate = birthJs.toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric"
                        });
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

                // Initialize datepicker after patient data loads
                initializeDatepicker();
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

        // Normalize to local date-only values to avoid timezone-induced off-by-one errors
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
            genderID: $scope.selectedPatient.genderID ? parseInt($scope.selectedPatient.genderID) : null,
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

                            // Refresh patient details from server
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

    $scope.fillMedicalHistoryForm = function (medHistString) {
        var medHist = JSON.parse(medHistString);

        $scope.medical = $scope.medical || {};
        $scope.medical.history = $scope.medical.history || {};
        $scope.medical.conditions = $scope.medical.conditions || {};

        angular.copy(medHist.history, $scope.medical.history);
        angular.copy(medHist.conditions, $scope.medical.conditions);
    }

});
