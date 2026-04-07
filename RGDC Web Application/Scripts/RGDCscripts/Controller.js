app.controller("RGDCWebApplicationController", function ($scope, $timeout, RGDCWebApplicationService, $http, $rootScope) {
    //DON'T MERGE ANYTHING MUNA NASISIRA CODE
    $scope.signaturePreview = null;
    $scope._uploadedSignaturePath = null;

    // retry counters for transient network/abort errors (-1)
    var _adminLoadRetries = 0;
    var _reqLoadRetries = 0;

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

    // Ensure root-scoped appointment arrays exist so views referencing $root won't break
    try {
        if (!$rootScope.requestedAppointments) $rootScope.requestedAppointments = [];
        if (!$rootScope.adminAppointments) $rootScope.adminAppointments = [];
    } catch (e) {
        // ignore
    }


    $scope.isAddPatientEmailValid = function () {
        return $scope.addPatientEmailValid;
    };

    $scope.checkAddPatientContact = function () {
        const pattern = /^09\d{9}$/;
        $scope.addPatientContactValid = pattern.test($scope.addPatient_contactNumber);
    };

    $scope.isAddPatientContactValid = function () {
        return $scope.addPatientContactValid;
    };

    $scope.checkAddPatientAddress = function () {
        $scope.addPatientAddressValid =
            $scope.addPatient_address &&
            $scope.addPatient_address.length >= 5;
    };

    $scope.isAddPatientAddressValid = function () {
        return $scope.addPatientAddressValid;
    };

    $scope.hasSpecialChar = function (pwd) {
        if (!pwd) return false;
        return /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(pwd);
    };

    $scope.isAddPatientFormValid = function () {
        return $scope.addPatient_firstName &&
            $scope.addPatient_lastName &&
            $scope.isAddPatientEmailValid() &&
            $scope.isAddPatientContactValid() &&
            $scope.isAddPatientAddressValid() &&
            $scope.addPatient_genderID &&
            $scope.addPatient_birthDate &&
            $scope.addPatient_civilStatus;
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
                }
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Email is already in use",
                        text: "Enter another email address",
                    });
                    return;
                
            }
        });
    };

    $scope.loadPastAppointments = function () {
        RGDCWebApplicationService.getPastAppointments()
            .then(function (resp) {
                var data = resp.data || [];
                if (!Array.isArray(data)) {
                    $scope.pastAppointments = [];
                    return;
                }
                var mapped = data.map(function (a) {
                    var jsDate = parseJsonDateToJsDate(a.dateTime);
                    var dateStr = jsDate ? jsDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";
                    var timeStr = jsDate ? jsDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : "";
                    return {
                        apptID: a.apptID,
                        date: dateStr,
                        time: timeStr,
                        purpose: a.purpose || a.reason || "",
                        dentistName: a.dentistName || "",
                        patientName: a.patientName || "",
                        status: a.status || "",
                        displayStatus: a.displayStatus || a.status || ""
                    };
                });
                $timeout(function () { $scope.pastAppointments = mapped; }, 0);
            })
            .catch(function (err) {
                console.error('Failed to load past appointments', err);
                $scope.pastAppointments = [];
            });
    };

    // Cancel appointment (patient action)
    $scope.cancelAppointment = function (appt) {
        if (!appt || !appt.apptID) return Swal.fire({ icon: 'error', title: 'Error', text: 'No appointment selected.' });

        // determine appointment datetime from list item; we need to reconstruct JS Date from appt.date + appt.time
        var apptDate = parseDateFromDisplay(appt.date, appt.time);
        if (!apptDate) return Swal.fire({ icon: 'error', title: 'Error', text: 'Unable to determine appointment datetime.' });

        var today = new Date();
        // cutoff: today + 2 days (inclusive) - cannot cancel if appointment date is <= cutoff
        var cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        cutoff.setDate(cutoff.getDate() + 2);
        if (apptDate <= cutoff) {
            return Swal.fire({ icon: 'error', title: 'Too Late', text: 'Appointments cannot be cancelled within 2 days of scheduled date.' });
        }

        Swal.fire({ icon: 'warning', title: 'Confirm Cancel', text: 'Are you sure you want to cancel this appointment?', showCancelButton: true }).then(function (res) {
            if (!res.isConfirmed) return;
            RGDCWebApplicationService.cancelAppointment({ apptID: appt.apptID })
                .then(function (resp) {
                    if (resp && resp.data && resp.data.success) {
                        Swal.fire({ icon: 'success', title: 'Cancelled', text: resp.data.message }).then(function () {
                            $scope.loadAdminScheduledAppointments();
                            $scope.loadRequestedAppointments();
                        });
                    } else {
                        Swal.fire({ icon: 'error', title: 'Error', text: (resp && resp.data && resp.data.message) || 'Failed to cancel.' });
                    }
                })
                .catch(function (err) {
                    console.error('Cancel appointment error:', err);
                    Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred while cancelling the appointment.' });
                });
        });
    };

    function parseDateFromDisplay(dateStr, timeStr) {
        // dateStr expected like "MonthName D, YYYY" (e.g., "February 28, 2026")
        if (!dateStr) return null;
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) {
            // try parsing timestamp-like strings
            var m = String(dateStr).match(/\d+/);
            if (m) {
                d = new Date(parseInt(m[0], 10));
            }
        }
        if (!timeStr || isNaN(d.getTime())) return isNaN(d.getTime()) ? null : d;

        var match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (!match) return d;
        var hh = parseInt(match[1], 10);
        var mm = parseInt(match[2], 10);
        var mer = match[3] ? match[3].toUpperCase() : '';
        if (mer) {
            if (mer === 'PM' && hh !== 12) hh += 12;
            if (mer === 'AM' && hh === 12) hh = 0;
        }
        d.setHours(hh, mm, 0, 0);
        return d;
    }

    $scope.editPayRec = function (paymentID) {
        $scope.getPatientsNDentist();
        var paymentData = {
            paymentID: paymentID
        }
        var getPaymentInfo = RGDCWebApplicationService.getPaymentInfo(paymentData);
        getPaymentInfo.then(function (payment) {
            $scope.paymentInfo = payment.data;
            if ($scope.paymentInfo.paymentDate) {
                $scope.paymentInfo.paymentDate = formatDateToMDY($scope.paymentInfo.paymentDate)
            }
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
                Swal.fire({ icon: 'success', title: 'Deleted', text: 'Successfully deleted payment record.' }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = "/RGDC/adminFinance";
                        afterUpdate();
                    }
                });
            });
    }

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

    $scope.getBranch = function () {
        RGDCWebApplicationService.getBranch()
            .then(function (returnedData) {
                $scope.branchArray = returnedData.data || [];

                $scope.branchArray.forEach(function (b) {
                    if (b && typeof b.branchID !== 'undefined') b.branchID = parseInt(b.branchID, 10);
                });

            })
            .catch(function (err) {
                console.error('Failed to load branch', err);
                $scope.branchArray = [];
            });
    };

    // Helper: parse ASP.NET JSON date "/Date(1234567890)/" or accept already-ISO strings
    // Made accessible to all functions that need it
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

    // --- Appointment listing: load scheduled appointments for admin table ---
    $scope.loadAdminScheduledAppointments = function () {
        RGDCWebApplicationService.getAdminScheduledAppointments()
            .then(function (response) {
                var data = response.data || [];
                $scope.adminAppointments = data.map(function (a) {
                    // Convert server date format to JS Date
                    var jsDate = parseJsonDateToJsDate(a.dateTime);
                    var dateStr = jsDate ? jsDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";
                    var timeStr = jsDate ? jsDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : "";
                    return {
                        apptID: a.apptID,
                        date: dateStr,
                        time: timeStr,
                        purpose: a.purpose || a.reason || "",
                        dentistName: a.dentistName || "",
                        patientName: a.patientName || "",
                        status: a.status || "",
                        displayStatus: a.displayStatus || a.status || "",
                        createdBy: a.createdBy || null
                    };
                });
                // also expose on root scope so patient/admin views can read it as $root.adminAppointments
                try {
                    if ($rootScope) $rootScope.adminAppointments = $scope.adminAppointments;
                } catch (e) {
                    // ignore
                }
                try { updateDashboardLists(); } catch (e) { }
            })
            .catch(function (err) {
                // Retry on aborted requests (-1) up to 2 times
                if (err && err.status === -1 && _adminLoadRetries < 2) {
                    _adminLoadRetries++;
                    $timeout($scope.loadAdminScheduledAppointments, 500);
                    return;
                }
                if (err && err.status && err.status !== -1) console.error("Failed to load admin scheduled appointments", err);
                $scope.adminAppointments = [];
                try { if ($rootScope) $rootScope.adminAppointments = []; } catch (e) {}
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

                // login successful
                Swal.fire({
                    title: "Login Successful!",
                    text: "Welcome back, " + $scope.currentUserFirstName + "!",
                    icon: "success"
                }).then(() => {
                    // Redirect based on user role
                    var auth = String(returnedData.data.authorization || "");
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
                $scope.isUserStaff = ($scope.currentUserAuthorization === "1");
                $scope.currentUserFullName = returnedData.data.fullName || "";

                // BAGONG CODE PARA SA GOOGLE CALENDAR
                $scope.googleCalendarEnabled = !!returnedData.data.googleCalendarEnabled;
                $scope.googleConnected = !!returnedData.data.googleRefreshTokenPresent;

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
                $scope.patientArrayData = (patientList.data || []).map(function (patient) {
                    return Object.assign({}, patient, {
                        lastVisitDisplay: patient.lastVisit ? formatDateToMDY(patient.lastVisit) : "No visit yet"
                    });
                });

                $timeout(function () {
                    try {
                        // If we previously created an instance, try to destroy it first
                        if (window._adminPatientsDataTableInstance && typeof window._adminPatientsDataTableInstance.destroy === 'function') {
                            try { window._adminPatientsDataTableInstance.destroy(); } catch (e) { console.warn('destroy DataTable failed', e); }
                        }

                        // Create DataTable instance after rows are rendered
                        if (window && typeof DataTable === 'function') {
                            window._adminPatientsDataTableInstance = new DataTable('#adminPatientsTabTable');
                        } else {
                            console.warn('DataTable constructor not found.');
                        }
                    } catch (e) {
                        console.error('Failed to init admin patients DataTable:', e);
                    }
                }, 0);
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
                    // session auth loaded
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
                    console.log($scope.patientTreatments)
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

            if ($scope.selectedPatient.email) {
        // ensure format checked at least once
        if (!$scope.editPatientEmailValid) {
            Swal.fire({ icon: 'error', title: 'Invalid Email', text: 'Please enter a valid email address.' });
            return;
        }
        if ($scope.editPatientEmailTaken) {
            Swal.fire({ icon: 'error', title: 'Email Taken', text: 'This email is already in use by another account.' });
            return;
        }
    }

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
             occupation: $scope.selectedPatient.occupation,
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
                var modal = document.getElementById("modalEditPatientInfo");
                if (modal) {
                    if (typeof M !== 'undefined' && M.Modal) {
                        var inst = M.Modal.getInstance(modal);
                        if (inst) inst.close();
                    } else {
                        modal.style.display = "none";
                    }
                }
                window.location.href = "/RGDC/patientProfile";
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

    // Navigate to the appropriate home based on role
    $scope.goHome = function () {
        if ($scope.isUserPatient) {
            window.location.href = '/RGDC/patientDashboard';
        } else if ($scope.currentUserAuthorization === "2") {
            window.location.href = '/RGDC/dentistDashboard';
        } else {
            window.location.href = '/RGDC/adminDashboard';
        }
    };

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
                var modal = document.getElementById("modalMedHis")
                var instance = M.Modal.getInstance(modal);
                instance.close();
                var updateMedHist = RGDCWebApplicationService.updateMedHist(medHist);
                updateMedHist.then(function (response) {
                    if ($scope.selectedPatient.signatureLink == null) {
                        $scope.saveSignature();
                    } else {
                        Swal.fire({
                            icon: "error",
                            title: "Upload Signature",
                            text: "Unable to edit medical history",
                        });
                    }
                   
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

    // --- Edit appointment functionality ---
    // Store appointment ID independently to prevent scope loss
    var currentEditingApptID = null;
    
    $scope.editingAppt = {
        apptID: null,
        dateObj: '',
        dateStr: '',
        timeStr: '',
        purpose: '',
        dentistName: '',
        patientName: ''
    };

    $scope.openEditApptModal = function (appt, $event) {
        if ($event && $event.preventDefault) {
            $event.preventDefault();
            if ($event.stopPropagation) $event.stopPropagation();
        }
        if (!appt || !appt.apptID) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No valid appointment selected.'
            });
            return;
        }

        // Store apptID in a closure variable to preserve it
        currentEditingApptID = appt.apptID;

        // Parse the date string into ISO format for HTML5 date input
        var isoDateStr = '';
        if (appt.date) {
            var dateObj = new Date(appt.date);
            if (!isNaN(dateObj.getTime())) {
                // Convert to ISO format (YYYY-MM-DD)
                var year = dateObj.getFullYear();
                var month = String(dateObj.getMonth() + 1).padStart(2, '0');
                var day = String(dateObj.getDate()).padStart(2, '0');
                isoDateStr = year + '-' + month + '-' + day;
            }
        }

        // Update the scope object directly with all properties
        $scope.editingAppt.apptID = appt.apptID;
        $scope.editingAppt.dateObj = isoDateStr;
        $scope.editingAppt.dateStr = appt.date;
        $scope.editingAppt.timeStr = appt.time;
        $scope.editingAppt.purpose = appt.purpose;
        $scope.editingAppt.dentistName = appt.dentistName;
        $scope.editingAppt.patientName = appt.patientName;

        // Open modal programmatically
        $timeout(function () {
            var modalElem = findModalElement(['modalEditSchedAppt', 'modalEditSched', 'modal-edit-sched', 'modalEditSchedAppt']);
            if (modalElem) {
                // Store apptID on the hidden input field
                var hiddenField = document.getElementById('hiddenApptID');
                if (hiddenField) {
                    hiddenField.value = appt.apptID;
                }
                
                // store apptID on modal element as backup
                modalElem.setAttribute('data-edit-appt-id', appt.apptID);
                var modalInst = M.Modal.getInstance(modalElem);
                if (!modalInst) modalInst = M.Modal.init(modalElem);
                modalInst.open();
            }
        }, 100);
    };

    $scope.onTimeChange = function () {
        // no-op to avoid re-initializing Materialize select which duplicates elements
    };

    $scope.updateAppointment = function () {
        if (!$scope.editingAppt) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'editingAppt object is undefined.'
            });
            return;
        }

        // Use apptID from multiple fallback sources
        var hiddenField = document.getElementById('hiddenApptID');
        var hiddenApptID = hiddenField ? parseInt(hiddenField.value) : null;
        var apptIDToUse = $scope.editingAppt.apptID || hiddenApptID || currentEditingApptID;
        
        if (!apptIDToUse) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No appointment selected for editing. apptID is missing.'
            });
            return;
        }

        if (!$scope.editingAppt.dateObj || !$scope.editingAppt.timeStr || !$scope.editingAppt.purpose) {
            Swal.fire({
                icon: 'error',
                title: 'Missing Fields',
                text: 'Please fill in all required fields (Date, Time, Purpose).'
            });
            return;
        }

        // Parse ISO date format (YYYY-MM-DD) from HTML5 date input
        var isoDateStr = $scope.editingAppt.dateObj;
        var dateTime = new Date(isoDateStr);
        
        if (isNaN(dateTime.getTime())) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Date',
                text: 'Please select a valid date.'
            });
            return;
        }

        // Extract time from the time string (format: "h:mm AM/PM" or "HH:mm")
        var timeStr = $scope.editingAppt.timeStr;
        var timeParts = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        
        if (!timeParts) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Time',
                text: 'Please select a valid time.'
            });
            return;
        }

        var hours = parseInt(timeParts[1], 10);
        var minutes = parseInt(timeParts[2], 10);
        var meridiem = timeParts[3] ? timeParts[3].toUpperCase() : '';

        // Convert to 24-hour format if AM/PM is present
        if (meridiem) {
            if (meridiem === 'PM' && hours !== 12) {
                hours += 12;
            } else if (meridiem === 'AM' && hours === 12) {
                hours = 0;
            }
        }

        // Set the time on the date object
        dateTime.setHours(hours, minutes, 0, 0);

        // Create the update data object with the properly formatted datetime
        var updateData = {
            apptID: apptIDToUse,
            dateTime: dateTime,
            reason: $scope.editingAppt.purpose
        };

        RGDCWebApplicationService.updateAppointment(updateData)
            .then(function (response) {
                if (response.data && response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Appointment updated successfully.'
                    }).then(function() {
                        // Close modal
                        var modal = findModalElement(['modalEditSchedAppt', 'modalEditSched', 'modal-edit-sched']);
                        if (modal && typeof M !== 'undefined' && M.Modal) {
                            var inst = M.Modal.getInstance(modal);
                            if (inst) inst.close();
                        }
                        
                        // Reset closure variable
                        currentEditingApptID = null;
                        
                        // Reset the editingAppt object
                        $scope.editingAppt = {
                            apptID: null,
                            dateObj: '',
                            dateStr: '',
                            timeStr: '',
                            purpose: '',
                            dentistName: '',
                            patientName: ''
                        };
                        
                        // Reload appointments
                        $scope.loadAdminScheduledAppointments();
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.data.message || 'Failed to update appointment.'
                    });
                }
            })
            .catch(function (err) {
                console.error('Update appointment error:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'An error occurred while updating the appointment.'
                });
            });
    };

    $scope.openDeleteApptModal = function (appt, source) {
        $scope.deletingAppt = appt;
        $scope.deletingApptSource = source || 'scheduled';
        // set fallback hidden field for cases where scope may not persist
        try {
            var hidden = document.getElementById('hiddenDeleteApptID');
            if (hidden) hidden.value = appt && appt.apptID ? appt.apptID : '';
        } catch (e) {}
        // open modal programmatically in case element is not using materialize auto-init
        $timeout(function () {
            var modal = findModalElement(['modalDeleteSchedAppt', 'modalDeleteSched', 'modal-delete-sched', 'modalDeleteSchedAppt']);
            if (modal) {
                var inst = M.Modal.getInstance(modal);
                if (!inst) inst = M.Modal.init(modal);
                inst.open();
            }
        }, 50);
    };

    // Initialize admin appointments on controller load
    $timeout(function () {
        // Ensure session variables loaded to know current role
        $scope.getSessionVariables().then(function () {
            $scope.loadAdminScheduledAppointments();
            $scope.loadDentistList();
            $scope.loadPatientList();
            $scope.loadRequestedAppointments();
            $scope.loadPastAppointments();

            if ($scope.currentUserAuthorization === "2") {
                RGDCWebApplicationService.getCurrentDentist().then(function (resp) {
                    if (resp && resp.data && resp.data.success) {
                        $scope.currentDentist = { dentistID: resp.data.dentistID, dentistName: resp.data.dentistName };
                        $scope.newApptRequest = $scope.newApptRequest || {};
                        $scope.newApptRequest.dentistID = resp.data.dentistID;
                    }
                }).catch(function () {});
            }

            // If patient user, pre-select their patient record so they don't have to choose
            if ($scope.currentUserAuthorization === "3") {
                RGDCWebApplicationService.getOwnPatientDetails().then(function (resp) {
                    if (resp && resp.data && resp.data.patientID) {
                        $scope.newApptRequest = $scope.newApptRequest || {};
                        $scope.newApptRequest.patientID = parseInt(resp.data.patientID, 10);
                    }
                }).catch(function () { });
            }

            // compute minimum selectable date (today + 3 days) for appointment date inputs (global)
            (function computeMinDate(){
                var d = new Date();
                d.setDate(d.getDate() + 3);
                var yyyy = d.getFullYear();
                var mm = String(d.getMonth() + 1).padStart(2, '0');
                var dd = String(d.getDate()).padStart(2, '0');
                $scope.minApptDate = yyyy + '-' + mm + '-' + dd;

                // also expose a Date object for initializing Materialize datepickers
                $scope._minApptDateObj = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            })();

            // initialize appointment-specific datepickers (create/edit modals)
            $timeout(function () { initializeAppointmentDatepickers(); }, 150);
        }).catch(function () {
            // fallback loads even if session not available
            $scope.loadAdminScheduledAppointments();
            $scope.loadDentistList();
            $scope.loadPatientList();
            $scope.loadRequestedAppointments();
        });
    }, 100);

    // Initialization helper specifically for patient dashboard
    $scope.initPatientDashboard = function () {
        // Ensure session variables are loaded then load requested appointments
        $scope.getSessionVariables().then(function () {
            // load lists required by patient dashboard
            $scope.loadDentistList();
            $scope.loadPatientList();
            $scope.loadRequestedAppointments();
            $scope.loadAdminScheduledAppointments();
            // If dentist user, get current dentist info so modal can prefill
            if ($scope.currentUserAuthorization === "2") {
                RGDCWebApplicationService.getCurrentDentist().then(function (resp) {
                    if (resp && resp.data && resp.data.success) {
                        $scope.currentDentist = { dentistID: resp.data.dentistID, dentistName: resp.data.dentistName };
                        // prefill add form dentistID so dentist doesn't need to select
                        $scope.newApptRequest = $scope.newApptRequest || {};
                        $scope.newApptRequest.dentistID = resp.data.dentistID;
                    }
                }).catch(function () {});
            }
            // compute minimum selectable date (today + 3 days) for appointment date inputs
            (function computeMinDate(){
                var d = new Date();
                d.setDate(d.getDate() + 3);
                var yyyy = d.getFullYear();
                var mm = String(d.getMonth() + 1).padStart(2, '0');
                var dd = String(d.getDate()).padStart(2, '0');
                $scope._minApptDateObj = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            })();
            // initialize appointment-specific datepickers
            $timeout(function () { initializeAppointmentDatepickers(); }, 150);
        }).catch(function (err) {
            // ignore session errors here
        });
    };

    $scope.deleteAppointment = function () {
        // Try scope first, then fallback to hidden field
        var id = null;
        if ($scope.deletingAppt && $scope.deletingAppt.apptID) id = parseInt($scope.deletingAppt.apptID, 10);
        if (!id) {
            try {
                var hidden = document.getElementById('hiddenDeleteApptID');
                if (hidden && hidden.value) id = parseInt(hidden.value, 10);
            } catch (e) {
                console.error(e);
            }
        }
        if (!id || isNaN(id) || id <= 0) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No appointment selected.' });
            return;
        }
        // If deletion was initiated from scheduled tab, perform a Cancel (move to past with status Cancelled)
        if ($scope.deletingApptSource === 'scheduled') {
            RGDCWebApplicationService.cancelAppointment({ apptID: id })
                .then(function (response) {
                    if (response && response.data && response.data.success) {
                        Swal.fire({ icon: 'success', title: 'Cancelled', text: response.data.message }).then(function () {
                            // close modal
                            var modal = findModalElement(['modalDeleteSchedAppt', 'modalDeleteSched', 'modal-delete-sched']);
                            if (modal && typeof M !== 'undefined' && M.Modal) {
                                var inst = M.Modal.getInstance(modal);
                                if (inst) inst.close();
                            }
                            $scope.deletingAppt = null;
                            try { var hidden = document.getElementById('hiddenDeleteApptID'); if (hidden) hidden.value = ''; } catch (e) { }
                            // Reload lists so cancelled appointment moves from scheduled to past
                            $scope.loadAdminScheduledAppointments();
                            $scope.loadPastAppointments();
                            $scope.loadRequestedAppointments();
                        });
                    } else {
                        Swal.fire({ icon: 'error', title: 'Error', text: (response && response.data && response.data.message) || 'Failed to cancel appointment.' });
                    }
                })
                .catch(function (err) {
                    console.error('Cancel appointment error:', err);
                    Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred while cancelling the appointment.' });
                });
            return;
        }

        // Otherwise, deletion from past tab: delete permanently
        RGDCWebApplicationService.deleteAppointment({ apptID: id })
            .then(function (response) {
                if (response && response.data && response.data.success) {
                    Swal.fire({ icon: 'success', title: 'Deleted', text: response.data.message }).then(function () {
                        // close modal
                        var modal = findModalElement(['modalDeleteSchedAppt', 'modalDeleteSched', 'modal-delete-sched']);
                        if (modal && typeof M !== 'undefined' && M.Modal) {
                            var inst = M.Modal.getInstance(modal);
                            if (inst) inst.close();
                        }
                        $scope.deletingAppt = null;
                        try { var hidden = document.getElementById('hiddenDeleteApptID'); if (hidden) hidden.value = ''; } catch (e) {}
                        // Reload past appointments list
                        $scope.loadPastAppointments();
                    });
                } else {
                    Swal.fire({ icon: 'error', title: 'Error', text: (response && response.data && response.data.message) || 'Failed to delete appointment.' });
                }
            })
            .catch(function (err) {
                console.error('Delete appointment error:', err);
                Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred while deleting the appointment.' });
            });
    };

    // --- Appointment Request Functionality ---
    $scope.dentistArray = [];
    $scope.patientArray = [];
    $scope.requestedAppointments = [];

    $scope.loadDentistList = function () {
        RGDCWebApplicationService.getDentistList()
            .then(function (response) {
                $scope.dentistArray = response.data || [];
            })
            .catch(function (err) {
                console.error("Failed to load dentist list", err);
                $scope.dentistArray = [];
            });
    };

    $scope.loadPatientList = function () {
        RGDCWebApplicationService.getPatientListForAppointment()
            .then(function (response) {
                $scope.patientArray = response.data || [];
            })
            .catch(function (err) {
                console.error("Failed to load patient list", err);
                $scope.patientArray = [];
            });
    };

    $scope.loadRequestedAppointments = function () {
        RGDCWebApplicationService.getRequestedAppointments()
            .then(function (response) {
                var data = response.data || [];

                // response received for requested appointments

                // Check if this is an error response (session expired)
                if (data && typeof data === 'object' && data.success === false && data.message) {
                    // This is a session expiry error, suppress it silently
                    $scope.requestedAppointments = [];
                    return;
                }

                // Ensure data is an array before calling map
                if (!Array.isArray(data)) {
                    // Silent fail - likely due to logout
                    $scope.requestedAppointments = [];
                    return;
                }

                var mapped = data.map(function (a) {
                    var jsDate = parseJsonDateToJsDate(a.dateTime);
                    var dateStr = jsDate ? jsDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";
                    var timeStr = jsDate ? jsDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : "";
                    return {
                        apptID: a.apptID,
                        date: dateStr,
                        time: timeStr,
                        purpose: a.purpose || a.reason || "",
                        dentistName: a.dentistName || "",
                        patientName: a.patientName || "",
                        status: a.status || "",
                        displayStatus: a.displayStatus || a.status || ""
                    };
                });

                // ensure view updates in case promise resolved outside digest
                $timeout(function () {
                    $scope.requestedAppointments = mapped;

                    // expose requested appointments on root scope for views that read $root.requestedAppointments
                    try {
                        if ($rootScope) $rootScope.requestedAppointments = mapped;
                    } catch (e) {
                        // ignore
                    }

                    // recompute dashboard lists
                    try { updateDashboardLists(); } catch (e) { }
                }, 0);
            })
            .catch(function (err) {
                // Retry on aborted requests (-1) up to 2 times
                if (err && err.status === -1 && _reqLoadRetries < 2) {
                    _reqLoadRetries++;
                    $timeout($scope.loadRequestedAppointments, 500);
                    return;
                }
                if (err && err.status && err.status !== -1) console.error('Failed to load requested appointments', err);
                $scope.requestedAppointments = [];
                try { if ($rootScope) $rootScope.requestedAppointments = []; } catch (e) { }
                try { updateDashboardLists(); } catch (e) { }
            });
    };

    $scope.newApptRequest = {
        patientID: null,
        dentistID: null,
        dateTime: null,
        reason: ""
    };

    // Dashboard lists (per-account view)
    $scope.dashboardRequested = [];
    $scope.dashboardScheduled = [];

    function updateDashboardLists() {
        try {
            // requestedAppointments is already role-filtered by server
            $scope.dashboardRequested = Array.isArray($scope.requestedAppointments) ? $scope.requestedAppointments.slice(0) : [];

            // For scheduled, filter adminAppointments to those relevant to current account
            var all = Array.isArray($scope.adminAppointments) ? $scope.adminAppointments : [];
            if ($scope.currentUserAuthorization === "2") {
                // dentist: filter by dentistName if available
                var name = ($scope.currentDentist && $scope.currentDentist.dentistName) ? $scope.currentDentist.dentistName : $scope.currentUserFullName;
                $scope.dashboardScheduled = all.filter(function (a) { return a.dentistName === name; });
            } else if ($scope.currentUserAuthorization === "3") {
                // patient: filter by patientName matching currentUserFullName
                var pname = $scope.currentUserFullName || "";
                $scope.dashboardScheduled = all.filter(function (a) { return a.patientName === pname; });
            } else {
                // admin/staff/owner: show upcoming scheduled (limit to 10)
                $scope.dashboardScheduled = all.slice(0, 10);
            }
        } catch (e) {
            console.error('updateDashboardLists error', e);
            $scope.dashboardRequested = $scope.dashboardRequested || [];
            $scope.dashboardScheduled = $scope.dashboardScheduled || [];
        }
    }

    $scope.createNewAppointmentRequest = function () {
        // If patient user didn't supply patientID (they are creating for themselves), fetch own patientID
        if (!$scope.newApptRequest.patientID && $scope.currentUserAuthorization === "3") {
            // avoid re-entrancy
            if ($scope._resolvingOwnPatientID) return;
            $scope._resolvingOwnPatientID = true;
            RGDCWebApplicationService.getOwnPatientDetails().then(function (resp) {
                $scope._resolvingOwnPatientID = false;
                if (resp && resp.data && resp.data.patientID) {
                    $scope.newApptRequest = $scope.newApptRequest || {};
                    $scope.newApptRequest.patientID = parseInt(resp.data.patientID, 10);
                    // re-invoke create after resolving
                    $scope.createNewAppointmentRequest();
                } else {
                    Swal.fire({ icon: "error", title: "Error", text: "Unable to determine patient record." });
                }
            }).catch(function (err) {
                $scope._resolvingOwnPatientID = false;
                console.error('Failed to load own patient details', err);
                Swal.fire({ icon: "error", title: "Error", text: "Unable to determine patient record." });
            });
            return;
        }

        if (!$scope.newApptRequest.patientID || !$scope.newApptRequest.dentistID || !$scope.newApptRequest.dateTime || !$scope.newApptRequest.reason) {
            Swal.fire({
                icon: "error",
                title: "Missing Fields",
                text: "Please fill in all required fields (Patient, Dentist, Date, Time, Purpose)."
            });
            return;
        }

        // Parse the date and time
        var dateTimeStr = $scope.newApptRequest.dateTime;
        var timeStr = $scope.newApptRequest.time || "12:00 AM";
        var dateTime = new Date(dateTimeStr);

        if (isNaN(dateTime.getTime())) {
            Swal.fire({
                icon: "error",
                title: "Invalid Date",
                text: "Please select a valid date."
            });
            return;
        }

        // Extract time from the time string
        var timeParts = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (timeParts) {
            var hours = parseInt(timeParts[1], 10);
            var minutes = parseInt(timeParts[2], 10);
            var meridiem = timeParts[3] ? timeParts[3].toUpperCase() : '';

            if (meridiem) {
                if (meridiem === 'PM' && hours !== 12) {
                    hours += 12;
                } else if (meridiem === 'AM' && hours === 12) {
                    hours = 0;
                }
            }

            dateTime.setHours(hours, minutes, 0, 0);
        }

        var appointmentData = {
            patientID: parseInt($scope.newApptRequest.patientID),
            dentistID: parseInt($scope.newApptRequest.dentistID),
            dateTime: dateTime,
            reason: $scope.newApptRequest.reason
        };

        RGDCWebApplicationService.createAppointmentRequest(appointmentData)
            .then(function (response) {
                if (response.data && response.data.success) {
                    Swal.fire({
                        icon: "success",
                        title: "Success!",
                        text: "Appointment request created successfully and sent to the recipient."
                    }).then(function () {
                        // Clear form and close modal
                        $scope.newApptRequest = {
                            patientID: null,
                            dentistID: null,
                            dateTime: null,
                            reason: ""
                        };
                        $scope.newApptRequest.time = "12:00 AM";

                        var modal = findModalElement(['modalAddAppt', 'modal-add-appt', 'modalAddAppt']);
                        if (modal && typeof M !== 'undefined' && M.Modal) {
                            var inst = M.Modal.getInstance(modal);
                            if (inst) inst.close();
                        }

                        // Reload requested appointments to refresh the view
                        // Note: The appointment will only show in the recipient's requested appointments,
                        // not the creator's, based on role-based filtering
                        $scope.loadRequestedAppointments();
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: response.data.message || "Failed to create appointment request."
                    });
                }
            })
            .catch(function (err) {
                console.error("Create appointment error:", err);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "An error occurred while creating the appointment request."
                });
            });
    };

    $scope.acceptRequestedAppointment = function (apptID) {
        // Accept may be called with either an ID or the full appt object
        console.debug('acceptRequestedAppointment called with:', apptID);
        var id = 0;
        if (!apptID) {
            Swal.fire({ icon: "error", title: "Error", text: "No appointment selected." });
            return;
        }
        function extractId(obj) {
            if (!obj) return 0;
            if (typeof obj === 'number') return obj;
            if (typeof obj === 'string') return parseInt(obj, 10) || 0;
            if (obj.apptID) return parseInt(obj.apptID, 10) || 0;
            if (obj.id) return parseInt(obj.id, 10) || 0;
            for (var k in obj) {
                if (!obj.hasOwnProperty(k)) continue;
                if (/id$/i.test(k) || /Id$/i.test(k)) {
                    var v = parseInt(obj[k], 10);
                    if (!isNaN(v) && v > 0) return v;
                }
            }
            for (var k2 in obj) {
                if (!obj.hasOwnProperty(k2)) continue;
                var v2 = parseInt(obj[k2], 10);
                if (!isNaN(v2) && v2 > 0) return v2;
            }
            return 0;
        }

        id = extractId(apptID);
        try { console.debug('extracted id:', id); } catch (e) {}

        if (id <= 0) {
            Swal.fire({ icon: "error", title: "Error", text: "Invalid appointment ID." });
            return;
        }

        // send object payload to ensure model-binding on server
        RGDCWebApplicationService.acceptAppointment({ apptID: id })
            .then(function (response) {
                if (response && response.data && response.data.success) {
                    // reload both lists so UI updates across views
                    $scope.loadRequestedAppointments();
                    $scope.loadAdminScheduledAppointments();
                } else {
                    Swal.fire({ icon: "error", title: "Error", text: (response && response.data && response.data.message) || "Failed to accept appointment." });
                }
            })
            .catch(function (err) {
                console.error("Accept appointment error:", err);
                Swal.fire({ icon: "error", title: "Error", text: "An error occurred while accepting the appointment." });
            });
    };

    $scope.denyRequestedAppointment = function (apptID) {
        console.debug('denyRequestedAppointment called with:', apptID);
        var id = 0;
        if (!apptID) {
            Swal.fire({ icon: "error", title: "Error", text: "No appointment selected." });
            return;
        }
        function extractId(obj) {
            if (!obj) return 0;
            if (typeof obj === 'number') return obj;
            if (typeof obj === 'string') return parseInt(obj, 10) || 0;
            if (obj.apptID) return parseInt(obj.apptID, 10) || 0;
            if (obj.id) return parseInt(obj.id, 10) || 0;
            for (var k in obj) {
                if (!obj.hasOwnProperty(k)) continue;
                if (/id$/i.test(k) || /Id$/i.test(k)) {
                    var v = parseInt(obj[k], 10);
                    if (!isNaN(v) && v > 0) return v;
                }
            }
            for (var k2 in obj) {
                if (!obj.hasOwnProperty(k2)) continue;
                var v2 = parseInt(obj[k2], 10);
                if (!isNaN(v2) && v2 > 0) return v2;
            }
            return 0;
        }

        id = extractId(apptID);
        try { console.debug('extracted id:', id); } catch (e) {}

        if (id <= 0) {
            Swal.fire({ icon: "error", title: "Error", text: "Invalid appointment ID." });
            return;
        }

        RGDCWebApplicationService.denyAppointment({ apptID: id })
            .then(function (response) {
                if (response && response.data && response.data.success) {
                    $scope.loadRequestedAppointments();
                } else {
                    Swal.fire({ icon: "error", title: "Error", text: (response && response.data && response.data.message) || "Failed to deny appointment." });
                }
            })
            .catch(function (err) {
                console.error("Deny appointment error:", err);
                Swal.fire({ icon: "error", title: "Error", text: "An error occurred while denying the appointment." });
            });
    };
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
            Swal.fire({ icon: "error", title: "Error", text: "Select patient and dentist." });
            return;
        }

        if (!$scope.paymentCost || !$scope.paymentPaid) {
            Swal.fire({ icon: "error", title: "Error", text: "Input payment cost and paid amount." });
            return;
        }

        if (!$scope.paymentDate) {
            Swal.fire({ icon: "error", title: "Error", text: "Select Proper Date." });
            return;
        }
 
        $scope.paymentDue = $scope.paymentCost - ($scope.paymentDiscount || 0) - ($scope.paymentPaid || 0)

        console.log($scope.currentUserID)

        var paymentData = {
            patientID: $scope.selectedPatientID,
            dentistID: $scope.selectedDentistID,
            paymentMethod: $scope.paymentMethod,
            cost: parseFloat($scope.paymentCost) || 0,
            paymentDate: $scope.paymentDate,
            discount: parseFloat($scope.paymentDiscount) || 0,
            amountPaid: parseFloat($scope.paymentPaid) || 0,
            amountDue: parseFloat($scope.paymentDue) || 0,
            description: $scope.paymentDescription,
            createdBy: $scope.currentUserID         
        };

        RGDCWebApplicationService.addPayment(paymentData).then(function (response) {
            if (response.data.success) {
                Swal.fire({ icon: 'success', title: 'Added', text: 'Successfully added payment record.' }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = "/RGDC/adminFinance";
                        afterUpdate();
                    }
                });
            }
        })

    }

    $scope.editPayment = function () {


        if (!$scope.paymentInfo.cost || !$scope.paymentInfo.amountPaid) {
            Swal.fire({ icon: "error", title: "Error", text: "Input payment cost and paid amount." });
            return;
        }

        $scope.paymentInfo.amountDue = $scope.paymentInfo.cost - ($scope.paymentInfo.discount || 0) - ($scope.paymentInfo.amountPaid || 0)

        var data = {
            paymentID: $scope.paymentInfo.paymentID,
            paymentMethod: $scope.paymentInfo.paymentMethod,
            cost: $scope.paymentInfo.cost,
            paymentDate: $scope.paymentInfo.paymentDate,
            discount: $scope.paymentInfo.discount,
            amountPaid: $scope.paymentInfo.amountPaid,
            amountDue: $scope.paymentInfo.amountDue,
            description: $scope.paymentInfo.description
        };

       RGDCWebApplicationService.updatePayment(data)
           .then(function (response) {
               Swal.fire({ icon: 'success', title: 'Updated', text: 'Successfully updated payment record.' }).then((result) => {
                   if (result.isConfirmed) {
                       window.location.href = "/RGDC/adminFinance";
                       afterUpdate();
                   }

               });
            })
    }; 

    $scope.addPatient = function () {
        //for staff restriction in adding patients
        if ($scope.isUserStaff) {
            Swal.fire({ icon: 'error', title: 'Not authorized', text: 'Staff accounts cannot add patients.' });
            return;
        }

        //Add email duplication check
        var birthDate = new Date($scope.addPatient_birthDate);
        birthDate.setHours(0, 0, 0, 0); // 00:00:00
        console.log($scope.addPatient_firstName && $scope.addPatient_lastName && $scope.addPatient_genderID && $scope.addPatient_birthDate && $scope.addPatient_email && $scope.addPatient_contactNumber && $scope.addPatient_address && $scope.addPatient_civilStatus)
        if ($scope.addPatient_firstName && $scope.addPatient_lastName && $scope.addPatient_genderID && $scope.addPatient_birthDate && $scope.addPatient_email && $scope.addPatient_contactNumber && $scope.addPatient_address && $scope.addPatient_civilStatus) {
            var accountData = {
                firstName: $scope.addPatient_firstName,
                middleName: $scope.addPatient_middleName,
                lastName: $scope.addPatient_lastName,
                genderID: $scope.addPatient_genderID,
                birthDate: birthDate,
                email: $scope.addPatient_email,
                contactNumber: $scope.addPatient_contactNumber,
                address: $scope.addPatient_address,
                civilStatus: $scope.addPatient_civilStatus,
                password: "Default123",
                lastLogin: new Date(),
                accCreatedAt: new Date(),
                accUpdatedAt: new Date(),
                role: 3
            }
            var addPatient = RGDCWebApplicationService.signUp(accountData);
            addPatient.then(function (addPatientID) {
                var accId = addPatientID.data.accID;

                var uploadPromise = Promise.resolve();
                if ($scope.addPatientPhotoFile) {
                    uploadPromise = RGDCWebApplicationService.uploadUserPhoto($scope.addPatientPhotoFile, accId)
                        .then(function (resp) {
                            // resp.data.success expected from server; log or show message if needed
                            if (!(resp && resp.data && resp.data.success)) {
                                console.warn('UploadUserPhoto returned failure', resp && resp.data);
                                // continue anyway so patient row still created; optionally show alert
                            }
                        })
                        .catch(function (err) {
                            console.error('uploadUserPhoto error', err);
                            // continue anyway
                        });
                }
                uploadPromise.then(function () {
                    var patientData = {
                        currentPhysician: $scope.addPatient_currentPhysician,
                        referral: $scope.addPatient_referral,
                        lastVisit: $scope.addPatient_lastVisit,
                        medicalHistory: "",
                        accID: accId
                    };
                    var addPatientPatient = RGDCWebApplicationService.signUpPatient(patientData);
                    addPatientPatient.then(function () {
                        var user_email = {
                            email: $scope.addPatient_email
                        };
                        var sendEmail = RGDCWebApplicationService.sendEmail(user_email);
                        Swal.fire({ icon: 'success', title: 'Add Patient', text: 'Successfully added new patient payment record.' }).then((result) => {
                            if (result.isConfirmed) {
                                window.location.href = "/RGDC/adminPatientsTab";
                                afterUpdate();
                            }
                        });
                    }).catch(function (err) {
                        console.error('signUpPatient failed', err);
                        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to create patient record.' });
                    });
                });

            })
        }    
    }

    // Helper to find modal element by multiple possible ids (handles camelCase vs kebab-case in markup)
    function findModalElement(possibleIds) {
        for (var i = 0; i < possibleIds.length; i++) {
            try {
                var el = document.getElementById(possibleIds[i]);
                if (el) return el;
            } catch (e) { }
        }
        return null;
    }

    // Initialize datepickers used for appointment modals (create / edit)
    function initializeAppointmentDatepickers() {
        $timeout(function () {
            try {
                var elems = document.querySelectorAll('.appt-modal .datepicker');
                if (!elems || elems.length === 0) return;

                // min date object computed earlier (scope._minApptDateObj)
                var minDateObj = $scope._minApptDateObj || (function () { var d = new Date(); d.setDate(d.getDate() + 3); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); })();

                elems.forEach(function (el) {
                    // destroy existing instance if present
                    var existing = null;
                    try { existing = M.Datepicker.getInstance(el); } catch (e) { existing = null; }
                    if (existing) existing.destroy();

                    M.Datepicker.init(el, {
                        format: 'mmmm dd, yyyy',
                        autoClose: true,
                        minDate: minDateObj,
                        onSelect: function (date) {
                            $scope.$apply(function () {
                                // store ISO string so later new Date(...) parses reliably
                                $scope.newApptRequest = $scope.newApptRequest || {};
                                $scope.newApptRequest.dateTime = date.toISOString();
                            });
                        }
                    });
                });
            } catch (e) {
                console.error('initializeAppointmentDatepickers error', e);
            }
        }, 120);
    }



    //Google Calendaryo CODESSSSSSSSSSSSS
    $scope.googleConnected = false; $scope.googleCalendarEnabled = false;
    $scope.connectGoogle = function () {
        // open a centered popup
        var width = 700, height = 700;
        var left = Math.max(0, (screen.width - width) / 2);
        var top = Math.max(0, (screen.height - height) / 2);
        var popup = window.open('/RGDC/ConnectGoogle', 'google_oauth', 'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top);

        if (!popup) {
            Swal.fire({ icon: 'error', title: 'Popup blocked', text: 'Please allow popups for this site to connect Google.' });
            return;
        }

        var messageHandler = function (e) {
            if (!e.data || e.data.type !== 'google-auth-success') return;

            // optionally verify e.origin in production
            window.removeEventListener('message', messageHandler);

            // refresh UI state from server
            RGDCWebApplicationService.getSessionVariable()
                .then(function (resp) {
                    $scope.$apply(function () {
                        $scope.googleConnected = !!resp.data.googleRefreshTokenPresent;
                        $scope.googleCalendarEnabled = !!resp.data.googleCalendarEnabled;
                    });
                })
                .catch(function () {
                    $scope.$apply(function () {
                        $scope.googleConnected = true;
                        $scope.googleCalendarEnabled = true;
                    });
                });

            try { popup.close(); } catch (e) { }
        };

        window.addEventListener('message', messageHandler);
    };

    $scope.toggleGoogleCalendar = function (enabled) {
        RGDCWebApplicationService.toggleGoogleCalendar(enabled)
            .then(function (resp) {
                if (resp.data && resp.data.success) {
                    $scope.googleCalendarEnabled = enabled;
                    if (!enabled) {
                        $scope.googleConnected = false;
                    }
                } else {
                    Swal.fire({ icon: 'error', title: 'Error', text: (resp.data && resp.data.message) ? resp.data.message : 'Failed to toggled Google calendar sync.' });
                    // revert toggle UI
                    $timeout(function () { $scope.googleCalendarEnabled = !enabled; }, 0);
                }
            })
            .catch(function (err) {
                console.error(err);
                Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to toggle Google calendar sync.' });
                $timeout(function () { $scope.googleCalendarEnabled = !enabled; }, 0);
            });
    };

    // OPTIONAL helper to create an event for the current logged-in account (calls server-side CreateGoogleEvent)
    $scope.createGoogleEvent = function (apptID) {
        RGDCWebApplicationService.createGoogleEvent(apptID)
            .then(function (resp) {
                if (resp.data && resp.data.success) {
                    Swal.fire({ icon: 'success', title: 'Event created', text: 'Appointment saved to your Google Calendar.' });
                } else {
                    Swal.fire({ icon: 'error', title: 'Error', text: resp.data && resp.data.message ? resp.data.message : 'Failed to create event.' });
                }
            })
            .catch(function (err) {
                console.error('createGoogleEvent error', err);
                Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to create Google Calendar event.' });
            });
    };

    $scope.getClinicStaff = function () {
        var getClinicStaff = RGDCWebApplicationService.getClinicStaff();
        getClinicStaff.then(function (returnedData) {
            $scope.clinicOwners = returnedData.data.owners;
            $scope.clinicDentists = returnedData.data.dentists;
            $scope.clinicStaff = returnedData.data.staff;
        }); 
    }

    $scope.addOwner = function () {
        // validate format / duplicate one more time
        if (!isValidEmailFormat($scope.owner_email)) {
            Swal.fire({ icon: 'error', title: 'Invalid Email', text: 'Please enter a valid email (must contain @, no spaces).' });
            return;
        }
        if ($scope.ownerEmailTaken) {
            Swal.fire({ icon: 'error', title: 'Email Taken', text: 'Email is already taken.' });
            return;
        }

        var accountData = {
            firstName: $scope.owner_firstName,
            middleName: $scope.owner_middleName,
            lastName: $scope.owner_lastName,
            email: $scope.owner_email,
            genderID: $scope.owner_genderID,
            contactNumber: $scope.owner_contactNumber,
            birthDate: $scope.owner_birthDate,
            civilStatus: $scope.owner_civilStatus,
            address: $scope.owner_address,
            role: 0,
            photoLink: $scope.ownerUploadedPhotoPath || null
        };
        var addOwner = RGDCWebApplicationService.addAccount(accountData);
        addOwner.then(function (returnedData) {
            var ownerData = {
                accID: returnedData.data.accID,
                specialization: $scope.owner_specialization,
            }
            var addOwnerAcc = RGDCWebApplicationService.addOwner(ownerData);
            addOwnerAcc.then(function (returnedData) {
                if (returnedData.data.success) {
                    Swal.fire({ icon: 'success', title: 'Add Owner', text: 'Successfully added new owner.' }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = "/RGDC/adminClinicStaffTab";
                            afterUpdate();
                        }
                    });
                } else {
                    Swal.fire({ icon: 'Error', title: 'Add Owner', text: 'Cannot add new owner.' })
                }
            })
        });
    }

    $scope.addDentist = function () {
        if (!isValidEmailFormat($scope.dentist_email)) {
            Swal.fire({ icon: 'error', title: 'Invalid Email', text: 'Please enter a valid email (must contain @, no spaces).' });
            return;
        }
        if ($scope.dentistEmailTaken) {
            Swal.fire({ icon: 'error', title: 'Email Taken', text: 'Email is already taken.' });
            return;
        }

        var accountData = {
            firstName: $scope.dentist_firstName,
            middleName: $scope.dentist_middleName,
            lastName: $scope.dentist_lastName,
            email: $scope.dentist_email,
            genderID: $scope.dentist_genderID,
            contactNumber: $scope.dentist_contactNumber,
            birthDate: $scope.dentist_birthDate,
            civilStatus: $scope.dentist_civilStatus,
            address: $scope.dentist_address,
            role: 1
        }
        var addDentist = RGDCWebApplicationService.addAccount(accountData);
        addDentist.then(function (returnedData) {
            var dentistData = {
                accID: returnedData.data.accID,
                specialization: $scope.dentist_specialization,
                branchID: $scope.dentist_branchID
            }
            var addDentistAcc = RGDCWebApplicationService.addDentist(dentistData);
            addDentistAcc.then(function (returnedData) {
                if (returnedData.data.success) {
                    Swal.fire({ icon: 'success', title: 'Add Dentist', text: 'Successfully added new dentist.' }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = "/RGDC/adminClinicStaffTab";
                            afterUpdate();
                        }
                    });
                } else {
                    Swal.fire({ icon: 'Error', title: 'Add Owner', text: 'Cannot add new owner.' })
                }
            })
        });
    }

    $scope.addStaff = function () {
        if (!isValidEmailFormat($scope.staff_email)) {
            Swal.fire({ icon: 'error', title: 'Invalid Email', text: 'Please enter a valid email (must contain @, no spaces).' });
            return;
        }
        if ($scope.staffEmailTaken) {
            Swal.fire({ icon: 'error', title: 'Email Taken', text: 'Email is already taken.' });
            return;
        }

        var accountData = {
            firstName: $scope.staff_firstName,
            middleName: $scope.staff_middleName,
            lastName: $scope.staff_lastName,
            email: $scope.staff_email,
            genderID: $scope.staff_genderID,
            contactNumber: $scope.staff_contactNumber,
            birthDate: $scope.staff_birthDate,
            civilStatus: $scope.staff_civilStatus,
            address: $scope.staff_address,
            role: 2
        }
        var addStaff = RGDCWebApplicationService.addAccount(accountData);
        addStaff.then(function (returnedData) {
            var staffData = {
                accID: returnedData.data.accID,
                staffRole: $scope.staff_staffRole,
                branchID: $scope.staff_branchID
            }
            var addStaffAcc = RGDCWebApplicationService.addStaff(staffData);
            addStaffAcc.then(function (returnedData) {
                if (returnedData.data.success) {
                    Swal.fire({ icon: 'success', title: 'Add Staff', text: 'Successfully added new staff.' }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = "/RGDC/adminClinicStaffTab";
                            afterUpdate();
                        }
                    });
                } else {
                    Swal.fire({ icon: 'Error', title: 'Add Staff', text: 'Cannot add new Staff.' })
                }
            })
        });
    }

    $scope.selectDeleteOwner = function(ownerID, accID){
        $scope.ownerTBDeleted = ownerID;
        $scope.accTBDeleted = accID;
    }

    $scope.deleteOwner = function () {
        var ownerAcc = {
            ownerID: $scope.ownerTBDeleted,
            accID: $scope.accTBDeleted
        }
        var deleteOwner = RGDCWebApplicationService.deleteOwner(ownerAcc);
        deleteOwner.then(function (returnedData) {
            if (returnedData.data.success) {
                Swal.fire({ icon: 'success', title: 'Delete Owner', text: 'Successfully deleted owner account.' }).then((result) => {
                    if (result.isConfirmed) {

                        window.location.href = "/RGDC/adminClinicStaffTab";
                        afterUpdate();
                    }

                });
            }
        });
    }
    $scope.selectDeleteStaff = function (staffID, accID) {
        $scope.staffTBDeleted = staffID;
        $scope.accTBDeleted = accID;
    }

    $scope.deleteStaff = function () {
        var staffAcc = {
            staffID: $scope.staffTBDeleted,
            accID: $scope.accTBDeleted
        }
        var deleteStaff = RGDCWebApplicationService.deleteStaff(staffAcc);
        deleteStaff.then(function (returnedData) {
            if (returnedData.data.success) {
                Swal.fire({ icon: 'success', title: 'Delete Staff', text: 'Successfully deleted staff account.' }).then((result) => {
                    if (result.isConfirmed) {

                        window.location.href = "/RGDC/adminClinicStaffTab";
                        afterUpdate();
                    }

                });
            }
        });
    }

    $scope.selectDeleteDentist = function (dentistID, accID) {
        $scope.dentistTBDeleted = dentistID;
        $scope.accTBDeleted = accID;
    }

    $scope.deleteDentist = function () {
        var dentistAcc = {
            dentistID: $scope.dentistTBDeleted,
            accID: $scope.accTBDeleted
        }
        var deleteDentist = RGDCWebApplicationService.deleteDentist(dentistAcc);
        deleteDentist.then(function (returnedData) {
            if (returnedData.data.success) {
                Swal.fire({ icon: 'success', title: 'Delete dentist', text: 'Successfully deleted dentist account.' }).then((result) => {
                    if (result.isConfirmed) {

                        window.location.href = "/RGDC/adminClinicStaffTab";
                        afterUpdate();
                    }

                });
            }
        });
    }

    $scope.editSelectOwner = function (ownerID) {
        var ownerAcc = { ownerID: ownerID };
        RGDCWebApplicationService.selectOwner(ownerAcc)
            .then(function (returnedData) {
                $scope.owner = returnedData.data;
                $scope.owner.birthDate = formatDateToMDY($scope.owner.birthDate);

                $scope.ownerFirstNameTouched = false;
                $scope.ownerLastNameTouched = false;
                $scope.ownerAddressTouched = false;
                $scope.ownerContactTouched = false;
                $scope.ownerEmailTouched = false;

                $scope.validateOwnerEditFields && $scope.validateOwnerEditFields();
                $scope.validateOwnerEmailEdit && $scope.validateOwnerEmailEdit();
            });
    };

    $scope.editSelectDentist = function (dentistID) {
        var dentistAcc = { dentistID: dentistID };
        RGDCWebApplicationService.selectDentist(dentistAcc)
            .then(function (returnedData) {
                $scope.dentist = returnedData.data;
                $scope.dentist.birthDate = formatDateToMDY($scope.dentist.birthDate);

                $scope.dentistFirstNameTouched = false;
                $scope.dentistLastNameTouched = false;
                $scope.dentistAddressTouched = false;
                $scope.dentistContactTouched = false;
                $scope.dentistEmailTouched = false;

                $scope.validateDentistEditFields && $scope.validateDentistEditFields();
                $scope.validateDentistEmailEdit && $scope.validateDentistEmailEdit();
            });
    };

    $scope.editSelectStaff = function (staffID) {
        var staffAcc = { staffID: staffID };
        RGDCWebApplicationService.selectStaff(staffAcc)
            .then(function (returnedData) {
                $scope.staff = returnedData.data;
                $scope.staff.birthDate = formatDateToMDY($scope.staff.birthDate);

                $scope.staffFirstNameTouched = false;
                $scope.staffLastNameTouched = false;
                $scope.staffAddressTouched = false;
                $scope.staffContactTouched = false;
                $scope.staffEmailTouched = false;

                $scope.validateStaffEditFields && $scope.validateStaffEditFields();
                $scope.validateStaffEmailEdit && $scope.validateStaffEmailEdit();
            });
    };

    $scope.editOwner = function () {
        var accDet = {
            accID: $scope.owner.accID,
            firstName: $scope.owner.firstName,
            middleName: $scope.owner.middleName,
            lastName: $scope.owner.lastName,
            genderID: $scope.owner.genderID,
            birthDate: $scope.owner.birthDate,
            email: $scope.owner.email,
            contactNumber: $scope.owner.contactNumber,
            address: $scope.owner.address,
            civilStatus: $scope.owner.civilStatus,
        };

        var ownerDet = {
            ownerID: $scope.owner.ownerID,
            specialization: $scope.owner.specialization
        };

        // validation guard: required fields + email format + not taken
        $scope.validateOwnerEditFields();
        $scope.validateOwnerEmailEdit();
        if (!$scope.ownerFirstNameValid || !$scope.ownerLastNameValid || !$scope.ownerAddressValid) {
            Swal.fire({ icon: 'error', title: 'Missing required fields', text: 'Please fill in all required fields.' });
            return;
        }
        if (!$scope.ownerEmailFormatValid) {
            Swal.fire({ icon: 'error', title: 'Invalid Email', text: 'Please enter a valid email address.' });
            return;
        }
        if ($scope.ownerEmailTaken) {
            Swal.fire({ icon: 'error', title: 'Email Taken', text: 'This email is used by another account.' });
            return;
        }

        var photoFile = $scope.ownerPhotoFileEdit || null;
        // If user picked a photo in edit modal, upload it first and set acc photoLink on server
        var uploadPromise = _maybeUploadAccountPhoto(photoFile, $scope.owner.accID)
            .catch(function (err) {
                console.warn('Photo upload failed, proceeding with editAccount', err);
                return null; // proceed even if upload fails (or change to abort)
            });

        uploadPromise.then(function (filePath) {
            // if upload returned path, set model so server side editAccount can also update if needed
            if (filePath) accDet.photoLink = filePath;
            var editAccount = RGDCWebApplicationService.editAccount(accDet);
            editAccount.then(function (returnedData) {
                if (returnedData.data.success) {
                    var editOwner = RGDCWebApplicationService.editOwner(ownerDet);
                    editOwner.then(function (returnedData) {
                        if (returnedData.data.success) {
                            Swal.fire({ icon: 'success', title: 'Edit Owner', text: 'Successfully edited Owner Details.' }).then((result) => {
                                if (result.isConfirmed) {
                                    window.location.href = "/RGDC/adminClinicStaffTab";
                                    afterUpdate();
                                }
                            });
                        } else {
                            Swal.fire({ icon: 'error', title: 'Edit Owner', text: 'Cannot edit owner details.' })
                        }
                    })
                }
            })
                .catch(function (err) {
                    console.error('editAccount error', err);
                    Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to edit account.' });
                });
        });
    };
    $scope.editDentist = function () {
        var accDet = {
            accID: $scope.dentist.accID,
            firstName: $scope.dentist.firstName,
            middleName: $scope.dentist.middleName,
            lastName: $scope.dentist.lastName,
            genderID: $scope.dentist.genderID,
            birthDate: $scope.dentist.birthDate,
            email: $scope.dentist.email,
            contactNumber: $scope.dentist.contactNumber,
            address: $scope.dentist.address,
            civilStatus: $scope.dentist.civilStatus,
        }

        var dentistDet = {
            dentistID: $scope.dentist.dentistID,
            specialization: $scope.dentist.specialization,
            branchID: $scope.dentist.branchID
        }

        var editAccount = RGDCWebApplicationService.editAccount(accDet);
        editAccount.then(function (returnedData) {
            if (returnedData.data.success) {
                var editDentist = RGDCWebApplicationService.editDentist(dentistDet);
                editDentist.then(function (returnedData) {
                    if (returnedData.data.success) {
                        Swal.fire({ icon: 'success', title: 'Edit Dentist', text: 'Successfully edited Dentist Details.' }).then((result) => {
                            if (result.isConfirmed) {

                                window.location.href = "/RGDC/adminClinicStaffTab";
                                afterUpdate();
                            }

                        });
                    } else {
                        Swal.fire({ icon: 'Error', title: 'Edit Dentist', text: 'Cannot edit dentist details.' })
                    }
                })
            }
        })
    }
    $scope.editStaff = function () {
        var accDet = {
            accID: $scope.staff.accID,
            firstName: $scope.staff.firstName,
            middleName: $scope.staff.middleName,
            lastName: $scope.staff.lastName,
            genderID: $scope.staff.genderID,
            birthDate: $scope.staff.birthDate,
            email: $scope.staff.email,
            contactNumber: $scope.staff.contactNumber,
            address: $scope.staff.address,
            civilStatus: $scope.staff.civilStatus,
        }

        var staffDet = {
            staffID: $scope.staff.staffID,
            staffRole: $scope.staff.staffRole,
            branchID: $scope.staff.branchID
        }

        var editAccount = RGDCWebApplicationService.editAccount(accDet);
        editAccount.then(function (returnedData) {
            if (returnedData.data.success) {
                var editStaff = RGDCWebApplicationService.editStaff(staffDet);
                editStaff.then(function (returnedData) {
                    if (returnedData.data.success) {
                        Swal.fire({ icon: 'success', title: 'Edit Staff', text: 'Successfully edited Staff Details.' }).then((result) => {
                            if (result.isConfirmed) {

                                window.location.href = "/RGDC/adminClinicStaffTab";
                                afterUpdate();
                            }

                        });
                    } else {
                        Swal.fire({ icon: 'Error', title: 'Edit Staff', text: 'Cannot edit staff details.' })
                    }
                })
            }
        })
    }

    $scope.getDentistOwner = function () {
        var getDentistOwner = RGDCWebApplicationService.getDentistOwner();
        getDentistOwner.then(function (returnedData) {
            $scope.dentistArrays = returnedData.data;
            console.log($scope.dentistArrays)
        });
    }

    $scope.addProgressNotes = function () {
        var progressNotes = {
            date: $scope.progNote_date,
            patientID: $scope.selectedPatient.patientID,
            accID: $scope.progNote_accID,
            amount: parseFloat($scope.progNote_amount),
            paid: parseFloat($scope.progNote_paid) ,
            procedures: $scope.progNote_procedures,
            toothNumber: $scope.progNote_toothNumber
        }
        var addProgNotes = RGDCWebApplicationService.addProgNotes(progressNotes)
        addProgNotes.then(function (returnedData) {
                if (returnedData.data.success) {
                    Swal.fire({ icon: 'success', title: 'Added Progress Notes', text: 'Successfully added progress notes.' }).then((result) => {
                        if (result.isConfirmed) {

                            window.location.href = "/RGDC/patientProfile";
                            afterUpdate();
                        }

                    });
                } else {
                    Swal.fire({ icon: 'error', title: 'Add Progress Notes', text: 'Cannot add progress notes.' })
                }
            
        })
    }

    $scope.selectEditProg = function (trtPlanID) {
        var trtPlan = {
            trtPlanID: trtPlanID,
        }
        var selectPlan = RGDCWebApplicationService.selectPlan(trtPlan);
        selectPlan.then(function (returnedData) {
            console.log(returnedData.data)
            $scope.progNote = returnedData.data;
            $scope.progNote.accID = Number(returnedData.data.accID);
            $scope.progNote.date = formatDateToMDY($scope.progNote.date);
        });
    }

    $scope.editProgressNotes = function () {
        $scope.editProgressNotes = function () {

            var updatedProgNote = {
                trtPlanID: $scope.progNote.trtPlanID,
                accID: parseInt($scope.progNote.accID),
                date: $scope.progNote.date,
                toothNumber: $scope.progNote.toothNumber,
                procedures: $scope.progNote.procedures,
                amount: parseFloat($scope.progNote.amount),
                paid: parseFloat($scope.progNote.paid)
            };

            var editRequest = RGDCWebApplicationService.editProgressNotes(updatedProgNote);
            editRequest.then(function (returnedData) {
                if (returnedData.data.success) {
                    Swal.fire({ icon: 'success', title: 'Edited Progress Notes', text: 'Successfully edited progress notes.' }).then((result) => {
                        if (result.isConfirmed) {

                            window.location.href = "/RGDC/patientProfile";
                            afterUpdate();
                        }

                    });
                } else {
                    Swal.fire({ icon: 'error', title: 'Edit Progress Notes', text: 'Cannot edit progress notes.' })
                }
            });
        }
    }

    $scope.selectDeleteProg = function (trtPlanID) {
        $scope.trtPlanID = trtPlanID;
    }

    $scope.deleteProgressNotes = function () {
        var trtPlan = {
            trtPlanID: $scope.trtPlanID,
        }
        var deletePlan = RGDCWebApplicationService.deletePlan(trtPlan);
        deletePlan.then(function (returnedData) {
            if (returnedData.data.success) {
                Swal.fire({ icon: 'success', title: 'Deleted Progress Notes', text: 'Successfully deleted progress notes.' }).then((result) => {
                    if (result.isConfirmed) {

                        window.location.href = "/RGDC/patientProfile";
                        afterUpdate();
                    }

                });
            } else {
                Swal.fire({ icon: 'error', title: 'Delete Progress Notes', text: 'Cannot delete progress notes.' })
            }
        });
    }

    $scope.overview = {};
    $scope.getOverviewData = function () {
            RGDCWebApplicationService.getOverviewData()
        .then(function (response) {
            $scope.overview = response.data;
        })
        .catch(function (err) {
            console.error('Failed to load overview data', err);
        });
    }

    $scope.getAnalyticsData = function () {
        RGDCWebApplicationService.getAnalyticsData()
            .then(function (response) {
                var data = response.data;

                // Line chart — Patients over time
                new Chart(document.getElementById('patientsChart'), {
                    type: 'line',
                    data: {
                        labels: data.patientsPerMonth.map(function (x) { return x.label; }),
                        datasets: [{
                            label: 'Patients',
                            data: data.patientsPerMonth.map(function (x) { return x.count; }),
                            borderColor: '#795548',
                            backgroundColor: 'rgba(121,85,72,0.1)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: { responsive: true, plugins: { legend: { display: false } } }
                });

                // Bar chart — Procedures this week
                new Chart(document.getElementById('proceduresWeekChart'), {
                    type: 'bar',
                    data: {
                        labels: data.proceduresThisWeek.map(function (x) { return x.day; }),
                        datasets: [{
                            label: 'Procedures',
                            data: data.proceduresThisWeek.map(function (x) { return x.count; }),
                            backgroundColor: 'rgba(121,85,72,0.7)'
                        }]
                    },
                    options: { responsive: true, plugins: { legend: { display: false } } }
                });

                // Doughnut — Procedures by revenue
                new Chart(document.getElementById('proceduresRevenueChart'), {
                    type: 'doughnut',
                    data: {
                        labels: data.proceduresByRevenue.map(function (x) { return x.procedure; }),
                        datasets: [{
                            data: data.proceduresByRevenue.map(function (x) { return x.total; }),
                            backgroundColor: ['#795548', '#a1887f', '#d7ccc8', '#4e342e', '#bcaaa4']
                        }]
                    },
                    options: { responsive: true }
                });

                // Pie — Paid/Unpaid
                new Chart(document.getElementById('paidUnpaidChart'), {
                    type: 'pie',
                    data: {
                        labels: ['Paid', 'Unpaid'],
                        datasets: [{
                            data: [data.paid, data.unpaid],
                            backgroundColor: ['#795548', '#d7ccc8']
                        }]
                    },
                    options: { responsive: true }
                });
            })
            .catch(function (err) {
                console.error('Failed to load analytics data', err);
            });
    }

    var PHONE_PATTERN = /^09\d{9}$/;

    //for editing of patient profile email validation
    var _editPatientEmailTimer = null;
    $scope.editPatientEmailValid = false;
    $scope.editPatientEmailTaken = false;

    $scope.checkEditPatientEmail = function () {
        var email = $scope.selectedPatient && $scope.selectedPatient.email ? $scope.selectedPatient.email.trim() : '';
        var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        $scope.editPatientEmailValid = pattern.test(email);

        // reset duplicate flag if invalid or empty
        if (!email || !$scope.editPatientEmailValid) {
            $scope.editPatientEmailTaken = false;
            return;
        }

        // debounce backend check
        if (_editPatientEmailTimer) clearTimeout(_editPatientEmailTimer);
        _editPatientEmailTimer = setTimeout(function () {
            var excludeAccID = $scope.selectedPatient && $scope.selectedPatient.accID ? $scope.selectedPatient.accID : null;
            RGDCWebApplicationService.checkEmail(email, excludeAccID)
                .then(function (resp) {
                    $scope.editPatientEmailTaken = resp && resp.data && resp.data.exists === true;
                    if (!$scope.$$phase) $scope.$apply();
                })
                .catch(function (err) {
                    console.error('checkEditPatientEmail error', err);
                    // don't block save on transient error; treat as not taken
                    $scope.editPatientEmailTaken = false;
                    if (!$scope.$$phase) $scope.$apply();
                });
        }, 300);
    };


    function isValidEmailFormat(email) {
        if (!email) return false;
        var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email) && email.indexOf(' ') === -1;
    }

    var emailCheckTimeouts = {
        owner: null,
        dentist: null,
        staff: null
    };

    $scope.validateOwnerEmail = function () {
        $scope.ownerEmailFormatValid = isValidEmailFormat($scope.owner_email);
        // reset duplicate flag until server says otherwise
        $scope.ownerEmailTaken = false;

        if ($scope.ownerEmailFormatValid) {
            // debounce server calls
            if (emailCheckTimeouts.owner) clearTimeout(emailCheckTimeouts.owner);
            emailCheckTimeouts.owner = setTimeout(function () {
                RGDCWebApplicationService.checkEmail($scope.owner_email).then(function (res) {
                    $scope.$applyAsync(function () {
                        $scope.ownerEmailTaken = res.data.exists === true;
                    });
                });
            }, 400);
        }
    };

    $scope.validateDentistEmail = function () {
        $scope.dentistEmailFormatValid = isValidEmailFormat($scope.dentist_email);
        $scope.dentistEmailTaken = false;

        if ($scope.dentistEmailFormatValid) {
            if (emailCheckTimeouts.dentist) clearTimeout(emailCheckTimeouts.dentist);
            emailCheckTimeouts.dentist = setTimeout(function () {
                RGDCWebApplicationService.checkEmail($scope.dentist_email).then(function (res) {
                    $scope.$applyAsync(function () {
                        $scope.dentistEmailTaken = res.data.exists === true;
                    });
                });
            }, 400);
        }
    };

    $scope.validateStaffEmail = function () {
        $scope.staffEmailFormatValid = isValidEmailFormat($scope.staff_email);
        $scope.staffEmailTaken = false;

        if ($scope.staffEmailFormatValid) {
            if (emailCheckTimeouts.staff) clearTimeout(emailCheckTimeouts.staff);
            emailCheckTimeouts.staff = setTimeout(function () {
                RGDCWebApplicationService.checkEmail($scope.staff_email).then(function (res) {
                    $scope.$applyAsync(function () {
                        $scope.staffEmailTaken = res.data.exists === true;
                    });
                });
            }, 400);
        }
    };


    //owner photo uploading for diff user acc types
    $scope.pickPhoto = function (type) {
        var id = null;
        if (type === 'owner' || type === 'ownerAdd') id = 'ownerPhotoInput';
        else if (type === 'ownerEdit') id = 'ownerPhotoInputEdit';
        else if (type === 'dentist' || type === 'dentistAdd') id = 'dentistPhotoInput';
        else if (type === 'dentistEdit') id = 'dentistPhotoInputEdit';
        else if (type === 'staff' || type === 'staffAdd') id = 'staffPhotoInput';
        else if (type === 'staffEdit') id = 'staffPhotoInputEdit';
        if (id) {
            var el = document.getElementById(id);
            if (el) el.click();
        }
    };

    $scope.onPhotoSelected = function (files, role) {
        if (!files || !files.length) return;

        var file = files && files[0];
        if (!file) return;

        // basic checks (if not already present)
        if (!file.type || !file.type.startsWith('image/')) {
            Swal.fire({ icon: 'error', title: 'Invalid file', text: 'Please select an image file.' });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            Swal.fire({ icon: 'error', title: 'File too large', text: 'Max file size is 5 MB.' });
            return;
        }

        var reader = new FileReader();
        reader.onload = function (e) {
            $scope.$apply(function () {
                // Support both add and edit type names
                if (type === 'owner' || type === 'ownerAdd') {
                    $scope.ownerPhotoPreview = e.target.result;
                    $scope.ownerPhotoFile = file;
                } else if (type === 'ownerEdit') {
                    $scope.ownerPhotoPreviewEdit = e.target.result;
                    $scope.ownerPhotoFileEdit = file;
                } else if (type === 'dentist' || type === 'dentistAdd') {
                    $scope.dentistPhotoPreview = e.target.result;
                    $scope.dentistPhotoFile = file;
                } else if (type === 'dentistEdit') {
                    $scope.dentistPhotoPreviewEdit = e.target.result;
                    $scope.dentistPhotoFileEdit = file;
                } else if (type === 'staff' || type === 'staffAdd') {
                    $scope.staffPhotoPreview = e.target.result;
                    $scope.staffPhotoFile = file;
                } else if (type === 'staffEdit') {
                    $scope.staffPhotoPreviewEdit = e.target.result;
                    $scope.staffPhotoFileEdit = file;
                } else {
                    // fallback: keep existing behavior
                    $scope.genericPhotoPreview = e.target.result;
                    $scope.genericPhotoFile = file;
                }
            });
        };
        reader.readAsDataURL(file);

        // upload immediately
        var uploader = null;
        if (RGDCWebApplicationService && typeof RGDCWebApplicationService.uploadUserPhoto === 'function') {
            uploader = RGDCWebApplicationService.uploadUserPhoto;
        } else if (RGDCWebApplicationService && typeof RGDCWebApplicationService.uploadSignature === 'function') {
            uploader = RGDCWebApplicationService.uploadSignature;
        } else {
            Swal.fire({ icon: 'error', title: 'Upload Not Available', text: 'Upload service is not loaded.' });
            return;
        }

        Swal.fire({ title: 'Uploading photo...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        uploader(file)
            .then(function (resp) {
                Swal.close();
                var data = resp && resp.data ? resp.data : resp;
                if (data && data.success && data.filePath) {
                    $scope.$applyAsync(function () {
                        $scope[role + "UploadedPhotoPath"] = data.filePath;
                        Swal.fire({ icon: 'success', title: 'Uploaded', text: 'Photo uploaded successfully.' });
                    });
                } else {
                    var msg = (data && data.message) ? data.message : 'Unknown error uploading photo.';
                    Swal.fire({ icon: 'error', title: 'Upload failed', text: msg });
                }
            })
            .catch(function (err) {
                Swal.close();
                console.error('uploadUserPhoto error', err);
                Swal.fire({ icon: 'error', title: 'Upload Error', text: 'Failed to upload photo.' });
            });
    };

    //for patient adding and photo uploading in patient information adding
    var _addPatientEmailTimer = null;
    $scope.addPatientEmailTaken = false;
    $scope.addPatientEmailValid = false;
    $scope.addPatientPhotoFile = null;
    $scope.addPatientPhotoPreview = null;

    $scope.checkAddPatientEmail = function () {
        const email = $scope.addPatient_email ? $scope.addPatient_email.trim() : '';
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        $scope.addPatientEmailValid = emailPattern.test(email);

        // reset duplicate flag if format invalid or empty
        if (!email || !$scope.addPatientEmailValid) {
            $scope.addPatientEmailTaken = false;
            return;
        }

        // debounce server check
        if (_addPatientEmailTimer) clearTimeout(_addPatientEmailTimer);
        _addPatientEmailTimer = setTimeout(function () {
            RGDCWebApplicationService.checkEmail(email, null)
                .then(function (resp) {
                    var exists = resp && resp.data && resp.data.exists === true;
                    $scope.addPatientEmailTaken = exists;
                    // apply if needed
                    if (!$scope.$$phase) $scope.$apply();
                })
                .catch(function (err) {
                    console.error('Check email failed', err);
                    // conservative: treat failure as not taken to avoid blocking (adjust if you prefer)
                    $scope.addPatientEmailTaken = false;
                    if (!$scope.$$phase) $scope.$apply();
                });
        }, 300);
    };

    $scope.isAddPatientEmailValid = function () {
        return $scope.addPatientEmailValid && !$scope.addPatientEmailTaken;
    };

    // Trigger file chooser for patient photo (called by UPLOAD PHOTO button)
    $scope.triggerAddPatientPhotoInput = function () {
        var el = document.getElementById('addPatient_photo_input');
        if (el) el.click();
    };

    // file input onchange handler
    $scope.onAddPatientPhotoSelected = function (files) {
        if (!files || files.length === 0) {
            $scope.addPatientPhotoFile = null;
            $scope.addPatientPhotoPreview = null;
            if (!$scope.$$phase) $scope.$apply();
            return;
        }
        var file = files[0];

        if (!file.type || !file.type.startsWith('image/')) {
            Swal.fire({ icon: 'error', title: 'Invalid file', text: 'Please select an image file.' });
            return;
        }
        var maxBytes = 5 * 1024 * 1024;
        if (file.size > maxBytes) {
            Swal.fire({ icon: 'error', title: 'File too large', text: 'Max file size is 5 MB.' });
            return;
        }

        $scope.addPatientPhotoFile = file;

        var reader = new FileReader();
        reader.onload = function (e) {
            $scope.addPatientPhotoPreview = e.target.result;
            if (!$scope.$$phase) $scope.$apply();
        };
        reader.readAsDataURL(file);
    };


    //for patient profile picture
    $scope.triggerPatientPhotoInput = function () {
        var el = document.getElementById('patient_photo_input');
        if (el) el.click();
    };

    // Handler called from the hidden file input onchange
    $scope.onPatientPhotoSelected = function (files) {
        if (!files || files.length === 0) return;
        var file = files[0];

        if (!file.type || !file.type.startsWith('image/')) {
            Swal.fire({ icon: 'error', title: 'Invalid file', text: 'Please select an image.' });
            return;
        }
        var maxBytes = 5 * 1024 * 1024; // 5MB limit, match server
        if (file.size > maxBytes) {
            Swal.fire({ icon: 'error', title: 'File too large', text: 'Max file size is 5MB.' });
            return;
        }

        if (!$scope.selectedPatient || !$scope.selectedPatient.accID) {
            Swal.fire({ icon: 'error', title: 'No account selected', text: 'Select a patient first.' });
            return;
        }

        Swal.fire({
            title: 'Uploading...',
            text: 'Please wait while we upload the image.',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        RGDCWebApplicationService.uploadUserPhoto(file, $scope.selectedPatient.accID)
            .then(function (resp) {
                var data = resp && resp.data ? resp.data : {};
                if (data.success) {
                    // update client model so UI reflects new photo immediately
                    $scope.selectedPatient.photoLink = data.filePath;
                    // also refresh selected patient details to be safe
                    $scope.getSelectedPatientDetails();
                    Swal.fire({ icon: 'success', title: 'Uploaded', text: data.message || 'Photo uploaded.' });
                } else {
                    Swal.fire({ icon: 'error', title: 'Upload failed', text: data.message || 'Failed to upload photo.' });
                }
            })
            .catch(function (err) {
                console.error('uploadUserPhoto error', err);
                Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to upload photo.' });
            });
    };

    // Dentists
    var _dentistEmailTimer = null;
    $scope.dentistFirstNameValid = true;
    $scope.dentistLastNameValid = true;
    $scope.dentistAddressValid = true;
    $scope.dentistEmailFormatValid = false;
    $scope.dentistEmailTaken = false;

    $scope.validateDentistEditFields = function () {
        $scope.dentistFirstNameValid = $scope.isNonEmpty($scope.dentist && $scope.dentist.firstName);
        $scope.dentistLastNameValid = $scope.isNonEmpty($scope.dentist && $scope.dentist.lastName);
        $scope.dentistAddressValid = $scope.isNonEmpty($scope.dentist && $scope.dentist.address);
    };

    $scope.validateDentistEmailEdit = function () {
        var email = $scope.dentist && $scope.dentist.email ? $scope.dentist.email.trim() : '';
        var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        $scope.dentistEmailFormatValid = pattern.test(email);
        if (!email || !$scope.dentistEmailFormatValid) {
            $scope.dentistEmailTaken = false;
            return;
        }
        if (_dentistEmailTimer) clearTimeout(_dentistEmailTimer);
        _dentistEmailTimer = setTimeout(function () {
            var excludeAccID = $scope.dentist && $scope.dentist.accID ? $scope.dentist.accID : null;
            RGDCWebApplicationService.checkEmail(email, excludeAccID)
                .then(function (resp) {
                    $scope.dentistEmailTaken = resp && resp.data && resp.data.exists === true;
                    if (!$scope.$$phase) $scope.$apply();
                })
                .catch(function (err) {
                    console.error('checkDentistEmail error', err);
                    $scope.dentistEmailTaken = false;
                    if (!$scope.$$phase) $scope.$apply();
                });
        }, 350);
    };

    $scope.editDentist = function () {
        var accDet = {
            accID: $scope.dentist.accID,
            firstName: $scope.dentist.firstName,
            middleName: $scope.dentist.middleName,
            lastName: $scope.dentist.lastName,
            genderID: $scope.dentist.genderID,
            birthDate: $scope.dentist.birthDate,
            email: $scope.dentist.email,
            contactNumber: $scope.dentist.contactNumber,
            address: $scope.dentist.address,
            civilStatus: $scope.dentist.civilStatus
        };

        var dentistDet = {
            dentistID: $scope.dentist.dentistID,
            specialization: $scope.dentist.specialization,
            branchID: $scope.dentist.branchID
        };

        // validation guard
        $scope.validateDentistEditFields();
        $scope.validateDentistEmailEdit();
        if (!$scope.dentistFirstNameValid || !$scope.dentistLastNameValid || !$scope.dentistAddressValid) {
            Swal.fire({ icon: 'error', title: 'Missing required fields', text: 'Please fill in all required fields.' });
            return;
        }
        if (!$scope.dentistEmailFormatValid) {
            Swal.fire({ icon: 'error', title: 'Invalid Email', text: 'Please enter a valid email address.' });
            return;
        }
        if ($scope.dentistEmailTaken) {
            Swal.fire({ icon: 'error', title: 'Email Taken', text: 'This email is used by another account.' });
            return;
        }

        var photoFile = $scope.dentistPhotoFileEdit || null;
        var uploadPromise = _maybeUploadAccountPhoto(photoFile, $scope.dentist.accID)
            .catch(function (err) {
                console.warn('Dentist photo upload failed, proceeding with editAccount', err);
                return null;
            });

        uploadPromise.then(function (filePath) {
            if (filePath) accDet.photoLink = filePath;
            var editAccount = RGDCWebApplicationService.editAccount(accDet);
            editAccount.then(function (returnedData) {
                if (returnedData.data.success) {
                    var editDentist = RGDCWebApplicationService.editDentist(dentistDet);
                    editDentist.then(function (returnedData) {
                        if (returnedData.data.success) {
                            Swal.fire({ icon: 'success', title: 'Edit Dentist', text: 'Successfully edited Dentist Details.' }).then((result) => {
                                if (result.isConfirmed) {
                                    window.location.href = "/RGDC/adminClinicStaffTab";
                                    afterUpdate();
                                }
                            });
                        } else {
                            Swal.fire({ icon: 'error', title: 'Edit Dentist', text: 'Cannot edit dentist details.' });
                        }
                    });
                } else {
                    Swal.fire({ icon: 'error', title: 'Edit Account', text: 'Failed to update account.' });
                }
            }).catch(function (err) {
                console.error('editAccount error', err);
                Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to edit account.' });
            });
        });
    };

    // Staff
    var _staffEmailTimer = null;
    $scope.staffFirstNameValid = true;
    $scope.staffLastNameValid = true;
    $scope.staffAddressValid = true;
    $scope.staffEmailFormatValid = false;
    $scope.staffEmailTaken = false;

    $scope.validateStaffEditFields = function () {
        $scope.staffFirstNameValid = $scope.isNonEmpty($scope.staff && $scope.staff.firstName);
        $scope.staffLastNameValid = $scope.isNonEmpty($scope.staff && $scope.staff.lastName);
        $scope.staffAddressValid = $scope.isNonEmpty($scope.staff && $scope.staff.address);
    };

    $scope.validateStaffEmailEdit = function () {
        var email = $scope.staff && $scope.staff.email ? $scope.staff.email.trim() : '';
        var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        $scope.staffEmailFormatValid = pattern.test(email);
        if (!email || !$scope.staffEmailFormatValid) {
            $scope.staffEmailTaken = false;
            return;
        }
        if (_staffEmailTimer) clearTimeout(_staffEmailTimer);
        _staffEmailTimer = setTimeout(function () {
            var excludeAccID = $scope.staff && $scope.staff.accID ? $scope.staff.accID : null;
            RGDCWebApplicationService.checkEmail(email, excludeAccID)
                .then(function (resp) {
                    $scope.staffEmailTaken = resp && resp.data && resp.data.exists === true;
                    if (!$scope.$$phase) $scope.$apply();
                })
                .catch(function (err) {
                    console.error('checkStaffEmail error', err);
                    $scope.staffEmailTaken = false;
                    if (!$scope.$$phase) $scope.$apply();
                });
        }, 350);
    };

    $scope.editStaff = function () {
        var accDet = {
            accID: $scope.staff.accID,
            firstName: $scope.staff.firstName,
            middleName: $scope.staff.middleName,
            lastName: $scope.staff.lastName,
            genderID: $scope.staff.genderID,
            birthDate: $scope.staff.birthDate,
            email: $scope.staff.email,
            contactNumber: $scope.staff.contactNumber,
            address: $scope.staff.address,
            civilStatus: $scope.staff.civilStatus
        };

        var staffDet = {
            staffID: $scope.staff.staffID,
            staffRole: $scope.staff.staffRole,
            branchID: $scope.staff.branchID
        };

        // validation guard
        $scope.validateStaffEditFields();
        $scope.validateStaffEmailEdit();
        if (!$scope.staffFirstNameValid || !$scope.staffLastNameValid || !$scope.staffAddressValid) {
            Swal.fire({ icon: 'error', title: 'Missing required fields', text: 'Please fill in all required fields.' });
            return;
        }
        if (!$scope.staffEmailFormatValid) {
            Swal.fire({ icon: 'error', title: 'Invalid Email', text: 'Please enter a valid email address.' });
            return;
        }
        if ($scope.staffEmailTaken) {
            Swal.fire({ icon: 'error', title: 'Email Taken', text: 'This email is used by another account.' });
            return;
        }

        var photoFile = $scope.staffPhotoFileEdit || null;
        var uploadPromise = _maybeUploadAccountPhoto(photoFile, $scope.staff.accID)
            .catch(function (err) {
                console.warn('Staff photo upload failed, proceeding with editAccount', err);
                return null;
            });

        uploadPromise.then(function (filePath) {
            if (filePath) accDet.photoLink = filePath;
            var editAccount = RGDCWebApplicationService.editAccount(accDet);
            editAccount.then(function (returnedData) {
                if (returnedData.data.success) {
                    var editStaff = RGDCWebApplicationService.editStaff(staffDet);
                    editStaff.then(function (returnedData) {
                        if (returnedData.data.success) {
                            Swal.fire({ icon: 'success', title: 'Edit Staff', text: 'Successfully edited Staff Details.' }).then((result) => {
                                if (result.isConfirmed) {
                                    window.location.href = "/RGDC/adminClinicStaffTab";
                                    afterUpdate();
                                }
                            });
                        } else {
                            Swal.fire({ icon: 'error', title: 'Edit Staff', text: 'Cannot edit staff details.' });
                        }
                    });
                } else {
                    Swal.fire({ icon: 'error', title: 'Edit Account', text: 'Failed to update account.' });
                }
            }).catch(function (err) {
                console.error('editAccount error', err);
                Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to edit account.' });
            });
        });
    };

    //for edit modal email validation
    $scope.isNonEmpty = function (v) {
        return !!v && String(v).trim().length > 0;
    };

    // Owner edit validation & debounce email check
    $scope.ownerFirstNameValid = false;
    $scope.ownerLastNameValid = false;
    $scope.ownerAddressValid = false;
    $scope.ownerContactValid = false;
    $scope.ownerEmailFormatValid = false;
    $scope.ownerEmailTaken = false;
    $scope.ownerFirstNameTouched = false;
    $scope.ownerLastNameTouched = false;
    $scope.ownerAddressTouched = false;
    $scope.ownerContactTouched = false;
    $scope.ownerEmailTouched = false;
    var _ownerEditEmailTimer = null;
    var _ownerAddEmailTimer = null;

    $scope.validateOwnerEditFields = function () {
        $scope.ownerFirstNameValid = $scope.isNonEmpty($scope.owner && $scope.owner.firstName);
        $scope.ownerLastNameValid = $scope.isNonEmpty($scope.owner && $scope.owner.lastName);
        $scope.ownerAddressValid = $scope.isNonEmpty($scope.owner && $scope.owner.address);
        $scope.ownerContactValid = PHONE_PATTERN.test($scope.owner && $scope.owner.contactNumber || '');
    };

    $scope.validateOwnerEmailEdit = function () {
        var email = $scope.owner && $scope.owner.email ? ($scope.owner.email || '').trim() : '';
        $scope.ownerEmailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!email || !$scope.ownerEmailFormatValid) {
            $scope.ownerEmailTaken = false;
            return;
        }

        if (_ownerEditEmailTimer) clearTimeout(_ownerEditEmailTimer);
        _ownerEditEmailTimer = setTimeout(function () {
            var excludeAccID = $scope.owner && $scope.owner.accID ? $scope.owner.accID : null;
            RGDCWebApplicationService.checkEmail(email, excludeAccID)
                .then(function (resp) {
                    $scope.ownerEmailTaken = !!(resp && resp.data && resp.data.exists === true);
                    if (!$scope.$$phase) $scope.$apply();
                })
                .catch(function (err) {
                    console.error('checkOwnerEmail error', err);
                    $scope.ownerEmailTaken = false;
                    if (!$scope.$$phase) $scope.$apply();
                });
        }, 350);
    };

    $scope.checkAddOwnerEmail = function () {
        var email = ($scope.owner_email || '').trim();
        $scope.ownerEmailFormatValid = $scope.hasValidEmail(email);

        if (!email || !$scope.ownerEmailFormatValid) {
            $scope.ownerEmailTaken = false;
            return;
        }

        if (_ownerAddEmailTimer) clearTimeout(_ownerAddEmailTimer);
        _ownerAddEmailTimer = setTimeout(function () {
            RGDCWebApplicationService.checkEmail(email, null)
                .then(function (resp) {
                    $scope.ownerEmailTaken = !!(resp && resp.data && resp.data.exists === true);
                    if (!$scope.$$phase) $scope.$apply();
                })
                .catch(function (err) {
                    console.error('checkAddOwnerEmail error', err);
                    $scope.ownerEmailTaken = false;
                    if (!$scope.$$phase) $scope.$apply();
                });
        }, 350);
    };

    $scope.checkAddOwnerContact = function () {
        const pattern = /^09\d{9}$/;
        $scope.ownerContactValid = pattern.test($scope.owner_contactNumber || '');
    };

    $scope.checkAddOwnerAddress = function () {
        $scope.ownerAddressValid = !!$scope.owner_address && $scope.owner_address.trim().length >= 5;
    };

    $scope.isAddOwnerFormValid = function () {
        return $scope.owner_firstName && $scope.owner_lastName &&
            $scope.ownerEmailFormatValid && !$scope.ownerEmailTaken &&
            $scope.ownerContactValid && $scope.ownerAddressValid &&
            $scope.owner_genderID && $scope.owner_birthDate && $scope.owner_civilStatus;
    };

    // DENTIST add form validation
    $scope.dentistFirstNameValid = false;
    $scope.dentistLastNameValid = false;
    $scope.dentistAddressValid = false;
    $scope.dentistContactValid = false;
    $scope.dentistEmailFormatValid = false;
    $scope.dentistEmailTaken = false;
    $scope.dentistFirstNameTouched = false;
    $scope.dentistLastNameTouched = false;
    $scope.dentistAddressTouched = false;
    $scope.dentistContactTouched = false;
    $scope.dentistEmailTouched = false;
    var _dentistEditEmailTimer = null;
    var _dentistAddEmailTimer = null;

    $scope.validateDentistEditFields = function () {
        $scope.dentistFirstNameValid = $scope.isNonEmpty($scope.dentist && $scope.dentist.firstName);
        $scope.dentistLastNameValid = $scope.isNonEmpty($scope.dentist && $scope.dentist.lastName);
        $scope.dentistAddressValid = $scope.isNonEmpty($scope.dentist && $scope.dentist.address);
        $scope.dentistContactValid = PHONE_PATTERN.test($scope.dentist && $scope.dentist.contactNumber || '');
    };

    $scope.validateDentistEmailEdit = function () {
        var email = $scope.dentist && $scope.dentist.email ? ($scope.dentist.email || '').trim() : '';
        $scope.dentistEmailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!email || !$scope.dentistEmailFormatValid) {
            $scope.dentistEmailTaken = false;
            return;
        }

        if (_dentistEditEmailTimer) clearTimeout(_dentistEditEmailTimer);
        _dentistEditEmailTimer = setTimeout(function () {
            var excludeAccID = $scope.dentist && $scope.dentist.accID ? $scope.dentist.accID : null;
            RGDCWebApplicationService.checkEmail(email, excludeAccID)
                .then(function (resp) {
                    $scope.dentistEmailTaken = !!(resp && resp.data && resp.data.exists === true);
                    if (!$scope.$$phase) $scope.$apply();
                })
                .catch(function (err) {
                    console.error('checkDentistEmail error', err);
                    $scope.dentistEmailTaken = false;
                    if (!$scope.$$phase) $scope.$apply();
                });
        }, 350);
    };

    $scope.checkAddDentistEmail = function () {
        var email = ($scope.dentist_email || '').trim();
        $scope.dentistEmailFormatValid = $scope.hasValidEmail(email);

        if (!email || !$scope.dentistEmailFormatValid) {
            $scope.dentistEmailTaken = false;
            return;
        }

        if (_dentistAddEmailTimer) clearTimeout(_dentistAddEmailTimer);
        _dentistAddEmailTimer = setTimeout(function () {
            RGDCWebApplicationService.checkEmail(email, null)
                .then(function (resp) {
                    $scope.dentistEmailTaken = !!(resp && resp.data && resp.data.exists === true);
                    if (!$scope.$$phase) $scope.$apply();
                })
                .catch(function (err) {
                    console.error('checkAddDentistEmail error', err);
                    $scope.dentistEmailTaken = false;
                    if (!$scope.$$phase) $scope.$apply();
                });
        }, 350);
    };

    $scope.checkAddDentistContact = function () {
        const pattern = /^09\d{9}$/;
        $scope.dentistContactValid = pattern.test($scope.dentist_contactNumber || '');
    };

    $scope.checkAddDentistAddress = function () {
        $scope.dentistAddressValid = !!$scope.dentist_address && $scope.dentist_address.trim().length >= 5;
    };

    $scope.isAddDentistFormValid = function () {
        return $scope.dentist_firstName && $scope.dentist_lastName &&
            $scope.dentistEmailFormatValid && !$scope.dentistEmailTaken &&
            $scope.dentistContactValid && $scope.dentistAddressValid &&
            $scope.dentist_genderID && $scope.dentist_birthDate && $scope.dentist_civilStatus;
    };

    // STAFF add form validation
    $scope.staffFirstNameValid = false;
    $scope.staffLastNameValid = false;
    $scope.staffAddressValid = false;
    $scope.staffContactValid = false;
    $scope.staffEmailFormatValid = false;
    $scope.staffEmailTaken = false;
    $scope.staffFirstNameTouched = false;
    $scope.staffLastNameTouched = false;
    $scope.staffAddressTouched = false;
    $scope.staffContactTouched = false;
    $scope.staffEmailTouched = false;
    var _staffEditEmailTimer = null;
    var _staffAddEmailTimer = null;

    $scope.validateStaffEditFields = function () {
        $scope.staffFirstNameValid = $scope.isNonEmpty($scope.staff && $scope.staff.firstName);
        $scope.staffLastNameValid = $scope.isNonEmpty($scope.staff && $scope.staff.lastName);
        $scope.staffAddressValid = $scope.isNonEmpty($scope.staff && $scope.staff.address);
        $scope.staffContactValid = PHONE_PATTERN.test($scope.staff && $scope.staff.contactNumber || '');
    };

    $scope.validateStaffEmailEdit = function () {
        var email = $scope.staff && $scope.staff.email ? ($scope.staff.email || '').trim() : '';
        $scope.staffEmailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!email || !$scope.staffEmailFormatValid) {
            $scope.staffEmailTaken = false;
            return;
        }

        if (_staffEditEmailTimer) clearTimeout(_staffEditEmailTimer);
        _staffEditEmailTimer = setTimeout(function () {
            var excludeAccID = $scope.staff && $scope.staff.accID ? $scope.staff.accID : null;
            RGDCWebApplicationService.checkEmail(email, excludeAccID)
                .then(function (resp) {
                    $scope.staffEmailTaken = !!(resp && resp.data && resp.data.exists === true);
                    if (!$scope.$$phase) $scope.$apply();
                })
                .catch(function (err) {
                    console.error('checkStaffEmail error', err);
                    $scope.staffEmailTaken = false;
                    if (!$scope.$$phase) $scope.$apply();
                });
        }, 350);
    };

    $scope.checkAddStaffEmail = function () {
        var email = ($scope.staff_email || '').trim();
        $scope.staffEmailFormatValid = $scope.hasValidEmail(email);

        if (!email || !$scope.staffEmailFormatValid) {
            $scope.staffEmailTaken = false;
            return;
        }

        if (_staffAddEmailTimer) clearTimeout(_staffAddEmailTimer);
        _staffAddEmailTimer = setTimeout(function () {
            RGDCWebApplicationService.checkEmail(email, null)
                .then(function (resp) {
                    $scope.staffEmailTaken = !!(resp && resp.data && resp.data.exists === true);
                    if (!$scope.$$phase) $scope.$apply();
                })
                .catch(function (err) {
                    console.error('checkAddStaffEmail error', err);
                    $scope.staffEmailTaken = false;
                    if (!$scope.$$phase) $scope.$apply();
                });
        }, 350);
    };

    $scope.checkAddStaffContact = function () {
        const pattern = /^09\d{9}$/;
        $scope.staffContactValid = pattern.test($scope.staff_contactNumber || '');
    };

    $scope.checkAddStaffAddress = function () {
        $scope.staffAddressValid = !!$scope.staff_address && $scope.staff_address.trim().length >= 5;
    };

    $scope.isAddStaffFormValid = function () {
        return $scope.staff_firstName && $scope.staff_lastName &&
            $scope.staffEmailFormatValid && !$scope.staffEmailTaken &&
            $scope.staffContactValid && $scope.staffAddressValid &&
            $scope.staff_genderID && $scope.staff_birthDate && $scope.staff_civilStatus;
    };

    function _maybeUploadAccountPhoto(file, accID) {
        if (!file) return Promise.resolve(null);
        return RGDCWebApplicationService.uploadUserPhoto(file, accID)
            .then(function (resp) {
                var d = resp && resp.data ? resp.data : resp;
                if (d && d.success && d.filePath) return d.filePath;
                throw new Error(d && d.message ? d.message : 'Upload failed');
            });
    }
});
