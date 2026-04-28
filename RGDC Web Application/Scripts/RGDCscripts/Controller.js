app.controller("RGDCWebApplicationController", function ($scope, $timeout, RGDCWebApplicationService, $http, $rootScope, $sce) {
    //DON'T MERGE ANYTHING MUNA NASISIRA CODE
    $scope.signaturePreview = null;
    $scope._uploadedSignaturePath = null;
    // retry counters for transient network/abort errors (-1)
    var _adminLoadRetries = 0;
    var _reqLoadRetries = 0;

    $scope.currentUserName = "";
    $scope.currentUserID = "";
    $scope.currentUserPhoto = "";
    $scope.currentUserSignature = "";
    const STRENGTH = {
        WEAK: 'Invalid',
        FAIR: 'Invalid',
        GOOD: 'Invalid',
        STRONG: 'Good'
    };
    $scope.staff;
    $scope.showPatientForm = false;
    $scope.isUserOwner = false;
    $scope.isUserAdmin = false;
    $scope.isUserStaff = false;
    $scope.isUserPatient = false;
    $scope.signUpDentist = false;
    $scope.signUpOwner = false;
    $scope.signUpStaff = false;
    $scope.medical = {
        history: {
            women: {},
            other: {}
        },
        conditions: {}
    };
    $scope.currentUserAuthorization;
    $scope.paymentsArray = [];
    $scope.allPayments = [];
    $scope.paymentID;
    $scope.showFinanceArchived = false;

    $scope.modalScheduleDays = [
        { dayOfWeek: 0, dayName: 'Sunday', enabled: false, startTime: '08:00', endTime: '12:00', slotMinutes: 30 },
        { dayOfWeek: 1, dayName: 'Monday', enabled: false, startTime: '08:00', endTime: '12:00', slotMinutes: 30 },
        { dayOfWeek: 2, dayName: 'Tuesday', enabled: false, startTime: '08:00', endTime: '12:00', slotMinutes: 30 },
        { dayOfWeek: 3, dayName: 'Wednesday', enabled: false, startTime: '08:00', endTime: '12:00', slotMinutes: 30 },
        { dayOfWeek: 4, dayName: 'Thursday', enabled: false, startTime: '08:00', endTime: '12:00', slotMinutes: 30 },
        { dayOfWeek: 5, dayName: 'Friday', enabled: false, startTime: '08:00', endTime: '12:00', slotMinutes: 30 },
        { dayOfWeek: 6, dayName: 'Saturday', enabled: false, startTime: '08:00', endTime: '12:00', slotMinutes: 30 }
    ];

    // Same shape as signup schedule, but Date objects for <input type="time"> in profile modal.
    // Must exist on load: ng-repeat in #modalDentistSchedule runs before openDentistScheduleModal().
    (function initDentistScheduleDaysEarly() {
        function dsT(h, m) { return new Date(1970, 0, 1, h, m, 0, 0); }
        $scope.dentistScheduleDays = [
            { dayOfWeek: 0, dayName: 'Sunday', enabled: false, startTime: dsT(8, 0), endTime: dsT(12, 0), slotMinutes: 30 },
            { dayOfWeek: 1, dayName: 'Monday', enabled: false, startTime: dsT(8, 0), endTime: dsT(12, 0), slotMinutes: 30 },
            { dayOfWeek: 2, dayName: 'Tuesday', enabled: false, startTime: dsT(8, 0), endTime: dsT(12, 0), slotMinutes: 30 },
            { dayOfWeek: 3, dayName: 'Wednesday', enabled: false, startTime: dsT(8, 0), endTime: dsT(12, 0), slotMinutes: 30 },
            { dayOfWeek: 4, dayName: 'Thursday', enabled: false, startTime: dsT(8, 0), endTime: dsT(12, 0), slotMinutes: 30 },
            { dayOfWeek: 5, dayName: 'Friday', enabled: false, startTime: dsT(8, 0), endTime: dsT(12, 0), slotMinutes: 30 },
            { dayOfWeek: 6, dayName: 'Saturday', enabled: false, startTime: dsT(8, 0), endTime: dsT(12, 0), slotMinutes: 30 }
        ];
    })();

    $scope.nationalities = [
        "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan",
        "Antiguan", "Argentine", "Armenian", "Australian", "Austrian",
        "Azerbaijani", "Bahamian", "Bahraini", "Bangladeshi", "Barbadian",
        "Belarusian", "Belgian", "Belizean", "Beninese", "Bhutanese",
        "Bolivian", "Bosnian", "Botswanan", "Brazilian", "British",
        "Bruneian", "Bulgarian", "Burkinabe", "Burmese", "Burundian",
        "Cambodian", "Cameroonian", "Canadian", "Cape Verdean",
        "Central African", "Chadian", "Chilean", "Chinese", "Colombian",
        "Comorian", "Congolese", "Costa Rican", "Croatian", "Cuban",
        "Cypriot", "Czech", "Danish", "Djiboutian", "Dominican",
        "Dutch", "East Timorese", "Ecuadorean", "Egyptian",
        "Emirati", "Equatorial Guinean", "Eritrean", "Estonian",
        "Ethiopian", "Fijian", "Finnish", "French", "Gabonese",
        "Gambian", "Georgian", "German", "Ghanaian", "Greek",
        "Grenadian", "Guatemalan", "Guinean", "Guyanese",
        "Haitian", "Honduran", "Hungarian", "Icelandic", "Indian",
        "Indonesian", "Iranian", "Iraqi", "Irish", "Israeli",
        "Italian", "Ivorian", "Jamaican", "Japanese", "Jordanian",
        "Kazakh", "Kenyan", "Kuwaiti", "Kyrgyz", "Laotian",
        "Latvian", "Lebanese", "Liberian", "Libyan", "Liechtensteiner",
        "Lithuanian", "Luxembourger", "Malagasy", "Malawian",
        "Malaysian", "Maldivian", "Malian", "Maltese", "Marshallese",
        "Mauritanian", "Mauritian", "Mexican", "Micronesian",
        "Moldovan", "Monacan", "Mongolian", "Montenegrin",
        "Moroccan", "Mozambican", "Namibian", "Nauruan",
        "Nepalese", "New Zealander", "Nicaraguan", "Nigerien",
        "Nigerian", "North Korean", "North Macedonian", "Norwegian",
        "Omani", "Pakistani", "Palauan", "Panamanian",
        "Papua New Guinean", "Paraguayan", "Peruvian",
        "Filipino", "Polish", "Portuguese", "Qatari",
        "Romanian", "Russian", "Rwandan", "Saint Lucian",
        "Salvadoran", "Samoan", "San Marinese", "Saudi",
        "Senegalese", "Serbian", "Seychellois", "Sierra Leonean",
        "Singaporean", "Slovak", "Slovenian", "Solomon Islander",
        "Somali", "South African", "South Korean", "Spanish",
        "Sri Lankan", "Sudanese", "Surinamese", "Swazi",
        "Swedish", "Swiss", "Syrian", "Taiwanese", "Tajik",
        "Tanzanian", "Thai", "Togolese", "Tongan",
        "Trinidadian", "Tunisian", "Turkish", "Turkmen",
        "Tuvaluan", "Ugandan", "Ukrainian", "Uruguayan",
        "Uzbek", "Vanuatuan", "Venezuelan", "Vietnamese",
        "Yemeni", "Zambian", "Zimbabwean"
    ];

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

    $scope.hasSpecialChar = function (pwd) {
        if (!pwd) return false;
        return /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(pwd);
    };

    $scope.isAddPatientFormValid = function () {
        return $scope.addPatient_firstName &&
            $scope.addPatient_lastName &&
            $scope.isAddPatientEmailValid() &&
            $scope.isAddPatientContactValid() &&
            $scope.addPatient_genderID &&
            $scope.addPatient_birthDate &&
            $scope.addPatient_civilStatus;
    };

    $scope.passwordStrength = '';
    $scope.strengthColor = '';
    $scope.passwordsMatch = true;
    $scope._emailLocked = false;

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

        if (!$scope.emailValid) {
            $scope.emailTaken = false;
            if (_emailCheckTimeout) {
                $timeout.cancel(_emailCheckTimeout);
                _emailCheckTimeout = null;
            }
            return;
        }

        if (_emailCheckTimeout) $timeout.cancel(_emailCheckTimeout);
        _emailCheckTimeout = $timeout(function () {
            RGDCWebApplicationService.checkEmail(email)
                .then(function (resp) {
                    try {
                        $scope.emailTaken = !!(resp && resp.data && resp.data.exists);
                    } catch (e) {
                        $scope.emailTaken = false;
                    }
                })
                .catch(function (err) {
                    console.error('Email existence check failed', err);
                    $scope.emailTaken = false;
                })
                .finally(function () {
                    _emailCheckTimeout = null;
                });
        }, 400);
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


    $scope.isCurrentPhysicianValid = function () {
        // optional field: valid if empty or has characters
        return !!$scope.signUp_currentPhysician && $scope.signUp_currentPhysician.trim().length > 0;
    };

    $scope.isLastVisitFieldValid = function () {
        return !!$scope.signUp_lastVisit;
    };


    $scope.signUpInitial = function () {
        if (!$scope.signUp_email || !$scope.hasValidEmail($scope.signUp_email)) {
            Swal.fire({ icon: "error", title: "Invalid Email", text: "Enter a valid email address" });
            return;
        }

        if (!$scope.isFormValid()) {
            Swal.fire({ icon: "error", title: "Password isn't valid", text: "Check if password is valid and please try again..." });
            console.log("invalid")
            return;
        }

        RGDCWebApplicationService.checkEmail($scope.signUp_email)
            .then(function (returnedData) {
                if (!returnedData || !returnedData.data) {
                    Swal.fire({ icon: "error", title: "Error", text: "Unable to verify email." });
                    return;
                }

                if (!returnedData.data.exists) {
                    var elem = document.getElementById("modalPatientInformationForm");
                    if (!elem) {
                        elem = document.getElementById("patientInformationForm");
                    }
                    if (elem) {
                        try {
                            if (typeof M !== 'undefined' && M && M.Modal) {
                                var instance = M.Modal.getInstance(elem);
                                if (!instance) instance = M.Modal.init(elem, {});
                                instance.open();
                            } else {
                                elem.style.display = "block";
                            }
                        } catch (e) {
                            elem.style.display = "block";
                        }
                    } else {
                        var trigger = document.querySelector('[data-target="modalPatientInformationForm"]');
                        if (trigger) trigger.click();
                    }
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Email is already in use",
                        text: "Enter another email address",
                    });
                }
            })
            .catch(function (err) {
                console.error('Email check failed', err);
                Swal.fire({ icon: "error", title: "Error", text: "Failed to verify email." });
            });
    };

    $scope.signUpStaffInitial = function () {
        if (!$scope.signUp_email || !$scope.hasValidEmail($scope.signUp_email)) {
            Swal.fire({ icon: "error", title: "Invalid Email", text: "Enter a valid email address" });
            return;
        }

        if (!$scope.isFormValid()) {
            Swal.fire({ icon: "error", title: "Password isn't valid", text: "Check if password is valid and please try again..." });
            console.log("invalid")
            return;
        }

        if ($scope.signUp_code == null) {
            Swal.fire({ icon: "error", title: "Please input code", text: "Input code that is sent to your email..." });
            console.log("invalid")
            return;
        }
        RGDCWebApplicationService.checkEmail($scope.signUp_email)
            .then(function (returnedData) {
                if (!returnedData || !returnedData.data) {
                    Swal.fire({ icon: "error", title: "Error", text: "Unable to verify email." });
                    return;
                }

                if (!returnedData.data.exists) {
                    var signUpStaffData = {
                        email: $scope.signUp_email,
                        code: $scope.signUp_code
                    }
                    RGDCWebApplicationService.checkAddQueue(signUpStaffData).then(function (returnedData) {
                        var data = returnedData.data || {};
                        console.log(data)
                        if (data.exists && data.codeValid) {
                            Swal.fire({ icon: 'success', title: 'Email and Code matches!', text: 'Please proceed with the signup.' }).then((result) => {
                                if (result.isConfirmed) {
                                    console.log(data.permission)
                                    var elem = document.getElementById("modalInfoForm");
                                    if (data.permission == 0) {
                                        $scope.signUpOwner = true;
                                        $scope.signUp_role = 1;
                                        $scope.whatStaffForm = "Owner"
                                    } else if (data.permission == 1) {
                                        $scope.signUpDentist = true;
                                        $scope.signUp_role = 2;
                                        $scope.whatStaffForm = "Dentist"
                                    } else if (data.permission == 2) {
                                        $scope.signUpStaff = true;
                                        $scope.whatStaffForm = "Staff"
                                        $scope.signUp_role = 2;
                                    }
                                    $scope.signUp_permission = data.permission;
                                    console.log($scope.signUpStaff)
                                    console.log($scope.signUpOwner)
                                    console.log($scope.signUpDentist)
                                    if (elem) {
                                        try {
                                            if (typeof M !== 'undefined' && M && M.Modal) {
                                                var instance = M.Modal.getInstance(elem);
                                                if (!instance) instance = M.Modal.init(elem, {});
                                                instance.open();
                                            } else {
                                                elem.style.display = "block";
                                            }
                                        } catch (e) {
                                            elem.style.display = "block";
                                        }
                                    }
                                }
                            });
                        } else {
                            Swal.fire({
                                icon: "error",
                                title: "Check email and code.",
                                text: data.message,
                            });
                        }
                    });
                    //var elem = document.getElementById("modalPatientInformationForm");
                    //if (!elem) {
                    //    elem = document.getElementById("patientInformationForm");
                    //}

                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Email is already in use",
                        text: "Enter another email address",
                    });
                }
            })
            .catch(function (err) {
                console.error('Email check failed', err);
                Swal.fire({ icon: "error", title: "Error", text: "Failed to verify email." });
            });
    };


    $scope.loadPastAppointments = function () {
        RGDCWebApplicationService.getPastAppointments()
            .then(function (resp) {
                var data = resp.data || [];
                if (!Array.isArray(data)) {
                    $scope.pastAppointments = [];
                    // initialize empty table safely
                    $timeout(function () { initDataTableSafe('#adminPastAppointment', '_adminPastDataTableInstance'); }, 0);
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
                        remarks: a.remarks || "",
                        dentistName: a.dentistName || "",
                        patientName: a.patientName || "",
                        status: a.status || "",
                        displayStatus: a.displayStatus || a.status || "",
                        createdBy: a.createdBy || null
                    };
                });

                // Filter past appointments for users who are not clinic-wide viewers
                var filtered = mapped;
                try {
                    var auth = String($scope.currentUserAuthorization || "");
                    var perm = String($scope.currentUserPermission || "");
                    var userFull = ($scope.currentUserFullName || "").trim();
                    var userId = String($scope.currentUserID || "");
                    var seeAllPast = auth === "0" || auth === "1" || (auth === "2" && perm === "2");
                    if (!seeAllPast) {
                        filtered = mapped.filter(function (m) {
                            var dn = (m.dentistName || "").trim();
                            var pn = (m.patientName || "").trim();
                            var created = m.createdBy ? String(m.createdBy) : "";
                            if (userFull && (dn === userFull || pn === userFull)) return true;
                            if (userId && created === userId) return true;
                            return false;
                        });
                    }
                } catch (e) {
                    console.warn('past appointments filtering failed', e);
                }

                $timeout(function () {
                    $scope.pastAppointments = filtered;
                    try {
                        initDataTableSafe('#adminPastAppointment', '_adminPastDataTableInstance');
                    } catch (e) {
                        console.error('Failed to init admin past DataTable:', e);
                    }
                }, 0);
            })
            .catch(function (err) {
                console.error('Failed to load past appointments', err);
                $scope.pastAppointments = [];
                $timeout(function () { initDataTableSafe('#adminPastAppointment', '_adminPastDataTableInstance'); }, 0);
            });
    };

    // Cancel appointment (patient action)
    $scope.cancelAppointment = function (appt) {
        if (!appt || !appt.apptID) return Swal.fire({ icon: 'error', title: 'Error', text: 'No appointment selected.' });

        var apptDate = parseDateFromDisplay(appt.date, appt.time);
        if (!apptDate) return Swal.fire({ icon: 'error', title: 'Error', text: 'Unable to determine appointment datetime.' });

        var today = new Date();
        var cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        cutoff.setDate(cutoff.getDate() + 2);
        if (apptDate <= cutoff) {
            return Swal.fire({ icon: 'error', title: 'Too Late', text: 'Appointments cannot be cancelled within 2 days of scheduled date.' });
        }

        Swal.fire({
            title: 'Cancel Appointment',
            input: 'textarea',
            inputLabel: 'Reason for cancellation',
            inputPlaceholder: 'Please provide a reason (this will be shown in Past Appointments)',
            showCancelButton: true,
            confirmButtonText: 'Confirm Cancel',
            preConfirm: (value) => {
                if (!value || value.trim().length === 0) {
                    Swal.showValidationMessage('A reason is required.');
                    return false;
                }
                return value;
            }
        }).then(function (result) {
            if (!result.isConfirmed) return;
            var reason = (result.value || '').trim();

            RGDCWebApplicationService.cancelAppointment({ apptID: appt.apptID, reason: reason })
                .then(function (resp) {
                    if (resp && resp.data && resp.data.success) {
                        Swal.fire({ icon: 'success', title: 'Cancelled', text: resp.data.message }).then(function () {
                            $scope.loadAdminScheduledAppointments();
                            $scope.loadRequestedAppointments();
                            $scope.loadPastAppointments();
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

        $scope.editSubmitted = true;


        var getPaymentInfo = RGDCWebApplicationService.getPaymentInfo(paymentData);
        getPaymentInfo.then(function (payment) {
            $scope.paymentInfo = payment.data;
            if ($scope.paymentInfo.paymentDate) {
                $scope.paymentInfo.paymentDate = formatDateToMDY($scope.paymentInfo.paymentDate)
            }
        });
    }

    $scope.toggleFinanceArchive = function () {
        $scope.showFinanceArchived = true;
    };

    $scope.toggleFinanceArchiveF = function () {
        $scope.showFinanceArchived = false;
    };

    $scope.deletePayRec = function (paymentID) {
        $scope.deletePayment = paymentID
    }
    $scope.undeletePayRec = function (paymentID) {
        $scope.undeletePayment = paymentID
    }
    
    $scope.deletePaymentThis = function () {
        var paymentData = {
            paymentID: $scope.deletePayment
        }
        RGDCWebApplicationService.deletePayment(paymentData)
            .then(function (response) {
                Swal.fire({ icon: 'success', title: 'Archived', text: 'Successfully archived payment record.' }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = "/RGDC/adminFinance";
                        afterUpdate();
                    }
                });
            });
    }
    $scope.undeletePaymentThis = function () {
        var paymentData = {
            paymentID: $scope.undeletePayment
        }
        RGDCWebApplicationService.undeletePayment(paymentData)
            .then(function (response) {
                Swal.fire({ icon: 'success', title: 'Unrchived', text: 'Successfully unarchived payment record.' }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = "/RGDC/adminFinance";
                        afterUpdate();
                    }
                });
            });
    }

    $scope.deletePatientThis = function () {
        var patAcc = {
            patientID: $scope.selectedPatient.patientID,
            accID: $scope.selectedPatient.accID
        }
        var deletePatient = RGDCWebApplicationService.deletePatient(patAcc);
        deletePatient.then(function (returnedData) {
            if (returnedData.data.success) {
                Swal.fire({ icon: 'success', title: 'Delete Patient', text: 'Successfully deleted patient account.' }).then((result) => {
                    if (result.isConfirmed) {

                        window.location.href = "/RGDC/adminPatientsTab";
                        afterUpdate();
                    }

                });
            }
        });

    }

    $scope.signUpRemove = function () {
        var elem = document.getElementById("modalPatientInformationForm") || document.getElementById("patientInformationForm");
        if (!elem) return;
        try {
            if (typeof M !== 'undefined' && M && M.Modal) {
                var instance = M.Modal.getInstance(elem);
                if (!instance) instance = M.Modal.init(elem, {});
                instance.close();
            } else {
                elem.style.display = "none";
            }
        } catch (e) {
            elem.style.display = "none";
        }
    };

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

    $scope.loadAdminScheduledAppointments = function () {
        RGDCWebApplicationService.getAdminScheduledAppointments()
            .then(function (response) {
                var data = response.data || [];
                var mapped = (Array.isArray(data) ? data : []).map(function (a) {
                    var jsDate = parseJsonDateToJsDate(a.dateTime);
                    if ((!jsDate || isNaN(jsDate.getTime())) && a.dateTimeObj && Object.prototype.toString.call(a.dateTimeObj) === '[object Date]') {
                        jsDate = a.dateTimeObj;
                    }

                    var dateStr = jsDate ? jsDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";
                    var timeStr = jsDate ? jsDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : "";

                    if ((!dateStr || !timeStr) && a.date && typeof a.date === 'string' && !/\/Date\(/.test(a.date)) {
                        dateStr = dateStr || a.date;
                    }
                    if ((!timeStr || !dateStr) && a.time && typeof a.time === 'string' && !/\/Date\(/.test(a.time)) {
                        timeStr = timeStr || a.time;
                    }

                    return {
                        apptID: a.apptID,
                        dateTimeObj: jsDate,
                        date: dateStr,
                        time: timeStr,
                        dentistID: (typeof a.dentistID !== 'undefined' && a.dentistID !== null) ? parseInt(a.dentistID, 10) : null,
                        patientID: (typeof a.patientID !== 'undefined' && a.patientID !== null) ? parseInt(a.patientID, 10) : null,
                        purpose: a.purpose || a.reason || "",
                        dentistName: a.dentistName || "",
                        patientName: a.patientName || "",
                        status: a.status || "",
                        displayStatus: a.displayStatus || a.status || "",
                        remarks: a.remarks || null,
                        procedureID: (a.procedureID !== undefined) ? a.procedureID : null,
                        createdBy: a.createdBy || null
                    };
                });

                // Helper to finalize assignment and UI work
                function finalize(filtered) {
                    $scope.adminAppointments = Array.isArray(filtered) ? filtered : [];
                    try { if ($rootScope) $rootScope.adminAppointments = $scope.adminAppointments; } catch (e) { }
                    try { updateDashboardLists(); } catch (e) { console.warn('updateDashboardLists failed', e); }

                    // recompute time options
                    try {
                        $timeout(function () { try { $scope.updateTimeOptions(); } catch (e) { } }, 30);
                    } catch (e) { /* ignore */ }

                    // Initialize DataTable after rows render
                    $timeout(function () {
                        try {
                            // Use the safe initializer that handles destroying/creating and attaches delegated handlers
                            initDataTableSafe('#adminScheduledAppointment', '_adminScheduledDataTableInstance');
                        } catch (e) {
                            console.error('Failed to init admin scheduled DataTable via initDataTableSafe:', e);
                        }
                    }, 60);
                }

                // Role-aware filtering
                try {
                    finalize(mapped);
                } catch (e) {
                    console.error('role-based filtering failed (fallback to server data)', e);
                    finalize(mapped);
                }
            })
            .catch(function (err) {
                if (err && err.status === -1 && _adminLoadRetries < 2) {
                    _adminLoadRetries++;
                    $timeout($scope.loadAdminScheduledAppointments, 500);
                    return;
                }
                console.error("Failed to load admin scheduled appointments", err);
                $scope.adminAppointments = [];
                try { if ($rootScope) $rootScope.adminAppointments = []; } catch (e) { }
            });
    };


    $scope.signUp = function () {

        try {
            var birthDate = new Date($scope.signUp_birthDate);
            birthDate.setHours(0, 0, 0, 0); // 00:00:00

            if ($scope.signUp_firstName && $scope.signUp_lastName && $scope.signUp_genderID && $scope.signUp_birthDate && $scope.signUp_email && $scope.signUp_contactNumber && $scope.signUp_civilStatus && $scope.signUp_password && $scope.signUp_line1 && $scope.signUp_line2 && $scope.signUp_state && $scope.signUp_postal && $scope.signUp_country && $scope.signUp_city && $scope.signUp_occupation && $scope.signUp_religion && $scope.signUp_nationality && $scope.signUp_currentPhysician) {
                Swal.fire({
                    icon: 'question',
                    title: 'Confirm Sign Up',

                    showCancelButton: true,
                    confirmButtonText: 'Confirm & Sign Up',
                    cancelButtonText: 'Edit'
                }).then((result) => {
                    if (result.isConfirmed) {
                        var accountData = {
                            firstName: $scope.signUp_firstName,
                            middleName: $scope.signUp_middleName,
                            lastName: $scope.signUp_lastName,
                            genderID: $scope.signUp_genderID,
                            birthDate: birthDate,
                            email: $scope.signUp_email,
                            contactNumber: $scope.signUp_contactNumber,
                            role: 2,
                            permission: 3,
                            nationality: $scope.signUp_nationality,
                            religion: $scope.signUp_religion,
                            line1: $scope.signUp_line1,
                            line2: $scope.signUp_line2,
                            state: $scope.signUp_state,
                            country: $scope.signUp_country,
                            city: $scope.signUp_city,
                            postal: $scope.signUp_postal,
                            civilStatus: $scope.signUp_civilStatus,
                            password: $scope.signUp_password,
                            lastLogin: new Date(),
                            accCreatedAt: new Date(),
                            accUpdatedAt: new Date(),
                        };

                        accountData.photoLink = $scope._uploadedSignUpPhotoPath || "";

                        if ($scope.signUp_agreement == true) {
                            // show progress modal
                            Swal.fire({
                                title: 'Creating account...',
                                allowOutsideClick: false,
                                didOpen: function () {
                                    Swal.showLoading();
                                }
                            });

                            var signUp = RGDCWebApplicationService.signUp(accountData);
                            signUp.then(function (signUpID) {
                                var accID = signUpID && signUpID.data && signUpID.data.accID;
                                if (!accID) {
                                    Swal.close();
                                    Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to create account. Please try again.' });
                                    return;
                                }

                                var patientData = {
                                    currentPhysician: $scope.signUp_currentPhysician,
                                    referral: $scope.signUp_referral,
                                    lastVisit: $scope.signUp_lastVisit,
                                    medicalHistory: "",
                                    occupation: $scope.signUp_occupation,
                                    accID: accID
                                };
                                var signUpPatient = RGDCWebApplicationService.signUpPatient(patientData);
                                signUpPatient.then(function () {
                                    try { $scope.signUpRemove(); } catch (e) { }

                                    Swal.fire({
                                        icon: 'success',
                                        title: 'Account Created',
                                        text: 'Your account has been created successfully.',
                                        confirmButtonText: 'Go to Login'
                                    }).then(function () {
                                        window.location.href = "/RGDC/logIn";
                                    });
                                }).catch(function (err) {
                                    Swal.close();
                                    console.error('signUpPatient failed', err);
                                    Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to save patient information. Contact support.' });
                                });
                            }).catch(function (err) {
                                Swal.close();
                                console.error('signUp failed', err);
                                var message = (err && err.data && err.data.message) || 'Failed to create account. Please try again.';
                                Swal.fire({ icon: 'error', title: 'Error', text: message });
                            });
                        } else {
                            Swal.fire({
                                icon: "error",
                                title: "Read and Accept the Following:",
                                text: "Terms and Conditions & Data Privacy Policy",
                            });
                        }
                    }
                });
            }
            else {
                Swal.fire({
                    icon: "error",
                    title: "Incomplete Inputs",
                    text: "Ensure all fields are filled up with valid information.",
                });
            }
        } catch (e) {
            console.log(e.message);
            Swal.close();
            Swal.fire({ icon: 'error', title: 'Error', text: 'An unexpected error occurred.' });
        }
    };

    $scope.signUpClinicStaff = function () {

        try {

            function normalizeTimeToHHMM(value) {
                if (value === null || typeof value === 'undefined') return null;
                // Date -> HH:mm
                try {
                    if (value instanceof Date && !isNaN(value.getTime())) {
                        return String(value.getHours()).padStart(2, '0') + ':' + String(value.getMinutes()).padStart(2, '0');
                    }
                } catch (_) { }

                var s = String(value).trim();
                if (!s) return null;

                // "HH:mm" or "H:mm"
                var m1 = s.match(/^(\d{1,2}):(\d{2})$/);
                if (m1) return m1[1].padStart(2, '0') + ':' + m1[2];

                // "HH:mm:ss"
                var m2 = s.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
                if (m2) return m2[1].padStart(2, '0') + ':' + m2[2];

                // "08:00:00.000 AM" / "8:00:00.000 PM" (what you're seeing in the modal)
                var m3 = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?\s*(AM|PM)$/i);
                if (m3) {
                    var hh = parseInt(m3[1], 10);
                    var mm = parseInt(m3[2], 10);
                    var mer = (m3[4] || '').toUpperCase();
                    if (mer === 'PM' && hh !== 12) hh += 12;
                    if (mer === 'AM' && hh === 12) hh = 0;
                    return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
                }

                return null;
            }

            function hhmmToMinutes(hhmm) {
                var m = String(hhmm || '').match(/^(\d{2}):(\d{2})$/);
                if (!m) return null;
                var hh = parseInt(m[1], 10), mm = parseInt(m[2], 10);
                if (isNaN(hh) || isNaN(mm)) return null;
                return hh * 60 + mm;
            }

            function validateDentistScheduleOrThrow() {
                // Require at least one enabled day with valid time range for dentist signup
                var arr = Array.isArray($scope.modalScheduleDays) ? $scope.modalScheduleDays : [];
                var enabled = arr.filter(function (d) { return d && d.enabled; });
                if (!enabled.length) {
                    throw new Error("Please set at least one available day in Weekly Schedule.");
                }
                enabled.forEach(function (d) {
                    var stHHMM = normalizeTimeToHHMM(d.startTime);
                    var etHHMM = normalizeTimeToHHMM(d.endTime);
                    var sm = parseInt(d.slotMinutes, 10);
                    if (!stHHMM || !etHHMM) throw new Error("Please set start/end time for " + (d.dayName || "a day") + ".");

                    // Normalize model values so later persistence uses clean HH:mm
                    d.startTime = stHHMM;
                    d.endTime = etHHMM;

                    var sMin = hhmmToMinutes(stHHMM), eMin = hhmmToMinutes(etHHMM);
                    if (sMin === null || eMin === null) throw new Error("Invalid time format for " + (d.dayName || "a day") + ".");
                    if (eMin <= sMin) throw new Error((d.dayName || "A day") + ": end time must be after start time.");
                    if (isNaN(sm) || sm < 5) throw new Error((d.dayName || "A day") + ": slot minutes must be at least 5.");
                });
                return true;
            }

            var birthDate = new Date($scope.signUp_birthDate);
            birthDate.setHours(0, 0, 0, 0); // 00:00:00

            // Always sync combined address before validating
            //buildFullAddressFromParts();

            // Coerce branch to number if it came through as a string
            try {
                if ($scope.signUp_branchID !== null && typeof $scope.signUp_branchID !== 'undefined' && $scope.signUp_branchID !== '') {
                    var b = parseInt($scope.signUp_branchID, 10);
                    $scope.signUp_branchID = isNaN(b) ? null : b;
                }
            } catch (_) { }

            if ($scope.signUpStaff && !$scope.signUp_staffRole && !$scope.signUp_branchID) {
                Swal.fire({
                    icon: "error",
                    title: "Incomplete Inputs",
                    text: "Ensure all fields are filled up with valid information.",
                });
                return;
            }
            if ($scope.signUpDentist && !$scope.signUp_specialization && !$scope.signUp_branchID) {
                Swal.fire({

                    icon: "error",
                    title: "Incomplete Inputs",
                    text: "Ensure all fields are filled up with valid information.",
                });
                return;
            }
            if ($scope.signUpOwner && (!$scope.signUp_specialization)) {
                Swal.fire({
                    icon: "error",
                    title: "Incomplete Inputs",
                    text: "Ensure all fields are filled up with valid information.",
                });
                return;
            }
            if ($scope.signUp_firstName && $scope.signUp_lastName && $scope.signUp_genderID && $scope.signUp_birthDate && $scope.signUp_email && $scope.signUp_contactNumber && $scope.signUp_civilStatus && $scope.signUp_password && $scope.signUp_line1 && $scope.signUp_line2 && $scope.signUp_state && $scope.signUp_postal && $scope.signUp_country && $scope.signUp_city && $scope.signUp_religion && $scope.signUp_nationality) {
                Swal.fire({
                    icon: 'question',
                    title: 'Confirm Sign Up',

                    showCancelButton: true,
                    confirmButtonText: 'Confirm & Sign Up',
                    cancelButtonText: 'Edit'
                }).then((result) => {
                    if (result.isConfirmed) {
                        var accountData = {
                            firstName: $scope.signUp_firstName,
                            middleName: $scope.signUp_middleName,
                            lastName: $scope.signUp_lastName,
                            genderID: $scope.signUp_genderID,
                            birthDate: birthDate,
                            email: $scope.signUp_email,
                            contactNumber: $scope.signUp_contactNumber,
                            role: $scope.signUp_role,
                            permission: $scope.signUp_permission,
                            nationality: $scope.signUp_nationality,
                            religion: $scope.signUp_religion,
                            line1: $scope.signUp_line1,
                            line2: $scope.signUp_line2,
                            state: $scope.signUp_state,
                            country: $scope.signUp_country,
                            city: $scope.signUp_city,
                            postal: $scope.signUp_postal,
                            civilStatus: $scope.signUp_civilStatus,
                            password: $scope.signUp_password,
                            lastLogin: new Date(),
                            accCreatedAt: new Date(),
                            accUpdatedAt: new Date(),
                        };

                        accountData.photoLink = $scope._uploadedSignUpPhotoPath || "";

                        if ($scope.signUp_agreement == true) {
                            // Dentist must configure weekly schedule before we create the account
                            if (parseInt($scope.signUp_permission, 10) === 1) {
                                try {
                                    validateDentistScheduleOrThrow();
                                } catch (e) {
                                    Swal.fire({ icon: 'error', title: 'Weekly Schedule Required', text: e.message || 'Please set your weekly availability first.' });
                                    try { $scope.openScheduleModal(); } catch (_) { }
                                    return;
                                }
                            }

                            // show progress modal
                            Swal.fire({
                                title: 'Creating account...',
                                allowOutsideClick: false,
                                didOpen: function () {
                                    Swal.showLoading();
                                }
                            });

                            var signUp = RGDCWebApplicationService.signUp(accountData);
                            signUp.then(function (signUpID) {
                                var accID = signUpID && signUpID.data && signUpID.data.accID;
                                if (!accID) {
                                    Swal.close();
                                    Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to create account. Please try again.' });
                                    return;
                                }

                                var rolePromise = null;

                                if ($scope.signUp_permission == 0) {
                                    var ownerData = {
                                        accID: accID,
                                        specialization: $scope.signUp_specialization,
                                    }
                                    rolePromise = RGDCWebApplicationService.signUpOwner(ownerData);
                                } else if ($scope.signUp_permission == 1) {
                                    var dentistData = {
                                        accID: accID,
                                        specialization: $scope.signUp_specialization,
                                        branchID: $scope.signUp_branchID
                                    }
                                    rolePromise = RGDCWebApplicationService
                                        .signUpDentist(dentistData)
                                        .then(function (respDent) {
                                            var dentistID = respDent && respDent.data ? (respDent.data.dentistID || null) : null;
                                            dentistID = parseInt(dentistID, 10);
                                            console.log(dentistID)
                                            if (!dentistID || isNaN(dentistID)) throw new Error('Failed to resolve dentistID for schedule saving.');
                                            // required: persist schedule before finishing signup UX
                                            return $scope.persistDentistScheduleAfterSignup(dentistID);
                                        });
                                } else if ($scope.signUp_permission == 2) {
                                    var staffData = {
                                        accID: accID,
                                        staffRole: $scope.signUp_staffRole,
                                        branchID: $scope.signUp_branchID
                                    }
                                    rolePromise = RGDCWebApplicationService.signUpStaff(staffData);
                                }

                                Promise.resolve(rolePromise)
                                    .then(function () {
                                        // remove from queue (best effort)
                                        try {
                                            var emailQueue = { email: $scope.signUp_email };
                                            RGDCWebApplicationService.removeFromQueue(emailQueue);
                                        } catch (_) { }

                                        Swal.fire({
                                            icon: 'success',
                                            title: 'Account Created',
                                            text: 'Your account has been created successfully.',
                                            confirmButtonText: 'Go to Login'
                                        }).then(function () {
                                            window.location.href = "/RGDC/logIn";
                                        });
                                    })
                                    .catch(function (err) {
                                        Swal.close();
                                        console.error('Role creation/schedule persistence failed', err);
                                        var msg = (err && err.data && err.data.message) ? err.data.message : (err && err.message) ? err.message : 'Failed to save account information. Please try again.';
                                        Swal.fire({ icon: 'error', title: 'Error', text: msg });
                                    });
                            }).catch(function (err) {
                                Swal.close();
                                console.error('signUp failed', err);
                                var message = (err && err.data && err.data.message) || 'Failed to create account. Please try again.';
                                Swal.fire({ icon: 'error', title: 'Error', text: message });
                            });
                        } else {
                            Swal.fire({
                                icon: "error",
                                title: "Read and Accept the Following:",
                                text: "Terms and Conditions & Data Privacy Policy",
                            });
                        }

                    }
                });
            } else {
                // Show which fields are missing to avoid guesswork
                var missing = [];
                if (!$scope.signUp_firstName) missing.push('First Name');
                if (!$scope.signUp_lastName) missing.push('Last Name');
                if (!$scope.signUp_genderID) missing.push('Gender');
                if (!$scope.signUp_birthDate) missing.push('Birth Date');
                if (!$scope.signUp_email) missing.push('Email');
                if (!$scope.signUp_contactNumber) missing.push('Contact Number');
                if (!$scope.signUp_civilStatus) missing.push('Civil Status');
                if (!$scope.signUp_password) missing.push('Password');
                // Dentist/staff branch is required for downstream save; show if missing
                if (($scope.signUpDentist || $scope.signUpStaff) &&
                    ($scope.signUp_branchID === null || typeof $scope.signUp_branchID === 'undefined' || $scope.signUp_branchID === '')) {
                    missing.push('Branch');
                }

                Swal.fire({
                    icon: "error",
                    title: "Incomplete Inputs",
                    text: missing.length ? ("Missing: " + missing.join(', ')) : "Ensure all fields are filled up with valid information.",
                });
            }
        } catch (e) {
            console.log(e.message);
            Swal.close();
            Swal.fire({ icon: 'error', title: 'Error', text: 'An unexpected error occurred.' });
        }
    };

    $scope.login = function () {
        console.log($scope.login_password)
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
    $scope.getData = function () {
        $scope.getBranch();
        $scope.getGender();
    }

    $scope.getSessionVariables = function () {
        return RGDCWebApplicationService.getSessionVariable()
            .then(function (returnedData) {
                $scope.currentUserName = returnedData.data.userName || "";
                $scope.currentUserID = returnedData.data.userID || "";
                $scope.currentUserAuthorization = returnedData.data.userAuthorization || "";
                $scope.currentUserPermission = returnedData.data.userPermission || "";
                $scope.currentUserFullName = returnedData.data.fullName || "";

                if (returnedData.data.userPhoto) {
                    $scope.currentUserPhoto = returnedData.data.userPhoto;
                    sessionStorage.setItem('currentUserPhoto', returnedData.data.userPhoto);
                }

                // Google Calendar flags
                $scope.googleCalendarEnabled = !!returnedData.data.googleCalendarEnabled;
                $scope.googleConnected = !!returnedData.data.googleRefreshTokenPresent;
                if ($scope.currentUserAuthorization == "0") {
                    $scope.isUserOwner = true;
                    $scope.isUserAdmin = true;
                    $scope.isUserSAdmin = true;
                    $scope.userRole = "Superadmin";
                } else if ($scope.currentUserAuthorization == "1") {
                    $scope.isUserOwner = true;
                    $scope.isUserAdmin = true;
                    $scope.userRole = "Owner";
                } else if ($scope.currentUserAuthorization == "2") {
                    if ($scope.currentUserPermission == "1") {
                        $scope.isUserDentist = true;
                        $scope.isUserAdmin = true;
                        $scope.userRole = "Dentist"
                    } else if ($scope.currentUserPermission == "2") {
                        $scope.isUserStaff = true;
                        $scope.isUserAdmin = true;
                        $scope.userRole = "Staff"
                    } else if ($scope.currentUserPermission == "3") {
                        $scope.isUserPatient = true;
                        $scope.userRole = "Patient";
                    }
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

        if (!$scope.reset_email) {
            Swal.fire({
                icon: "error",
                title: "Email is Required",
                text: "Input your Email",
            });
            return;
        }
        var forgot_email = {
            email: $scope.reset_email
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

    $scope.verifyOTP = function () {
        var otpCode = {
            otpCode: $scope.forgot_otp
        }
        var verifyOTP = RGDCWebApplicationService.verifyOTP(otpCode);
        console.log(otpCode)
        verifyOTP.then(function (response) {
            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Verification Failed',
                    text: response.data.message || 'The OTP you entered is incorrect.',
                    confirmButtonColor: '#d33'
                }).then((result) => {
                    if (result.isConfirmed) {
                        var resetElem = document.getElementById('modalPasswordReset');
                        var resetInstance = M.Modal.getInstance(resetElem);
                        resetInstance.open();
                    }
                });

                var otpElem = document.getElementById('modal-password');
                var otpInstance = M.Modal.getInstance(otpElem);
                otpInstance.close();

            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Verification Failed',
                    text: response.data.message || 'The OTP you entered is incorrect.',
                    confirmButtonColor: '#d33'
                });
            }
        });
    }


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
            email: $scope.reset_email,
            password: $scope.forgot_newPassword,
            otp: $scope.forgot_otp
        }
        var resetPassword = RGDCWebApplicationService.resetPassword(forgot_info);
        resetPassword.then(function (returnedData) {
            if (returnedData.data.success) {
                var modal = document.getElementById("password-modal");
                if (modal) {
                    modal.style.display = "none";
                }
                Swal.fire({
                    icon: "success",
                    title: "Password Changed Successfully",
                    text: "Log In with your new password!",
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = "/RGDC";
                        afterUpdate();
                    }
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Password Not Changed",
                    text: returnedData.data.message,
                });
            }
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
        // Always load dentist list for appointment selection (patients need it too)
        var getDentists = RGDCWebApplicationService.getDentistList();
        getDentists.then(function (dentistList) {
            // ensure mapping to { dentistID, dentistName } consistent with loadDentistList
            var raw = dentistList.data || [];
            $scope.dentistArray = (Array.isArray(raw) ? raw : []).map(function (d) {
                var id = null;
                if (d && typeof d.dentistID !== 'undefined') id = d.dentistID;
                else if (d && typeof d.accID !== 'undefined') id = d.accID;
                else if (d && typeof d.id !== 'undefined') id = d.id;
                id = (id !== null && id !== '') ? parseInt(id, 10) : null;

                var name = '';
                if (d) {
                    if (d.dentistName) name = d.dentistName;
                    else if (d.fullName) name = d.fullName;
                    else if (d.firstName || d.lastName) {
                        name = ((d.firstName || '') + ' ' + (d.lastName || '')).trim();
                    } else if (d.email) {
                        name = d.email;
                    }
                }
                return { dentistID: id, dentistName: name };
            }).filter(function (x) {
                return x && typeof x.dentistID !== 'undefined' && x.dentistID !== null && !isNaN(x.dentistID);
            });

            // If only one dentist, preselect for convenience
            if (!$scope.newApptRequest) $scope.newApptRequest = {};
            if (!$scope.newApptRequest.dentistID && $scope.dentistArray.length === 1) {
                $scope.newApptRequest.dentistID = $scope.dentistArray[0].dentistID;
                $timeout(function () { try { $scope.updateTimeOptions(); } catch (e) { console.error(e); } }, 0);
            }
        }).catch(function (err) {
            console.error('Failed to load dentists', err);
            $scope.dentistArray = [];
        });
    };


    $scope.getPatientsNDentist = function () {
        $scope.getPatients();
        $scope.getDentists();
    }

    $scope.goToPatientInfo = function (patient) {
        // Normalize patientID to a valid integer before posting to session
        var pid = null;
        try { pid = parseInt(patient && patient.patientID, 10); } catch (_) { pid = null; }
        if (!pid || isNaN(pid) || pid <= 0) {
            console.warn('goToPatientInfo: invalid patientID', patient && patient.patientID);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Invalid patient selected.' });
            return;
        }
        var patientID = { patientID: String(pid) };

        if ($scope.currentUserAuthorization != "2") {
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
            if ($scope.currentUserPermission != 3) {
                var getPatientInfo = RGDCWebApplicationService.getSelectedPatientDetails();
                getPatientInfo.then(function (patientInfo) {
                    console.log(patientInfo)
                    // Server can return null/empty when no patient is selected.
                    // Normalize to "no patient" instead of breaking downstream code.
                    if (!patientInfo || !patientInfo.data || typeof patientInfo.data !== 'object') {
                        $scope.selectedPatient = null;
                        $scope.paymentsArray = [];
                        return;
                    }

                    var p = patientInfo.data;

                    try {
                        var resolvedPhoto = '';
                        if (p && p.photoLink) resolvedPhoto = p.photoLink;
                        else if (p && p.userPhoto) resolvedPhoto = p.userPhoto;
                        else if (p && p.photo) resolvedPhoto = p.photo;
                        else if (p && p.accPhoto) resolvedPhoto = p.accPhoto;
                        else if (p && p.account && p.account.photoLink) resolvedPhoto = p.account.photoLink;
                        else if (p && p.acc && p.acc.photoLink) resolvedPhoto = p.acc.photoLink;
                        p.photoLink = (typeof resolvedPhoto === 'string') ? resolvedPhoto.trim() : (resolvedPhoto || '');
                    } catch (e) {
                        p.photoLink = p.photoLink || '';
                    }

                    // format visit dates
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

                    try {
                        if (typeof p.occupation === 'undefined' || p.occupation === null || String(p.occupation).trim() === '') {
                            p.occupation = p.occ || p.job || '';
                        }
                    } catch (_) {
                        p.occupation = p.occupation || '';
                    }



                    if (p.birthDate) {
                        var birthJs = parseJsonDateToJsDate(p.birthDate);
                        if (birthJs) {
                            p.birthDateRaw = birthJs;
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

                    // load dental chart/xray history table
                    try {
                        if ($scope.selectedPatient && $scope.selectedPatient.patientID && typeof $scope.loadPatientImages === 'function') {
                            $scope.loadPatientImages($scope.selectedPatient.patientID);
                        }
                    } catch (e) { }

                    // load dental chart/xray history table
                    try {
                        if ($scope.selectedPatient && $scope.selectedPatient.patientID && typeof $scope.loadPatientImages === 'function') {
                            $scope.loadPatientImages($scope.selectedPatient.patientID);
                        }
                    } catch (e) { }

                    $scope.editPatientEmailValid = $scope.hasValidEmail(($scope.selectedPatient && $scope.selectedPatient.email) ? $scope.selectedPatient.email.trim() : '');
                    $scope.editPatientEmailTaken = false;
                    try { $scope.checkEditPatientEmail(); } catch (e) { /* safe */ }

                    //try {
                    //    $scope.loadPatientForms();
                    //} catch (e) {
                    //    console.warn('loadPatientForms failed', e);
                    //}

                    if (!$scope.genderArray || $scope.genderArray.length === 0) {
                        $scope.getGender();
                    }

                    initializeDatepicker();
                });
                console.log("here")
                var getPayments = RGDCWebApplicationService.getOwnPayments();
                getPayments.then(function (paymentList) {
                    var data = paymentList ? paymentList.data : null;
                    // API can return { success:false, message:"..." } when no patient is selected
                    $scope.paymentsArray = Array.isArray(data) ? data : [];
                    $scope.paymentsArray.forEach(function (payment) {
                        if (payment && payment.paymentDate) {
                            payment.paymentDate = formatDateToMDY(payment.paymentDate);
                        }
                    });


                    $timeout(function () {
                        initProgressNotesDataTable({ maxRetries: 30, retryDelay: 120 });
                    }, 80);
                }).catch(function (err) {
                    console.error('getPatientTreatment error', err);
                    $scope.paymentsArray = [];
                });

            } else {
                var getPatientInfo = RGDCWebApplicationService.getOwnPatientDetails();
                getPatientInfo.then(function (patientInfo) {

                    if (!patientInfo || !patientInfo.data) return;

                    var p = patientInfo.data;

                    try {
                        var resolvedPhoto = '';
                        if (p && p.photoLink) resolvedPhoto = p.photoLink;
                        else if (p && p.userPhoto) resolvedPhoto = p.userPhoto;
                        else if (p && p.photo) resolvedPhoto = p.photo;
                        else if (p && p.accPhoto) resolvedPhoto = p.accPhoto;
                        else if (p && p.account && p.account.photoLink) resolvedPhoto = p.account.photoLink;
                        else if (p && p.acc && p.acc.photoLink) resolvedPhoto = p.acc.photoLink;
                        p.photoLink = (typeof resolvedPhoto === 'string') ? resolvedPhoto.trim() : (resolvedPhoto || '');
                    } catch (e) {
                        p.photoLink = p.photoLink || '';
                    }

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

                    $scope.editPatientEmailValid = $scope.hasValidEmail(($scope.selectedPatient && $scope.selectedPatient.email) ? $scope.selectedPatient.email.trim() : '');
                    $scope.editPatientEmailTaken = false;
                    try { $scope.checkEditPatientEmail(); } catch (e) { /* safe */ }

                    //try {
                    //    $scope.loadPatientForms();
                    //} catch (e) {
                    //    console.warn('loadPatientForms failed', e);
                    //}

                    //if (!$scope.genderArray || $scope.genderArray.length === 0) {
                    //    $scope.getGender();
                    //}

                    //try { $scope.loadPatientForms(); } catch (e) { console.warn('loadPatientForms failed', e); }

                    initializeDatepicker();
                });
                var getPayments = RGDCWebApplicationService.getOwnPayments();
                getPayments.then(function (paymentList) {
                    $scope.paymentsArray = paymentList.data;
                    $scope.paymentsArray.forEach(function (payment) {
                        console.log($scope.paymentsArray)
                        if (payment.paymentDate) {
                            payment.paymentDate = formatDateToMDY(payment.paymentDate)
                        }
                    })


                    $timeout(function () {
                        initProgressNotesDataTable({ maxRetries: 30, retryDelay: 120 });
                    }, 80);
                }).catch(function (err) {
                    console.error('getPatientTreatment error', err);
                });
            }
        });
    };

    $scope.getPayments = function () {

        RGDCWebApplicationService.getPayments()
            .then(function (paymentList) {

                let data = paymentList.data || [];

                data.forEach(function (payment) {
                    if (payment.paymentDate) {
                        payment.paymentDate = formatDateToMDY(payment.paymentDate);
                    }
                });
                $scope.archivedPayments = data.filter(function (p) {
                    return Number(p.isArchived) === 1;
                });

                $scope.unarchivedPayments = data.filter(function (p) {
                    return Number(p.isArchived) === 0;
                });

                $scope.paymentsArray = $scope.unarchivedPayments;

            });
    };
   
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
            genderID: (function () {
                if (typeof $scope.selectedPatient.genderID === 'undefined' || $scope.selectedPatient.genderID === null) return null;
                var n = parseInt($scope.selectedPatient.genderID, 10);
                return isNaN(n) ? null : n;
            })(),
            birthDate: $scope.selectedPatient.birthDateRaw ? new Date($scope.selectedPatient.birthDateRaw) : null,
            email: $scope.selectedPatient.email,
            contactNumber: $scope.selectedPatient.contactNumber,
            line1: $scope.selectedPatient.line1,
            line2: $scope.selectedPatient.line2,
            state: $scope.selectedPatient.state,
            country: $scope.selectedPatient.country,
            city: $scope.selectedPatient.city,
            postal: $scope.selectedPatient.postal,
            civilStatus: $scope.selectedPatient.civilStatus,
            occupation: $scope.selectedPatient.occupation,
            religion: $scope.selectedPatient.religion,
            nationality: $scope.selectedPatient.nationality,
            currentPhysician: $scope.selectedPatient.currPhy || $scope.selectedPatient.currentPhysician,
            previousPhysician: $scope.selectedPatient.prevPhy || $scope.selectedPatient.previousPhysician,
            guardian: $scope.selectedPatient.guar,
            guardianNumber: $scope.selectedPatient.guarNum,
            referral: $scope.selectedPatient.referral
        };
        console.log(profInfo)
        var updateData = RGDCWebApplicationService.updatePatient(profInfo);
        updateData.then(function (response) {
            if (response.data.success) {
                var modal = document.getElementById("modalEditPatientInfo");
                if (modal) {
                    if (typeof M !== 'undefined' && M.Modal) {
                        var inst = M.Modal.getInstance(modal);
                        if (inst) inst.close();
                    } else {
                        modal.style.display = "none";
                    }
                }

                Swal.fire({
                    icon: "success",
                    title: "Success!",
                    text: response.data.message || "Profile updated."
                }).then((result) => {
                    if (result.isConfirmed) {
                        if ($scope.isUserPatient || $scope.currentUserPermission == 3) {
                            window.location.href = "/RGDC/patientProfile";
                        } else {
                            window.location.href = "/RGDC/adminPatientsTab";
                        }
                    }
                });
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

    // Dental chart / Xray (stored in tbl_patient.dentalChartLink + dentalChartType)
    $scope.dentalUploadType = $scope.dentalUploadType || "";
    $scope._pickedDentalChartFile = null;

    $scope.openDentalChartModalView = function () {
        try {
            if (!$scope.selectedPatient) return;
            $scope.dentalUploadType = $scope.selectedPatient.dentalChartType || $scope.dentalUploadType || "";
            var modalImg = document.getElementById('dentalChartModalImg');
            if (modalImg && $scope.selectedPatient.dentalChartLink) {
                modalImg.src = $scope.selectedPatient.dentalChartLink + '?t=' + new Date().getTime();
            }
        } catch (_) { }
    };

    $scope.patientImages = $scope.patientImages || [];
    $scope.loadPatientImages = function (patientID) {
        return RGDCWebApplicationService.getPatientImages(patientID)
            .then(function (resp) {
                var data = resp && resp.data ? resp.data : [];
                var arr = Array.isArray(data) ? data : [];
                // Normalize createdAt from MVC "/Date(…)/" into real JS Date for Angular date filter
                $scope.patientImages = arr.map(function (x) {
                    try {
                        var y = Object.assign({}, x);
                        if (y && y.createdAt) {
                            var js = parseJsonDateToJsDate(y.createdAt);
                            if (js) y.createdAt = js;
                        }
                        return y;
                    } catch (_) {
                        return x;
                    }
                });
                $timeout(function () { }, 0);
            })
            .catch(function (err) {
                console.error('getPatientImages error', err);
                $scope.patientImages = [];
            });
    };

    $scope.viewPatientImage = function (img) {
        try {
            if (!img) return;
            $scope.dentalUploadType = img.imageType || $scope.dentalUploadType || "";
            var modalImg = document.getElementById('dentalChartModalImg');
            if (modalImg && img.imagePath) {
                modalImg.src = img.imagePath + '?t=' + new Date().getTime();
            }
        } catch (_) { }
    };

    $scope.pickDentalChartFile = function () {
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

            $scope._pickedDentalChartFile = file;
            var reader = new FileReader();
            reader.onload = function (evt) {
                $timeout(function () {
                    var modalImg = document.getElementById('dentalChartModalImg');
                    if (modalImg) modalImg.src = evt.target.result;
                }, 0);
            };
            reader.readAsDataURL(file);
            document.body.removeChild(input);
        };
        input.click();
    };

    $scope.saveDentalChart = function () {
        try {
            function ensureSelectedPatient() {
                if ($scope.selectedPatient && $scope.selectedPatient.patientID) return Promise.resolve($scope.selectedPatient);
                // fallback: load from session-selected patient
                return RGDCWebApplicationService.getSelectedPatientDetails().then(function (resp) {
                    if (resp && resp.data) {
                        $scope.selectedPatient = resp.data;
                        return $scope.selectedPatient;
                    }
                    return null;
                });
            }
            if (!$scope.dentalUploadType) {
                return Swal.fire({ icon: 'error', title: 'Missing Type', text: 'Please select Xray or Dental Chart.' });
            }
            if (!$scope._pickedDentalChartFile) {
                return Swal.fire({ icon: 'error', title: 'No File', text: 'Please upload/select an image first.' });
            }

            Swal.fire({ title: 'Uploading...', allowOutsideClick: false, didOpen: function () { Swal.showLoading(); } });

            ensureSelectedPatient().then(function (p) {
                if (!p || !p.patientID) {
                    throw new Error('No patient selected.');
                }
                return RGDCWebApplicationService.uploadFile($scope._pickedDentalChartFile)
                    .then(function (resp) {
                        var json = resp && resp.data ? resp.data : {};
                        if (!(json.success === true && json.filePath)) throw new Error(json.message || 'Upload failed.');
                        return RGDCWebApplicationService.saveDentalChart({
                            patientID: parseInt(p.patientID, 10),
                            imagePath: json.filePath,
                            imageType: $scope.dentalUploadType
                        });
                    })
                    .then(function (resp2) {
                        var d = resp2 && resp2.data ? resp2.data : {};
                        if (!d.success) throw new Error(d.message || 'Failed to save dental chart.');
                        $scope._pickedDentalChartFile = null;
                        // Refresh patient details so table shows the new type/path
                        return RGDCWebApplicationService.getSelectedPatientDetails();
                    })
                    .then(function (patientInfo) {
                        if (patientInfo && patientInfo.data) {
                            $scope.selectedPatient = patientInfo.data;
                        }
                        // refresh list
                        try {
                            if ($scope.selectedPatient && $scope.selectedPatient.patientID) {
                                $scope.loadPatientImages($scope.selectedPatient.patientID);
                            }
                        } catch (_) { }

                        Swal.fire({ icon: 'success', title: 'Saved', text: 'Image uploaded.' });
                    })
                    .catch(function (err) {
                        console.error('saveDentalChart error', err);
                        Swal.fire({ icon: 'error', title: 'Error', text: (err && err.message) ? err.message : 'Failed to upload.' });
                    });
            }).catch(function (e) {
                console.error('saveDentalChart ensureSelectedPatient error', e);
                Swal.fire({ icon: 'error', title: 'No patient', text: e.message || 'No patient selected.' });
            });
        } catch (e) {
            console.error('saveDentalChart error', e);
            Swal.fire({ icon: 'error', title: 'Error', text: e.message || 'Failed to upload.' });
        }
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
        Swal.fire({
            icon: 'question',
            title: 'Logging Out?',

            showCancelButton: true,
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                RGDCWebApplicationService.logOut();
                window.location.href = "/RGDC/logIn";
            }
        });
    }

    $scope.goHome = function () {
        if ($scope.isUserPatient) {
            window.location.href = '/RGDC/patientDashboard';
        } else if (String($scope.currentUserAuthorization || "") === "2" && String($scope.currentUserPermission || "") === "1") {
            window.location.href = '/RGDC/dentistDashboard';
        } else {
            window.location.href = '/RGDC/adminDashboard';
        }
    };

    $scope.medicalHistoryUpdate = function () {
        if ($scope.medHisForm && $scope.medHisForm.$invalid) {
            try { $scope.medHisForm.$setSubmitted(); } catch (e) { /* ignore */ }
            Swal.fire({ icon: 'error', title: 'Missing or invalid fields', text: 'Please complete all required medical history fields before saving.' });
            return;
        }

        var prevPhysicianDetails = {
            previousPhysician: $scope.prevPhy,
            previousPhysicianOffice: $scope.prevPhyOffice,
            previousPhysicianContact: $scope.prevPhyContact
        };
        var medHist = {
            history: $scope.medical.history,
            conditions: $scope.medical.conditions
        };
        console.log(medHist);
        var updateMedHistIni = RGDCWebApplicationService.updateMedHistIni(prevPhysicianDetails);
        updateMedHistIni.then(function (response) {
            if (response.data.success) {
                var modal = document.getElementById("modalMedHis")
                var instance = M.Modal.getInstance(modal);
                instance.close();
                var updateMedHist = RGDCWebApplicationService.updateMedHist(medHist);
                updateMedHist.then(function (response) {
                    if (response && response.data && response.data.success) {
                        if (response.data.medHistUpdate) {
                            $timeout(function () {
                                $scope.getSelectedPatientDetails();
                            }, 0);
                        } else {
                            $timeout(function () {
                                $scope.getSelectedPatientDetails();
                            }, 0);
                        }

                        if ($scope.selectedPatient.signatureLink == null) {
                            $scope.saveSignature();
                        } else {
                            Swal.fire({
                                icon: "success",
                                title: "SUCCESS",
                                text: "Medical History Updated!"
                            });
                        }
                    } else {
                        Swal.fire({
                            icon: "error",
                            title: "Error",
                            text: "Unable to update medical history",
                        });
                    }
                }).catch(function (err) {
                    console.error('updateMedHist error', err);
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: "Unable to update medical history",
                    });
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Unable to update medical history",
                });
            }
        }).catch(function (err) {
            console.error('updateMedHistIni error', err);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Unable to update previous physician information",
            });
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



    $scope.postArray = [];


    $scope.getPostOp = function () {
        RGDCWebApplicationService.getPostOp()
            .then(function (returnedData) {
                $scope.postArray = returnedData.data || [];


            })
            .catch(function (err) {
                console.error('Failed to load postOp Array', err);
                $scope.postArray = [];
            });
    }

    $scope.getPostOpContent = function () {
        return $sce.trustAsHtml(
            $scope.selectedPatient.postOpInstructions || $scope.postOp.instructions
        );
    };

    $scope.deletePostOp = function () {
        RGDCWebApplicationService.deletePostOp();
        window.location.href = "/RGDC/patientProfile"
    }
    $scope.savePostOp = function () {
        var postOp = {
            postOpID: $scope.selectedPatient.postOpID
        }
        RGDCWebApplicationService.savePostOp(postOp);
        var modal = document.getElementById('modalEditPostOp');
        if (modal && typeof M !== 'undefined' && M.Modal) {
            var inst = M.Modal.getInstance(modal);
            if (inst) inst.close();
        }
        window.location.href = "/RGDC/patientProfile"
    }

    app.controller('YourController', function ($scope, $sce) {

        $scope.getPostOpContent = function () {
            return $sce.trustAsHtml(
                $scope.selectedPatient.postOpInstructions || $scope.postOp.instructions
            );
        };

    });

    $scope.fillMedicalHistoryForm = function (medHistString) {
        var medHistObj = {};
        try {
            if (medHistString === null || typeof medHistString === 'undefined' || medHistString === '') {
                medHistObj = {};
            } else if (typeof medHistString === 'string') {
                try {
                    medHistObj = medHistString.trim() === '' ? {} : JSON.parse(medHistString);
                } catch (e) {
                    console.warn('fillMedicalHistoryForm: JSON.parse failed, treating as empty', e);
                    medHistObj = {};
                }
            } else if (typeof medHistString === 'object') {
                medHistObj = medHistString || {};
            } else {
                medHistObj = {};
            }
        } catch (e) {
            console.warn('fillMedicalHistoryForm unexpected error', e);
            medHistObj = {};
        }

        medHistObj.history = medHistObj.history || {};
        medHistObj.conditions = medHistObj.conditions || {};

        $scope.medical = $scope.medical || {};
        $scope.medical.history = $scope.medical.history || {};
        $scope.medical.conditions = $scope.medical.conditions || {};

        try {
            angular.copy(medHistObj.history, $scope.medical.history);
            angular.copy(medHistObj.conditions, $scope.medical.conditions);
        } catch (e) {
            console.warn('fillMedicalHistoryForm angular.copy failed, applying directly', e);
            $scope.medical.history = medHistObj.history;
            $scope.medical.conditions = medHistObj.conditions;
        }
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
        $scope.editingAppt.status = appt.status || 'Scheduled';
        $scope.editingAppt.remarks = appt.remarks || '';

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

    $scope.openViewApptModal = function (appt, $event) {
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
        $scope.editingAppt.status = appt.status || 'Scheduled';
        $scope.editingAppt.remarks = appt.remarks || '';

        // Open modal programmatically
        $timeout(function () {
            var modalElem = findModalElement(['modalViewSchedAppt']);
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

        try {
            // client-side guard: prevent patient from changing status
            if (!$scope.isUserPatient && $scope.editingAppt.status) {
                updateData.status = $scope.editingAppt.status;
            }
        } catch (e) {
            // if scope flags aren't available, still include status conservatively
            if ($scope.editingAppt.status) updateData.status = $scope.editingAppt.status;
        }

        updateData.remarks = $scope.editingAppt.remarks || null;

        RGDCWebApplicationService.updateAppointment(updateData)
            .then(function (response) {
                if (response.data && response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Appointment updated successfully.'
                    }).then(function () {
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
                            patientName: '',
                            status: 'Scheduled',
                            remarks: ''
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
        try {
            $scope.apptToDelete = appt || null;
            $scope.deleteApptReason = ''; // clear previous reason
            // backup hidden field
            var hid = document.getElementById('hiddenDeleteApptID');
            if (hid && appt && appt.apptID) hid.value = appt.apptID;

            var modalElem = document.getElementById('modalDeleteSchedAppt');
            if (!modalElem) return;
            if (typeof M !== 'undefined' && M && M.Modal) {
                var instance = M.Modal.getInstance(modalElem);
                if (!instance) instance = M.Modal.init(modalElem, {});
                instance.open();
            } else {
                modalElem.style.display = 'block';
            }
        } catch (e) {
            console.error('openDeleteApptModal failed', e);
        }
    };

    function selectAdminAppointmentTab(tabId) {
        try {
            var tabsEl = document.querySelector('.tabs');
            if (tabsEl && typeof M !== 'undefined' && M && M.Tabs) {
                var inst = M.Tabs.getInstance(tabsEl);
                if (!inst) inst = M.Tabs.init(tabsEl, {});
                if (inst && typeof inst.select === 'function') inst.select(tabId);
            } else {
                // fallback: trigger click on anchor
                var a = document.querySelector('a[href="#' + tabId + '"]');
                if (a) a.click();
            }
        } catch (_) { }
    }

    // Initialize admin appointments on controller load
    $timeout(function () {
        // Ensure session variables loaded to know current role
        $scope.getSessionVariables().then(function () {
            $scope.loadAdminScheduledAppointments();
            $scope.loadDentistList();
            $scope.loadPatientList();
            $scope.loadRequestedAppointments();
            $scope.loadPastAppointments();

            if (String($scope.currentUserAuthorization || "") === "2" && String($scope.currentUserPermission || "") === "1") {
                RGDCWebApplicationService.getCurrentDentist().then(function (resp) {
                    if (resp && resp.data && resp.data.success) {
                        $scope.currentDentist = { dentistID: resp.data.dentistID, dentistName: resp.data.dentistName };
                        $scope.newApptRequest = $scope.newApptRequest || {};
                        // ensure numeric type that matches the dentistArray mapping
                        $scope.newApptRequest.dentistID = parseInt(resp.data.dentistID, 10);

                        // ensure time options recompute immediately (in case date already chosen)
                        $timeout(function () { try { $scope.updateTimeOptions(); } catch (e) { console.error(e); } }, 0);
                        // Re-bind requested-appointments actions (canActOnRequest uses currentDentist + appt.dentistID)
                        $timeout(function () { try { $scope.loadRequestedAppointments(); } catch (e2) { } }, 0);
                    }
                }).catch(function () { });
            }

            // If patient user, pre-select their patient record so they don't have to choose
            if ($scope.isUserPatient) {
                // Ensure patient and dentist lists are loaded first, then set the model so selects bind correctly.
                $scope._resolvingOwnPatientID = true;
                // load both lists in parallel and then resolve own patient id
                Promise.all([$scope.loadPatientList(), $scope.loadDentistList()])
                    .then(function () {
                        return RGDCWebApplicationService.getOwnPatientDetails();
                    })
                    .then(function (resp) {
                        $scope._resolvingOwnPatientID = false;
                        if (resp && resp.data && typeof resp.data.patientID !== 'undefined') {
                            $timeout(function () {
                                $scope.newApptRequest = $scope.newApptRequest || {};
                                $scope.newApptRequest.patientID = parseInt(resp.data.patientID, 10);
                                $scope._ownPatientID = resp.data.patientID;
                                // ensure patient appears in patientArray (loadPatientList already attempts to do this)
                                if (!($scope.patientArray || []).some(function (p) { return p.patientID === $scope.newApptRequest.patientID; })) {
                                    var name = resp.data.patientName || ((resp.data.firstName || '') + ' ' + (resp.data.lastName || '')).trim() || resp.data.email || ('Patient ' + resp.data.patientID);
                                    $scope.patientArray = $scope.patientArray || [];
                                    $scope.patientArray.push({ patientID: $scope.newApptRequest.patientID, patientName: name });
                                }
                            }, 0);
                        }
                    })
                    .catch(function () {
                        $scope._resolvingOwnPatientID = false;
                        // fallback: try to set _ownPatientID if available from earlier
                        if ($scope._ownPatientID) {
                            $scope.newApptRequest = $scope.newApptRequest || {};
                            $scope.newApptRequest.patientID = parseInt($scope._ownPatientID, 10);
                        }
                    });
            }

            // compute minimum selectable date (today + 3 days) for appointment date inputs (global)
            (function computeMinDate() {
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
            if (String($scope.currentUserAuthorization || "") === "2" && String($scope.currentUserPermission || "") === "1") {
                RGDCWebApplicationService.getCurrentDentist().then(function (resp) {
                    if (resp && resp.data && resp.data.success) {
                        $scope.currentDentist = { dentistID: resp.data.dentistID, dentistName: resp.data.dentistName };
                        $scope.newApptRequest = $scope.newApptRequest || {};
                        $scope.newApptRequest.dentistID = parseInt(resp.data.dentistID, 10);
                        $timeout(function () { try { $scope.updateTimeOptions(); } catch (e) { console.error(e); } }, 0);
                        $timeout(function () { try { $scope.loadRequestedAppointments(); } catch (e2) { } }, 0);
                    }
                }).catch(function () { });
            }
            // compute minimum selectable date (today + 3 days) for appointment date inputs
            (function computeMinDate() {
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
        var apptID = $scope.apptToDelete && $scope.apptToDelete.apptID ? $scope.apptToDelete.apptID : (document.getElementById('hiddenDeleteApptID') || {}).value;
        if (!apptID) return Swal.fire({ icon: 'error', title: 'Error', text: 'No appointment selected.' });

        var reason = ($scope.deleteApptReason || '').trim();
        if (!reason) return Swal.fire({ icon: 'error', title: 'Reason required', text: 'Please enter a reason for deletion.' });

        Swal.fire({
            title: 'Confirm Delete',
            text: 'This will mark the appointment as cancelled/deleted and will be moved to Past Appointments. Continue?',
            icon: 'warning',
            showCancelButton: true
        }).then(function (res) {
            if (!res.isConfirmed) return;
            RGDCWebApplicationService.deleteAppointment({ apptID: apptID, reason: reason })
                .then(function (resp) {
                    if (resp && resp.data && resp.data.success) {
                        // close modal and refresh lists
                        var modalElem = document.getElementById('modalDeleteSchedAppt');
                        try { M.Modal.getInstance(modalElem).close(); } catch (e) { modalElem.style.display = 'none'; }
                        Swal.fire({ icon: 'success', title: 'Deleted', text: resp.data.message }).then(function () {
                            $scope.loadAdminScheduledAppointments();
                            $scope.loadPastAppointments();
                            // jump user to Past Appointments tab
                            selectAdminAppointmentTab('past');
                        });
                    } else {
                        Swal.fire({ icon: 'error', title: 'Error', text: (resp && resp.data && resp.data.message) || 'Failed to delete appointment.' });
                    }
                })
                .catch(function (err) {
                    console.error('deleteAppointment error', err);
                    Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred while deleting appointment.' });
                });
        });
    };

    $scope.openArchivePastApptModal = function (appt) {
        try {
            $scope.apptToArchive = appt || null;
            var modalElem = document.getElementById('modalDeletePastAppt');
            if (!modalElem) return;
            if (typeof M !== 'undefined' && M && M.Modal) {
                var instance = M.Modal.getInstance(modalElem);
                if (!instance) instance = M.Modal.init(modalElem, {});
                instance.open();
            } else {
                modalElem.style.display = 'block';
            }
        } catch (e) {
            console.error('openArchivePastApptModal failed', e);
        }
    };

    $scope.archivePastAppointment = function () {
        var apptID = $scope.apptToArchive && $scope.apptToArchive.apptID ? $scope.apptToArchive.apptID : null;
        if (!apptID) return Swal.fire({ icon: 'error', title: 'Error', text: 'No appointment selected.' });

        Swal.fire({
            title: 'Archive Appointment',
            text: 'This will archive the appointment and remove it from Past Appointments. Continue?',
            icon: 'warning',
            showCancelButton: true
        }).then(function (res) {
            if (!res.isConfirmed) return;

            RGDCWebApplicationService.archiveAppointment({ apptID: apptID })
                .then(function (resp) {
                    if (resp && resp.data && resp.data.success) {
                        var modalElem = document.getElementById('modalDeletePastAppt');
                        try { M.Modal.getInstance(modalElem).close(); } catch (e) { modalElem.style.display = 'none'; }
                        Swal.fire({ icon: 'success', title: 'Archived', text: resp.data.message }).then(function () {
                            $scope.loadPastAppointments();
                        });
                    } else {
                        Swal.fire({ icon: 'error', title: 'Error', text: (resp && resp.data && resp.data.message) || 'Failed to archive appointment.' });
                    }
                })
                .catch(function (err) {
                    console.error('archivePastAppointment error', err);
                    Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred while archiving appointment.' });
                });
        });
    };

    // --- Appointment Request Functionality ---
    $scope.dentistArray = [];
    $scope.patientArray = [];
    $scope.requestedAppointments = [];

    $scope.loadDentistList = function () {
        // Return a promise so callers can wait for dentists to be available
        return RGDCWebApplicationService.getDentistList()
            .then(function (response) {
                var raw = response.data || [];
                $scope.dentistArray = (Array.isArray(raw) ? raw : []).map(function (d) {
                    var id = null;
                    if (d && typeof d.dentistID !== 'undefined') id = d.dentistID;
                    else if (d && typeof d.accID !== 'undefined') id = d.accID;
                    else if (d && typeof d.id !== 'undefined') id = d.id;
                    id = (id !== null && id !== '') ? parseInt(id, 10) : null;

                    var name = '';
                    if (d) {
                        if (d.dentistName) name = d.dentistName;
                        else if (d.fullName) name = d.fullName;
                        else if (d.firstName || d.lastName) {
                            name = ((d.firstName || '') + ' ' + (d.lastName || '')).trim();
                        } else if (d.email) {
                            name = d.email;
                        }
                    }
                    return { dentistID: id, dentistName: name };
                }).filter(function (x) {
                    // keep valid numeric ids (including 0)
                    return x && typeof x.dentistID !== 'undefined' && x.dentistID !== null && !isNaN(x.dentistID);
                });

                // Preselect dentist where appropriate (dentist user / single-dentist clinics)
                if (!$scope.newApptRequest) $scope.newApptRequest = {};
                if (($scope.currentUserAuthorization === "2" && $scope.currentUserPermission === "1") && $scope.currentDentist && typeof $scope.currentDentist.dentistID !== 'undefined') {
                    $scope.newApptRequest.dentistID = parseInt($scope.currentDentist.dentistID, 10);
                } else if (!$scope.newApptRequest.dentistID && $scope.dentistArray.length === 1) {
                    $scope.newApptRequest.dentistID = $scope.dentistArray[0].dentistID;
                }

                // trigger time options recompute
                $timeout(function () { try { $scope.updateTimeOptions(); } catch (e) { } }, 0);
                return $scope.dentistArray;
            })
            .catch(function (err) {
                console.error('Failed to load dentist list', err);
                $scope.dentistArray = [];
                return $scope.dentistArray;
            });
    };

    $scope.loadPatientList = function () {
        // Return a promise so callers can wait for patients to be available
        return RGDCWebApplicationService.getPatientListForAppointment()
            .then(function (response) {
                var raw = response.data || [];
                var arr = Array.isArray(raw) ? raw : [];

                var filtered = arr.filter(function (p) {
                    if (!p) return false;
                    if (typeof p.patientID !== 'undefined' && p.patientID !== null) return true;
                    if (typeof p.role !== 'undefined' && parseInt(p.role, 10) === 3) return true;
                    return false;
                });

                $scope.patientArray = filtered.map(function (p) {
                    var id = null;
                    if (p && typeof p.patientID !== 'undefined' && p.patientID !== null) id = p.patientID;
                    else if (p && typeof p.accID !== 'undefined' && p.accID !== null) id = p.accID;
                    else if (p && typeof p.id !== 'undefined' && p.id !== null) id = p.id;
                    id = (id !== null && id !== '') ? parseInt(id, 10) : null;

                    var name = '';
                    if (p) {
                        if (p.patientName) name = p.patientName;
                        else if (p.fullName) name = p.fullName;
                        else if (p.firstName || p.lastName) {
                            name = ((p.firstName || '') + ' ' + (p.lastName || '')).trim();
                        } else if (p.email) {
                            name = p.email;
                        }
                    }
                    return { patientID: id, patientName: name };
                });

                // If current user is a patient, ensure their record is present in the dropdown.
                if ($scope.isUserPatient) {
                    var ownId = ($scope._ownPatientID !== undefined && $scope._ownPatientID !== null) ? parseInt($scope._ownPatientID, 10) : null;
                    if (ownId && $scope.patientArray.every(function (x) { return x.patientID !== ownId; })) {
                        // fetch own patient details and insert into patientArray
                        return RGDCWebApplicationService.getOwnPatientDetails()
                            .then(function (resp) {
                                var p = resp && resp.data ? resp.data : null;
                                if (p) {
                                    var id = (typeof p.patientID !== 'undefined' && p.patientID !== null) ? parseInt(p.patientID, 10) : ((typeof p.accID !== 'undefined') ? parseInt(p.accID, 10) : null);
                                    var name = p.patientName || ((p.firstName || '') + ' ' + (p.lastName || '')).trim() || p.email || ('Patient ' + id);
                                    if (id !== null && !isNaN(id)) {
                                        $scope.patientArray.push({ patientID: id, patientName: name });
                                    }
                                }
                                return $scope.patientArray;
                            }).catch(function (err) {
                                console.warn('Failed to fetch own patient details to ensure presence in patientArray', err);
                                return $scope.patientArray;
                            });
                    }
                }

                return $scope.patientArray;
            })
            .catch(function (err) {
                console.error('Failed to load patient list', err);
                $scope.patientArray = [];
                return $scope.patientArray;
            });
    };

    $scope.loadRequestedAppointments = function () {
        RGDCWebApplicationService.getRequestedAppointments()
            .then(function (response) {
                var data = response.data || [];
                if (!Array.isArray(data)) {
                    $scope.requestedAppointments = [];
                    $timeout(function () { initDataTableSafe('#adminRequestedAppointment', '_adminRequestedDataTableInstance'); }, 0);
                    return;
                }

                var mapped = data.map(function (a) {
                    var jsDate = parseJsonDateToJsDate(a.dateTime);
                    var dateStr = jsDate ? jsDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : (a.date || "");
                    var timeStr = jsDate ? jsDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : (a.time || "");

                    var status = (a.status || "");
                    // Prefer server-provided notes/remarks. For denied requests, always show denial remarks (includes reason).
                    var notes = "";
                    if (String(status).toLowerCase() === "denied") {
                        notes = a.remarks || a.notes || "";
                    } else {
                        // prefer returned notes field; fallback to building notes from requester/contact
                        notes = a.notes || a.remarks || "";
                        if (!notes || String(notes).trim() === "") {
                            var parts = [];
                            if (a.requesterName) parts.push("Requested by: " + a.requesterName + ".");
                            if (a.contactNumber) parts.push("In case of further questions kindly contact this number: " + a.contactNumber + ".");
                            notes = parts.join("\n");
                        }
                    }

                    return {
                        apptID: a.apptID,
                        date: dateStr,
                        time: timeStr,
                        purpose: a.purpose || a.reason || "",
                        notes: notes,
                        // show cleaned notes in the table (hide internal tokens like "RescheduleOf:")
                        remarks: notes,
                        dentistID: (typeof a.dentistID !== 'undefined' && a.dentistID !== null) ? parseInt(a.dentistID, 10) : null,
                        patientID: (typeof a.patientID !== 'undefined' && a.patientID !== null) ? parseInt(a.patientID, 10) : null,
                        dentistName: a.dentistName || "",
                        patientName: a.patientName || "",
                        contactNumber: a.contactNumber || null,
                        requesterName: a.requesterName || null,
                        status: status,
                        displayStatus: a.displayStatus || status || "",
                        createdBy: a.createdBy != null && a.createdBy !== undefined ? a.createdBy : null
                    };
                });

                $timeout(function () {
                    $scope.requestedAppointments = mapped;
                    try { if ($rootScope) $rootScope.requestedAppointments = mapped; } catch (e) { }
                    try { updateDashboardLists(); } catch (e) { }

                    try {
                        initDataTableSafe('#adminRequestedAppointment', '_adminRequestedDataTableInstance');
                    } catch (e) {
                        console.error('Failed to init admin requested DataTable:', e);
                    }
                }, 0);
            })
            .catch(function (err) {
                console.error('Failed to load requested appointments', err);
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

    // Ensure patient users create appointments for themselves (auto-select own patientID).
    // Called when opening the "Add New Appointment" modal and after successful creation resets.
    $scope.prepareNewAppointmentRequest = function () {
        try {
            $scope.newApptRequest = $scope.newApptRequest || {};
            $scope.currentPatient = $scope.currentPatient || { patientID: null, patientName: "" };

            // Ensure dropdown data exists (don't block UI on this)
            if (!Array.isArray($scope.dentistArray) || $scope.dentistArray.length === 0) {
                try { $scope.loadDentistList(); } catch (_) { }
            }
            if (!Array.isArray($scope.patientArray) || $scope.patientArray.length === 0) {
                try { $scope.loadPatientList(); } catch (_) { }
            }

            if ($scope.isUserPatient) {
                // If we already resolved it, use cached ID immediately
                if ($scope._ownPatientID != null && !isNaN(parseInt($scope._ownPatientID, 10))) {
                    var oid = parseInt($scope._ownPatientID, 10);
                    $scope.newApptRequest.patientID = oid;
                    $scope.currentPatient.patientID = oid;
                    // Best-effort display name from already-loaded patientArray
                    try {
                        var match = ($scope.patientArray || []).find(function (p) { return parseInt(p.patientID, 10) === oid; });
                        if (match && match.patientName) $scope.currentPatient.patientName = match.patientName;
                    } catch (_) { }
                    $timeout(function () { try { $scope.updateTimeOptions(); } catch (_) { } }, 0);
                    return;
                }

                // Otherwise resolve from server (safe even if called multiple times)
                RGDCWebApplicationService.getOwnPatientDetails()
                    .then(function (resp) {
                        var p = resp && resp.data ? resp.data : null;
                        var own = p ? (p.patientID || p.accID || null) : null;
                        own = own != null ? parseInt(own, 10) : null;
                        if (own != null && !isNaN(own)) {
                            $scope._ownPatientID = own;
                            $timeout(function () {
                                $scope.newApptRequest = $scope.newApptRequest || {};
                                $scope.newApptRequest.patientID = own;
                                $scope.currentPatient = $scope.currentPatient || { patientID: null, patientName: "" };
                                $scope.currentPatient.patientID = own;
                                // ensure patient exists in patientArray so ng-options can match
                                $scope.patientArray = $scope.patientArray || [];
                                if (!$scope.patientArray.some(function (x) { return parseInt(x.patientID, 10) === own; })) {
                                    var name = (p && (p.patientName || ((p.firstName || '') + ' ' + (p.lastName || '')).trim() || p.email)) || ('Patient ' + own);
                                    $scope.patientArray.push({ patientID: own, patientName: name });
                                }
                                // Update display name (prefer server-provided)
                                try {
                                    var display = (p && (p.patientName || ((p.firstName || '') + ' ' + (p.lastName || '')).trim() || p.email)) || "";
                                    if (!display) {
                                        var m2 = ($scope.patientArray || []).find(function (x) { return parseInt(x.patientID, 10) === own; });
                                        display = m2 ? (m2.patientName || "") : "";
                                    }
                                    $scope.currentPatient.patientName = display || ('Patient ' + own);
                                } catch (_) { }
                                try { $scope.updateTimeOptions(); } catch (_) { }
                            }, 0);
                        }
                    })
                    .catch(function (_) { /* best-effort */ });
            } else {
                $timeout(function () { try { $scope.updateTimeOptions(); } catch (_) { } }, 0);
            }
        } catch (_) { }
    };

    $scope.newApptSubmitted = false;
    $scope.newApptValid = {
        patientID: true,
        dentistID: true,
        dateTime: true,
        time: true,
        reason: true,
        contactNumber: true
    };

    $scope.validateNewApptRequest = function () {
        try {
            $scope.newApptRequest = $scope.newApptRequest || {};
            var r = ($scope.newApptRequest.reason || '').toString().trim();
            var contact = ($scope.newApptRequest.contactNumber || '').toString().trim();
            $scope.newApptValid.patientID = !!$scope.newApptRequest.patientID;
            $scope.newApptValid.dentistID = !!$scope.newApptRequest.dentistID;
            $scope.newApptValid.dateTime = !!$scope.newApptRequest.dateTime;
            $scope.newApptValid.time = !!$scope.newApptRequest.time;
            $scope.newApptValid.reason = r.length >= 3;
            // optional contact: if provided, must match PH mobile pattern
            $scope.newApptValid.contactNumber = !contact || /^09\d{9}$/.test(contact);
            return $scope.newApptValid.patientID && $scope.newApptValid.dentistID && $scope.newApptValid.dateTime &&
                $scope.newApptValid.time && $scope.newApptValid.reason && $scope.newApptValid.contactNumber;
        } catch (_) {
            return false;
        }
    };

    // Dashboard lists (per-account view)
    $scope.dashboardRequested = [];
    $scope.dashboardScheduled = [];

    function updateDashboardLists() {
        try {
            $scope.dashboardRequested = Array.isArray($scope.requestedAppointments) ? $scope.requestedAppointments.slice(0) : [];

            var all = Array.isArray($scope.adminAppointments) ? $scope.adminAppointments : [];
            var auth = String($scope.currentUserAuthorization || "");
            var perm = String($scope.currentUserPermission || "");

            // Superadmin/Owner: show all upcoming scheduled (limit to 10)
            if (auth === "0" || auth === "1") {
                $scope.dashboardScheduled = all.slice(0, 10);
                return;
            }

            // Dentist: filter by numeric dentistID
            if (auth === "2" && perm === "1") {
                var did = ($scope.currentDentist && $scope.currentDentist.dentistID) ? parseInt($scope.currentDentist.dentistID, 10) : null;
                if (did) {
                    $scope.dashboardScheduled = all.filter(function (a) { return a.dentistID === did; });
                } else {
                    $scope.dashboardScheduled = [];
                }
                return;
            }

            // Patient: filter by numeric patientID (try _ownPatientID or fall back to currentUserFullName)
            if (auth === "2" && perm === "3") {
                var pid = ($scope._ownPatientID !== undefined && $scope._ownPatientID !== null) ? parseInt($scope._ownPatientID, 10) : null;
                if (pid) {
                    $scope.dashboardScheduled = all.filter(function (a) { return a.patientID === pid; });
                } else {
                    var pname = $scope.currentUserFullName || "";
                    $scope.dashboardScheduled = all.filter(function (a) { return a.patientName === pname; });
                }
                return;
            }

            // other roles (admin/staff): show first 10
            $scope.dashboardScheduled = all.slice(0, 10);
        } catch (e) {
            console.error('updateDashboardLists error', e);
            $scope.dashboardRequested = $scope.dashboardRequested || [];
            $scope.dashboardScheduled = $scope.dashboardScheduled || [];
        }
    }

    $scope.createNewAppointmentRequest = function () {
        $scope.newApptSubmitted = true;
        if (!$scope.validateNewApptRequest()) {
            // keep existing Swal missing-fields UX, but now users also see inline hints
        }
        // normalize any id value (number, numeric-string or object) to integer or null
        function toNumericId(v) {
            if (v === null || typeof v === 'undefined') return null;
            if (typeof v === 'object') {
                v = v.patientID || v.dentistID || v.id || v.accID || v.value || null;
            }
            var n = parseInt(v, 10);
            return isNaN(n) ? null : n;
        }

        $scope.newApptRequest = $scope.newApptRequest || {};
        // coerce models to numeric ids (keeps ng-model in sync)
        var patientId = toNumericId($scope.newApptRequest.patientID);
        var dentistId = toNumericId($scope.newApptRequest.dentistID);
        $scope.newApptRequest.patientID = patientId;
        $scope.newApptRequest.dentistID = dentistId;

        // debug log to help diagnose client-side binding issues
        console.debug('createNewAppointmentRequest values:', {
            patientID: $scope.newApptRequest.patientID,
            dentistID: $scope.newApptRequest.dentistID,
            dateTime: $scope.newApptRequest.dateTime,
            time: $scope.newApptRequest.time,
            reason: $scope.newApptRequest.reason
        });

        // If patient user didn't supply patientID (they are creating for themselves), fetch own patientID
        if ((!patientId || patientId === null) && $scope.isUserPatient) {
            if ($scope._resolvingOwnPatientID) return;
            $scope._resolvingOwnPatientID = true;
            RGDCWebApplicationService.getOwnPatientDetails().then(function (resp) {
                $scope._resolvingOwnPatientID = false;
                var own = resp && resp.data ? (resp.data.patientID || resp.data.accID || null) : null;
                own = toNumericId(own);
                if (own) {
                    $scope.newApptRequest.patientID = own;
                    $scope._ownPatientID = own;
                    // ensure patient exists in patientArray for select matching
                    $timeout(function () {
                        $scope.patientArray = $scope.patientArray || [];
                        if (!$scope.patientArray.some(function (p) { return toNumericId(p.patientID) === own; })) {
                            var name = resp.data.patientName || ((resp.data.firstName || '') + ' ' + (resp.data.lastName || '')).trim() || resp.data.email || ('Patient ' + own);
                            $scope.patientArray.push({ patientID: own, patientName: name });
                        }
                    }, 0);
                    // continue now that patientID is set
                    $scope.createNewAppointmentRequest();
                    return;
                }
                Swal.fire({ icon: "error", title: "Error", text: "Unable to determine patient record." });
            }).catch(function (err) {
                $scope._resolvingOwnPatientID = false;
                console.error('Failed to load own patient details', err);
                Swal.fire({ icon: "error", title: "Error", text: "Unable to determine patient record." });
            });
            return;
        }

        var hasPatient = ($scope.newApptRequest.patientID !== null && typeof $scope.newApptRequest.patientID !== 'undefined');
        var hasDentist = ($scope.newApptRequest.dentistID !== null && typeof $scope.newApptRequest.dentistID !== 'undefined');
        var hasDate = !!$scope.newApptRequest.dateTime;
        var hasReason = !!$scope.newApptRequest.reason;
        var hasTime = !!$scope.newApptRequest.time;

        if (!hasPatient || !hasDentist || !hasDate || !hasReason || !hasTime) {
            var missing = [];
            if (!hasPatient) missing.push('Patient');
            if (!hasDentist) missing.push('Dentist');
            if (!hasDate) missing.push('Date');
            if (!hasTime) missing.push('Time');
            if (!hasReason) missing.push('Purpose');

            Swal.fire({
                icon: "error",
                title: "Missing Fields",
                text: "Please fill in required fields: " + missing.join(', ') + "."
            });
            return;
        }

        // Parse date/time into a Date object
        var dateTimeStr = $scope.newApptRequest.dateTime;
        var timeStr = $scope.newApptRequest.time || "12:00 AM";
        var dateObj = (typeof dateTimeStr === 'string') ? new Date(dateTimeStr) : new Date(dateTimeStr);
        if (isNaN(dateObj.getTime())) {
            Swal.fire({ icon: "error", title: "Invalid Date", text: "Please select a valid date." });
            return;
        }

        var tMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (!tMatch) {
            Swal.fire({ icon: "error", title: "Invalid Time", text: "Please select a valid time." });
            return;
        }
        var hours = parseInt(tMatch[1], 10);
        var minutes = parseInt(tMatch[2], 10);
        var mer = tMatch[3] ? tMatch[3].toUpperCase() : '';
        if (mer) {
            if (mer === 'PM' && hours !== 12) hours += 12;
            if (mer === 'AM' && hours === 12) hours = 0;
        }
        dateObj.setHours(hours, minutes, 0, 0);

        // Re-check availability and create request
        RGDCWebApplicationService.getAdminScheduledAppointments()
            .then(function (resp) {
                var remote = resp && resp.data ? (Array.isArray(resp.data) ? resp.data : []) : [];
                var dentistNum = toNumericId($scope.newApptRequest.dentistID);
                var conflict = remote.some(function (a) {
                    var aDate = parseJsonDateToJsDate(a.dateTime);
                    if (!aDate) return false;
                    var aDent = toNumericId(a.dentistID || a.accID || a.id);
                    if (aDent !== null && !isNaN(aDent) && aDent !== dentistNum) return false;
                    return aDate.getFullYear() === dateObj.getFullYear() &&
                        aDate.getMonth() === dateObj.getMonth() &&
                        aDate.getDate() === dateObj.getDate() &&
                        aDate.getHours() === dateObj.getHours() &&
                        aDate.getMinutes() === dateObj.getMinutes();
                });

                if (conflict) {
                    Swal.fire({ icon: 'error', title: 'Time Taken', text: 'The selected time is no longer available. Please choose another slot.' });
                    $scope.loadAdminScheduledAppointments();
                    return;
                }

                var appointmentData = {
                    patientID: parseInt($scope.newApptRequest.patientID, 10),
                    dentistID: parseInt($scope.newApptRequest.dentistID, 10),
                    dateTime: dateObj,
                    reason: $scope.newApptRequest.reason,
                    contactNumber: $scope.newApptRequest.contactNumber || null,
                    requesterName: $scope.currentUserFullName || null,
                    notes: $scope.newApptRequest.notes || null
                };

                RGDCWebApplicationService.createAppointmentRequest(appointmentData)
                    .then(function (response) {
                        if (response.data && response.data.success) {
                            Swal.fire({
                                icon: "success",
                                title: "Success!",
                                text: "Appointment request created successfully and sent to the recipient."
                            }).then(function () {
                                // Reset fields, but keep patient auto-selected for patient users
                                var keepPatientId = ($scope.isUserPatient && $scope._ownPatientID != null && !isNaN(parseInt($scope._ownPatientID, 10)))
                                    ? parseInt($scope._ownPatientID, 10)
                                    : null;
                                $scope.newApptRequest = { patientID: keepPatientId, dentistID: null, dateTime: null, reason: "" };
                                $scope.newApptRequest.time = null;
                                var modal = findModalElement(['modalAddAppt', 'modal-add-appt', 'modalAddAppt']);
                                if (modal && typeof M !== 'undefined' && M.Modal) {
                                    var inst = M.Modal.getInstance(modal);
                                    if (inst) inst.close();
                                }
                                $scope.loadRequestedAppointments();
                            });
                        } else {
                            Swal.fire({
                                icon: "error",
                                title: "Error",
                                text: response.data && response.data.message ? response.data.message : "Failed to create appointment request."
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
            })
            .catch(function (err) {
                console.error('Failed to re-check availability', err);
                Swal.fire({ icon: 'error', title: 'Error', text: 'Unable to check availability. Please try again.' });
            });
    };

    $scope.acceptRequestedAppointment = function (apptID) {
        if (!apptID) return Swal.fire({ icon: 'error', title: 'Error', text: 'No appointment selected.' });
        Swal.fire({
            title: 'Accept Appointment',
            text: 'Are you sure you want to accept this requested appointment?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Accept'
        }).then(function (res) {
            if (!res.isConfirmed) return;
            Swal.fire({ title: 'Processing...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            RGDCWebApplicationService.acceptAppointment({ apptID: apptID })
                .then(function (resp) {
                    Swal.close();
                    if (resp && resp.data && resp.data.success) {
                        Swal.fire({ icon: 'success', title: 'Accepted', text: resp.data.message || 'Appointment accepted.' }).then(function () {
                            $scope.loadAdminScheduledAppointments();
                            $scope.loadRequestedAppointments();
                        });
                    } else {
                        Swal.fire({ icon: 'error', title: 'Error', text: (resp && resp.data && resp.data.message) || 'Failed to accept appointment.' });
                    }
                })
                .catch(function (err) {
                    Swal.close();
                    console.error('Accept appointment error:', err);
                    Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred while accepting the appointment.' });
                });
        });
    };

    $scope.denyRequestedAppointment = function (apptID) {
        if (!apptID) return Swal.fire({ icon: 'error', title: 'Error', text: 'No appointment selected.' });

        // First confirm intention then prompt for reason in single dialog (Swal supports input)
        Swal.fire({
            title: 'Deny Appointment',
            input: 'textarea',
            inputLabel: 'Reason for denying this appointment (required)',
            inputPlaceholder: 'Enter reason (this will be sent to the requester)',
            showCancelButton: true,
            confirmButtonText: 'Deny Appointment',
            preConfirm: (value) => {
                if (!value || value.trim().length === 0) {
                    Swal.showValidationMessage('A reason is required.');
                    return false;
                }
                return value.trim();
            }
        }).then(function (result) {
            if (!result.isConfirmed) return;
            var reason = (result.value || '').trim();
            Swal.fire({ title: 'Processing...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

            RGDCWebApplicationService.denyAppointment({ apptID: apptID, reason: reason })
                .then(function (resp) {
                    Swal.close();
                    if (resp && resp.data && resp.data.success) {
                        Swal.fire({ icon: 'success', title: 'Denied', text: resp.data.message || 'Appointment denied.' }).then(function () {
                            $scope.loadRequestedAppointments();
                            $scope.loadAdminScheduledAppointments();
                            $scope.loadPastAppointments();
                        });
                    } else {
                        Swal.fire({ icon: 'error', title: 'Error', text: (resp && resp.data && resp.data.message) || 'Failed to deny appointment.' });
                    }
                })
                .catch(function (err) {
                    Swal.close();
                    console.error('Deny appointment error:', err);
                    Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred while denying the appointment.' });
                });
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

        if ($scope.selectedPatientID === null && $scope.selectedDentistID === null) {
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

        $scope.paymentDue = $scope.paymentCost - ($scope.paymentPaid || 0);

        var paymentData = {
            patientID: $scope.selectedPatientID,
            dentistID: $scope.selectedDentistID,
            paymentMethod: $scope.paymentMethod,
            procedures: $scope.paymentProcedures,
            toothNumber: $scope.paymentToothNumber,
            reference: $scope.paymentReference,
            cost: parseFloat($scope.paymentCost) || 0,
            paymentDate: $scope.paymentDate,
            paid: parseFloat($scope.paymentPaid) || 0,
            balance: parseFloat($scope.paymentDue) || 0,
            description: $scope.paymentDescription,
            createdBy: $scope.currentUserID
        };


        $scope.addSubmitted = true;

        if ($scope.selectedPatient === null || $scope.selectedDentist === null || !$scope.paymentDate ||
            !$scope.paymentMethod || !$scope.paymentCost || $scope.paymentDue === null ||
            $scope.paymentPaid === null) {
            return;
        }
        if (parseFloat($scope.paymentDue) < 0) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Amount',
                text: 'Total amount due should not go below 0.',
                confirmButtonColor: '#795548'
            });
            return;
        }

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


        if (!$scope.paymentInfo.cost) {
            Swal.fire({ icon: "error", title: "Error", text: "Input payment cost." });
            return;
        }

        $scope.paymentInfo.balance = $scope.paymentInfo.cost - ($scope.paymentInfo.paid || 0)

        if ($scope.paymentInfo.balance < 0) {
            Swal.fire({ icon: 'error', title: 'Invalid Inputs', text: 'Payment should not be greater than the cost.' });
            return;
        }

        var data = {
            paymentID: $scope.paymentInfo.paymentID,
            paymentMethod: $scope.paymentInfo.paymentMethod,
            cost: $scope.paymentInfo.cost,
            paymentDate: $scope.paymentInfo.paymentDate,
            paid: $scope.paymentInfo.paid,
            balance: $scope.paymentInfo.balance,
            reference: $scope.paymentInfo.reference,
            toothNumber: $scope.paymentInfo.toothNumber,
            procedures: $scope.paymentInfo.procedures,
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
        console.log($scope.addPatient_firstName && $scope.addPatient_lastName && $scope.addPatient_genderID && $scope.addPatient_birthDate && $scope.addPatient_email && $scope.addPatient_contactNumber && $scope.addPatient_civilStatus)
        if ($scope.addPatient_firstName && $scope.addPatient_lastName && $scope.addPatient_genderID && $scope.addPatient_birthDate && $scope.addPatient_email && $scope.addPatient_contactNumber && $scope.addPatient_civilStatus) {
            var accountData = {
                firstName: $scope.addPatient_firstName,
                middleName: $scope.addPatient_middleName,
                lastName: $scope.addPatient_lastName,
                genderID: $scope.addPatient_genderID,
                birthDate: birthDate,
                email: $scope.addPatient_email,
                contactNumber: $scope.addPatient_contactNumber,
                line1: $scope.addPatient_line1,
                line2: $scope.addPatient_line2,
                state: $scope.addPatient_state,
                country: $scope.addPatient_country,
                city: $scope.addPatient_city,
                postal: $scope.addPatient_postal,
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
                        Swal.fire({ icon: 'success', title: 'Add Patient', text: 'Successfully added new patient.' }).then((result) => {
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
                        yearRange: [new Date().getFullYear(), new Date().getFullYear() + 3],
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

        var pollTimer = null;
        var messageHandler = function (e) {
            if (!e.data || e.data.type !== 'google-auth-success') return;
            if (e.origin && window.location.origin && e.origin !== window.location.origin) return;

            if (pollTimer) {
                try { clearInterval(pollTimer); } catch (ePoll) { }
                pollTimer = null;
            }
            window.removeEventListener('message', messageHandler);

            // refresh UI state from server ($http already runs inside a digest — do not call $scope.$apply here)
            RGDCWebApplicationService.getSessionVariable()
                .then(function (resp) {
                    var d = resp && resp.data ? resp.data : {};
                    $timeout(function () {
                        $scope.googleConnected = !!d.googleRefreshTokenPresent;
                        $scope.googleCalendarEnabled = !!d.googleCalendarEnabled;
                        if ($scope.googleConnected && !$scope.googleCalendarEnabled) {
                            $scope.googleCalendarEnabled = true;
                        }
                        Swal.fire({
                            icon: 'success',
                            title: 'Google Calendar connected',
                            text: 'Your active scheduled appointments have been synced to Google Calendar.',
                            timer: 3200,
                            showConfirmButton: true
                        });
                    }, 0);
                })
                .catch(function () {
                    $timeout(function () {
                        $scope.googleConnected = true;
                        $scope.googleCalendarEnabled = true;
                    }, 0);
                });

            try { popup.close(); } catch (err) { }
        };

        window.addEventListener('message', messageHandler);

        // If the user closes the popup without finishing OAuth, drop the listener
        pollTimer = setInterval(function () {
            try {
                if (popup.closed) {
                    if (pollTimer) clearInterval(pollTimer);
                    pollTimer = null;
                    window.removeEventListener('message', messageHandler);
                }
            } catch (e) {
                if (pollTimer) clearInterval(pollTimer);
                pollTimer = null;
            }
        }, 800);
    };

    /** Checkbox: enable sync only when Google is connected; disable asks for confirmation (disconnect). */
    $scope.onGoogleCalendarCheckboxClick = function ($event) {
        if ($event) {
            $event.preventDefault();
            $event.stopPropagation();
        }
        if ($scope.googleCalendarEnabled) {
            Swal.fire({
                title: 'Disconnect Google Calendar?',
                html: 'Turning this off will stop saving appointments to Google and will remove the stored Google connection for this account.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, disconnect',
                cancelButtonText: 'Cancel'
            }).then(function (result) {
                if (!result.isConfirmed) return;
                $scope.toggleGoogleCalendar(false);
            });
            return;
        }
        if (!$scope.googleConnected) {
            Swal.fire({
                icon: 'info',
                title: 'Connect Google first',
                text: 'Use the Connect Google button to sign in, then you can turn on calendar sync.'
            });
            return;
        }
        $scope.toggleGoogleCalendar(true);
    };

    $scope.toggleGoogleCalendar = function (enabled) {
        RGDCWebApplicationService.toggleGoogleCalendar(enabled)
            .then(function (resp) {
                if (resp.data && resp.data.success) {
                    $timeout(function () {
                        $scope.googleCalendarEnabled = enabled;
                        if (!enabled) {
                            $scope.googleConnected = false;
                        }
                    }, 0);
                } else {
                    Swal.fire({ icon: 'error', title: 'Error', text: (resp.data && resp.data.message) ? resp.data.message : 'Failed to toggled Google calendar sync.' });
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

            $timeout(function () {
                try {
                    initClinicStaffTables();
                } catch (e) {
                    console.warn('initClinicStaffTables failed', e);
                }
            }, 0);
        });
    }

    function initClinicStaffTables() {
        if (typeof window.DataTable !== 'function') return;

        var cfg = {
            searchable: true,
            fixedHeight: false,
            perPage: 10,
            perPageSelect: [5, 10, 25, 50],
            labels: {
                placeholder: "Search...",
                perPage: "{select} entries per page",
                noRows: "No rows found",
                info: "Showing {start} to {end} of {rows} entries"
            }
        };

        function reinit(selector, key) {
            try {
                if (window[key] && typeof window[key].destroy === 'function') {
                    window[key].destroy();
                }
            } catch (_) { }

            var el = null;
            try { el = document.querySelector(selector); } catch (_) { el = null; }
            if (!el) return;

            window[key] = new DataTable(selector, cfg);
        }

        reinit('#adminClinicStaffTabTableOwner', '_adminClinicStaffOwnerDT');
        reinit('#adminClinicStaffTabTableDentist', '_adminClinicStaffDentistDT');
        reinit('#adminClinicStaffTabTableStaff', '_adminClinicStaffStaffDT');
        reinit('#adminClinicStaffTabTablePending', '_adminClinicStaffPendingDT');
    }
    $scope.addOwner = function () {
        var ownerEmail = {
            email: $scope.owner_email
        }
        var addOwner = RGDCWebApplicationService.addOwner(ownerEmail);
        addOwner.then(function (returnedData) {
            if (returnedData.data.success) {
                Swal.fire({ icon: 'success', title: 'Owner signup initiated!', text: 'They may signup with their email.' });
            } else {
                Swal.fire({ icon: 'error', title: 'A problem occurred...', text: returnedData.data.message });
            }
        });
    }

    $scope.addStaff = function () {
        var staffEmail = {
            email: $scope.staff_email
        }
        var addStaff = RGDCWebApplicationService.addStaff(staffEmail);
        addStaff.then(function (returnedData) {
            if (returnedData.data.success) {
                Swal.fire({ icon: 'success', title: 'Staff signup initiated!', text: 'They may signup with their email.' });
            } else {
                Swal.fire({ icon: 'error', title: 'A problem occurred...', text: returnedData.data.message });
            }
        });
    }

    $scope.addDentist = function () {
        var dentistEmail = {
            email: $scope.dentist_email
        }
        console.log(dentistEmail)
        var addDentist = RGDCWebApplicationService.addDentist(dentistEmail);
        addDentist.then(function (returnedData) {
            if (returnedData.data.success) {
                Swal.fire({ icon: 'success', title: 'Dentist signup initiated!', text: 'They may signup with their email.' });
            } else {
                Swal.fire({ icon: 'error', title: 'A problem occurred...', text: returnedData.data.message });
            }
        });
    }

    //$scope.signUpOwner = function () {
    //    // validate format / duplicate one more time
    //    if (!isValidEmailFormat($scope.owner_email)) {
    //        Swal.fire({ icon: 'error', title: 'Invalid Email', text: 'Please enter a valid email (must contain @, no spaces).' });
    //        return;
    //    }
    //    if ($scope.ownerEmailTaken) {
    //        Swal.fire({ icon: 'error', title: 'Email Taken', text: 'Email is already taken.' });
    //        return;
    //    }

    //    var accountData = {
    //        firstName: $scope.owner_firstName,
    //        middleName: $scope.owner_middleName,
    //        lastName: $scope.owner_lastName,
    //        email: $scope.owner_email,
    //        genderID: $scope.owner_genderID,
    //        contactNumber: $scope.owner_contactNumber,
    //        nationality: $scope.owner.nationality,
    //        religion: $scope.owner.religion,
    //        birthDate: $scope.owner_birthDate,
    //        civilStatus: $scope.owner_civilStatus,
    //        address: $scope.owner_address,
    //        role: 0,
    //        photoLink: $scope.ownerUploadedPhotoPath || null
    //    };
    //    var addOwner = RGDCWebApplicationService.addAccount(accountData);
    //    addOwner.then(function (returnedData) {
    //        var ownerData = {
    //            accID: returnedData.data.accID,
    //            specialization: $scope.owner_specialization,
    //        }
    //        var addOwnerAcc = RGDCWebApplicationService.addOwner(ownerData);
    //        addOwnerAcc.then(function (returnedData) {
    //            if (returnedData.data.success) {
    //                Swal.fire({ icon: 'success', title: 'Add Owner', text: 'Successfully added new owner.' }).then((result) => {
    //                    if (result.isConfirmed) {
    //                        window.location.href = "/RGDC/adminClinicStaffTab";
    //                        afterUpdate();
    //                    }
    //                });
    //            } else {
    //                Swal.fire({ icon: 'Error', title: 'Add Owner', text: 'Cannot add new owner.' })
    //            }
    //        })
    //    });
    //}

    //$scope.signUpDentist = function () {
    //    if (!isValidEmailFormat($scope.dentist_email)) {
    //        Swal.fire({ icon: 'error', title: 'Invalid Email', text: 'Please enter a valid email (must contain @, no spaces).' });
    //        return;
    //    }
    //    if ($scope.dentistEmailTaken) {
    //        Swal.fire({ icon: 'error', title: 'Email Taken', text: 'Email is already taken.' });
    //        return;
    //    }

    //    var accountData = {
    //        firstName: $scope.dentist_firstName,
    //        middleName: $scope.dentist_middleName,
    //        lastName: $scope.dentist_lastName,
    //        email: $scope.dentist_email,
    //        genderID: $scope.dentist_genderID,
    //        contactNumber: $scope.dentist_contactNumber,
    //        nationality: $scope.dentist.nationality,
    //        religion: $scope.dentist.religion,
    //        birthDate: $scope.dentist_birthDate,
    //        civilStatus: $scope.dentist_civilStatus,
    //        address: $scope.dentist_address,
    //        role: 1,
    //        photoLink: $scope.dentistUploadedPhotoPath || null
    //    };

    //    var addDentist = RGDCWebApplicationService.addAccount(accountData);
    //    addDentist.then(function (returnedData) {
    //        var dentistData = {
    //            accID: returnedData.data.accID,
    //            specialization: $scope.dentist_specialization,
    //            branchID: $scope.dentist_branchID
    //        }
    //        var addDentistAcc = RGDCWebApplicationService.addDentist(dentistData);
    //        addDentistAcc.then(function (returnedData) {
    //            if (returnedData.data.success) {
    //                Swal.fire({ icon: 'success', title: 'Add Dentist', text: 'Successfully added new dentist.' }).then((result) => {
    //                    if (result.isConfirmed) {
    //                        window.location.href = "/RGDC/adminClinicStaffTab";
    //                        afterUpdate();
    //                    }
    //                });
    //            } else {
    //                Swal.fire({ icon: 'Error', title: 'Add Owner', text: 'Cannot add new owner.' })
    //            }
    //        })
    //    });
    //}

    //$scope.signUpStaff = function () {
    //    if (!isValidEmailFormat($scope.staff_email)) {
    //        Swal.fire({ icon: 'error', title: 'Invalid Email', text: 'Please enter a valid email (must contain @, no spaces).' });
    //        return;
    //    }
    //    if ($scope.staffEmailTaken) {
    //        Swal.fire({ icon: 'error', title: 'Email Taken', text: 'Email is already taken.' });
    //        return;
    //    }

    //    var accountData = {
    //        firstName: $scope.staff_firstName,
    //        middleName: $scope.staff_middleName,
    //        lastName: $scope.staff_lastName,
    //        email: $scope.staff_email,
    //        genderID: $scope.staff_genderID,
    //        contactNumber: $scope.staff_contactNumber,
    //        birthDate: $scope.staff_birthDate,
    //        nationality: $scope.nationality.nationality,
    //        religion: $scope.nationality.religion,
    //        civilStatus: $scope.staff_civilStatus,
    //        address: $scope.staff_address,
    //        role: 2,
    //        photoLink: $scope.staffUploadedPhotoPath || null
    //    };

    //    var addStaff = RGDCWebApplicationService.addAccount(accountData);
    //    addStaff.then(function (returnedData) {
    //        var staffData = {
    //            accID: returnedData.data.accID,
    //            staffRole: $scope.staff_staffRole,
    //            branchID: $scope.staff_branchID
    //        }
    //        var addStaffAcc = RGDCWebApplicationService.addStaff(staffData);
    //        addStaffAcc.then(function (returnedData) {
    //            if (returnedData.data.success) {
    //                Swal.fire({ icon: 'success', title: 'Add Staff', text: 'Successfully added new staff.' }).then((result) => {
    //                    if (result.isConfirmed) {
    //                        window.location.href = "/RGDC/adminClinicStaffTab";
    //                        afterUpdate();
    //                    }
    //                });
    //            } else {
    //                Swal.fire({ icon: 'Error', title: 'Add Staff', text: 'Cannot add new Staff.' })
    //            }
    //        })
    //    });
    //}

    $scope.selectArchiveOwner = function (accID) {
        $scope.accArchived = accID;
    }

    $scope.archiveOwner = function () {
        var ownerAcc = {
            accID: $scope.accArchived
        }
        var deleteOwner = RGDCWebApplicationService.deleteOwner(ownerAcc);
        deleteOwner.then(function (returnedData) {
            if (returnedData.data.success) {
                Swal.fire({ icon: 'success', title: 'Archive Owner', text: 'Successfully archived owner account.' }).then((result) => {
                    if (result.isConfirmed) {

                        window.location.href = "/RGDC/adminClinicStaffTab";
                        afterUpdate();
                    }

                });
            }
        });
    }
    $scope.selectArchiveStaff = function (accID) {
        $scope.accArchived = accID;
    }

    $scope.archiveStaff = function () {
        var staffAcc = {
            accID: $scope.accArchived
        }
        var deleteStaff = RGDCWebApplicationService.deleteStaff(staffAcc);
        deleteStaff.then(function (returnedData) {
            if (returnedData.data.success) {
                Swal.fire({ icon: 'success', title: 'Archive Staff', text: 'Successfully archived staff account.' }).then((result) => {
                    if (result.isConfirmed) {

                        window.location.href = "/RGDC/adminClinicStaffTab";
                        afterUpdate();
                    }

                });
            }
        });
    }

    $scope.selectArchiveDentist = function (accID) {
        $scope.accArchived = accID;
    }

    $scope.archiveDentist = function () {
        var dentistAcc = {
            accID: $scope.accArchived
        }
        var deleteDentist = RGDCWebApplicationService.deleteDentist(dentistAcc);
        deleteDentist.then(function (returnedData) {
            if (returnedData.data.success) {
                Swal.fire({ icon: 'success', title: 'Archive dentist', text: 'Successfully archived dentist account.' }).then((result) => {
                    if (result.isConfirmed) {

                        window.location.href = "/RGDC/adminClinicStaffTab";
                        afterUpdate();
                    }

                });
            }
        });
    }

    $scope.selectOwner = function (ownerID) {
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

    $scope.getStaffData = function () {
        RGDCWebApplicationService.getStaffData()
            .then(function (returnedData) {
                $scope.staff = returnedData.data;
                $scope.staff.birthDate = formatDateToMDY($scope.staff.birthDate);
            });
    }

    $scope.getOwnerData = function () {
        RGDCWebApplicationService.getOwnerData()
            .then(function (returnedData) {
                $scope.owner = returnedData.data;
                $scope.owner.birthDate = formatDateToMDY($scope.owner.birthDate);
            });
    }
    $scope.getDentistData = function () {
        RGDCWebApplicationService.getDentistData()
            .then(function (returnedData) {
                $scope.dentist = returnedData.data;
                $scope.dentist.birthDate = formatDateToMDY($scope.dentist.birthDate);

                // Split address into parts for the profile modal (best-effort)
                try {
                    var addr = ($scope.dentist && $scope.dentist.address) ? String($scope.dentist.address) : '';
                    var parts = addr.split(',').map(function (p) { return p.trim(); }).filter(Boolean);
                    $scope.dentistAddress_houseNo = parts[0] || '';
                    $scope.dentistAddress_street = parts[1] || '';
                    $scope.dentistAddress_barangay = parts[2] || '';
                    $scope.dentistAddress_city = parts[3] || '';
                    $scope.dentistAddress_province = parts[4] || '';
                } catch (_) { }
            });
    }

    $scope.syncDentistAddress = function () {
        try {
            var parts = [
                $scope.dentistAddress_houseNo,
                $scope.dentistAddress_street,
                $scope.dentistAddress_barangay,
                $scope.dentistAddress_city,
                $scope.dentistAddress_province
            ].map(function (p) { return (p || '').toString().trim(); }).filter(Boolean);
            $scope.dentist = $scope.dentist || {};
            $scope.dentist.address = parts.join(', ');
        } catch (_) { }
    };

    function dentistScheduleDefaultTime(h, m) {
        return new Date(1970, 0, 1, h, m, 0, 0);
    }

    function dentistScheduleApiTimeToDate(v) {
        if (v instanceof Date && !isNaN(v.getTime())) return v;
        if (typeof v === 'string') {
            var hhmm = formatTimeToHHMM(v);
            if (!hhmm) return null;
            var p = hhmm.split(':');
            return dentistScheduleDefaultTime(parseInt(p[0], 10), parseInt(p[1], 10));
        }
        if (v && typeof v === 'object') {
            if (typeof v.TotalMilliseconds !== 'undefined') {
                var totalMin = Math.floor(v.TotalMilliseconds / 60000);
                var hh = Math.floor(totalMin / 60) % 24;
                var mm = totalMin % 60;
                return dentistScheduleDefaultTime(hh, mm);
            }
            if (typeof v.Hours !== 'undefined' && typeof v.Minutes !== 'undefined') {
                return dentistScheduleDefaultTime(parseInt(v.Hours, 10) || 0, parseInt(v.Minutes, 10) || 0);
            }
        }
        return null;
    }

    $scope._initDentistScheduleDays = function () {
        if (!$scope.dentistScheduleDays || !Array.isArray($scope.dentistScheduleDays)) {
            $scope.dentistScheduleDays = [
                { dayOfWeek: 0, dayName: 'Sunday', enabled: false, startTime: dentistScheduleDefaultTime(8, 0), endTime: dentistScheduleDefaultTime(12, 0), slotMinutes: 30 },
                { dayOfWeek: 1, dayName: 'Monday', enabled: false, startTime: dentistScheduleDefaultTime(8, 0), endTime: dentistScheduleDefaultTime(12, 0), slotMinutes: 30 },
                { dayOfWeek: 2, dayName: 'Tuesday', enabled: false, startTime: dentistScheduleDefaultTime(8, 0), endTime: dentistScheduleDefaultTime(12, 0), slotMinutes: 30 },
                { dayOfWeek: 3, dayName: 'Wednesday', enabled: false, startTime: dentistScheduleDefaultTime(8, 0), endTime: dentistScheduleDefaultTime(12, 0), slotMinutes: 30 },
                { dayOfWeek: 4, dayName: 'Thursday', enabled: false, startTime: dentistScheduleDefaultTime(8, 0), endTime: dentistScheduleDefaultTime(12, 0), slotMinutes: 30 },
                { dayOfWeek: 5, dayName: 'Friday', enabled: false, startTime: dentistScheduleDefaultTime(8, 0), endTime: dentistScheduleDefaultTime(12, 0), slotMinutes: 30 },
                { dayOfWeek: 6, dayName: 'Saturday', enabled: false, startTime: dentistScheduleDefaultTime(8, 0), endTime: dentistScheduleDefaultTime(12, 0), slotMinutes: 30 }
            ];
        }
    };

    $scope.openDentistScheduleModal = function () {
        try {
            $scope._initDentistScheduleDays();
            var did = $scope.dentist && $scope.dentist.dentistID ? parseInt($scope.dentist.dentistID, 10) : null;
            if (!did) {
                return Swal.fire({ icon: 'error', title: 'Error', text: 'Unable to determine dentist ID.' });
            }

            // load existing schedule and map into dentistScheduleDays
            RGDCWebApplicationService.getDentistSchedule(did)
                .then(function (resp) {
                    var list = resp && resp.data ? (Array.isArray(resp.data) ? resp.data : []) : [];
                    $scope.dentistScheduleDays.forEach(function (d) {
                        d.enabled = false;
                        d.startTime = dentistScheduleDefaultTime(8, 0);
                        d.endTime = dentistScheduleDefaultTime(12, 0);
                        d.slotMinutes = 30;
                    });
                    list.forEach(function (s) {
                        var dow = parseInt(s.dayOfWeek, 10);
                        var row = $scope.dentistScheduleDays.find(function (d) { return parseInt(d.dayOfWeek, 10) === dow; });
                        if (!row) return;
                        row.enabled = true;
                        var stD = dentistScheduleApiTimeToDate(s.startTime);
                        var etD = dentistScheduleApiTimeToDate(s.endTime);
                        if (stD) row.startTime = stD;
                        if (etD) row.endTime = etD;
                        row.slotMinutes = parseInt(s.slotMinutes, 10) || row.slotMinutes || 30;
                    });

                    $timeout(function () {
                        var el = document.getElementById('modalDentistSchedule');
                        if (el && typeof M !== 'undefined' && M && M.Modal) {
                            var inst = M.Modal.getInstance(el);
                            if (!inst) inst = M.Modal.init(el, { dismissible: false });
                            inst.open();
                        }
                    }, 0);
                })
                .catch(function (err) {
                    console.error('getDentistSchedule error', err);
                    Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load schedule.' });
                });
        } catch (e) {
            console.error('openDentistScheduleModal error', e);
        }
    };

    $scope.saveDentistScheduleFromProfile = function () {
        try {
            var did = $scope.dentist && $scope.dentist.dentistID ? parseInt($scope.dentist.dentistID, 10) : null;
            if (!did) return;

            // reuse signup validator style: normalize and validate enabled rows
            var enabled = ($scope.dentistScheduleDays || []).filter(function (d) { return d && d.enabled; });
            if (!enabled.length) {
                return Swal.fire({ icon: 'error', title: 'Weekly Schedule Required', text: 'Please enable at least one day.' });
            }
            var payload = enabled.map(function (d) {
                var st = formatTimeToHHMM(d.startTime);
                var et = formatTimeToHHMM(d.endTime);
                if (!st || !et) throw new Error('Please set start/end time for ' + (d.dayName || 'a day') + '.');
                return {
                    dentistID: did,
                    dayOfWeek: parseInt(d.dayOfWeek, 10),
                    // Send HH:mm:ss so MVC can bind cleanly into TimeSpan
                    startTime: st + ':00',
                    endTime: et + ':00',
                    slotMinutes: parseInt(d.slotMinutes, 10) || 30
                };
            });

            RGDCWebApplicationService.saveDentistSchedule(payload)
                .then(function (resp) {
                    var ok = resp && resp.data && resp.data.success === true;
                    if (!ok) throw new Error((resp && resp.data && resp.data.message) || 'Failed to save schedule.');
                    Swal.fire({ icon: 'success', title: 'Saved', text: 'Weekly schedule updated.' }).then(function () {
                        // If Add Appointment modal is open, refresh available time slots immediately
                        try { $scope.updateTimeOptions(); } catch (_) { }
                    });
                    // close modal
                    var el = document.getElementById('modalDentistSchedule');
                    if (el && typeof M !== 'undefined' && M && M.Modal) {
                        var inst = M.Modal.getInstance(el);
                        if (inst) inst.close();
                    }
                })
                .catch(function (err) {
                    console.error('saveDentistScheduleFromProfile error', err);
                    Swal.fire({ icon: 'error', title: 'Error', text: (err && err.message) ? err.message : 'Failed to save schedule.' });
                });
        } catch (e) {
            console.error('saveDentistScheduleFromProfile error', e);
            Swal.fire({ icon: 'error', title: 'Error', text: e.message || 'Failed to save schedule.' });
        }
    };


    $scope.selectDentist = function (dentistID) {
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

    $scope.selectStaff = function (staffID) {
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
        $scope.editOwnerSubmitted = true;

        $scope.validateOwnerEditFields();
        $scope.validateOwnerEmailEdit();

        if (!$scope.ownerFirstNameValid || !$scope.ownerLastNameValid) {
            Swal.fire({
                icon: 'error',
                title: 'Missing required fields',
                text: 'Please fill in all required fields.'
            });
            return;
        }

        if (!$scope.ownerEmailFormatValid) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Email',
                text: 'Please enter a valid email address.'
            });
            return;
        }

        if ($scope.ownerEmailTaken) {
            Swal.fire({
                icon: 'error',
                title: 'Email Taken',
                text: 'This email is used by another account.'
            });
            return;
        }

        Swal.fire({
            title: 'Saving...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        var photoUploadPromise = Promise.resolve(null);

        if ($scope.ownerPhotoFileEdit) {
            photoUploadPromise = RGDCWebApplicationService.uploadUserPhoto($scope.ownerPhotoFileEdit)
                .then(function (resp) {
                    var data = resp && resp.data ? resp.data : resp;

                    if (data && data.success && data.filePath) {
                        console.log('Owner photo uploaded:', data.filePath);
                        $scope.ownerPhotoFileEdit = null;
                        return data.filePath;
                    } else {
                        console.warn('Photo upload failed:', data);
                        return null;
                    }
                })
                .catch(function (err) {
                    console.warn('Photo upload error, proceeding without photo', err);
                    return null;
                });
        }

        photoUploadPromise.then(function (photoPath) {

            var accDet = {
                accID: $scope.owner.accID,
                firstName: $scope.owner.firstName,
                middleName: $scope.owner.middleName,
                lastName: $scope.owner.lastName,
                genderID: $scope.owner.genderID,
                birthDate: $scope.owner.birthDate,
                email: $scope.owner.email,
                contactNumber: $scope.owner.contactNumber,
                line1: $scope.owner.line1,
                line2: $scope.owner.line2,
                state: $scope.owner.state,
                country: $scope.owner.country,
                city: $scope.owner.city,
                postal: $scope.owner.postal,
                nationality: $scope.owner.nationality,
                religion: $scope.owner.religion,
                civilStatus: $scope.owner.civilStatus
            };

            accDet.photoLink = photoPath || $scope.owner.photoLink || null;
            if (photoPath) {
                $scope.owner.photoLink = photoPath;
            }

            return RGDCWebApplicationService.editAccount(accDet);
        })
            .then(function (returnedData) {
                if (returnedData.data.success) {

                    var ownerDet = {
                        ownerID: $scope.owner.ownerID,
                        specialization: $scope.owner.specialization
                    };

                    return RGDCWebApplicationService.editOwner(ownerDet);
                } else {
                    return Promise.reject('Failed to update account');
                }
            })
            .then(function (returnedData) {
                if (returnedData.data.success) {
                    Swal.close();

                    $scope.editOwnerSubmitted = false;

                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: 'Successfully updated owner details.'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            if ($scope.isUserOwner) {
                                window.location.href = "/RGDC/adminClinicStaffTab";
                            } else {
                                window.location.href = "/RGDC/adminDashboard";
                            }

                            afterUpdate();
                        }
                    });

                } else {
                    Swal.close();
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Cannot update owner details.'
                    });
                }
            })
            .catch(function (err) {
                Swal.close();
                console.error('Edit owner error:', err);

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to update owner details.'
                });
            });
    };

    $scope.getDentistOwner = function () {
        var getDentistOwner = RGDCWebApplicationService.getDentistOwner();
        getDentistOwner.then(function (returnedData) {
            $scope.dentistArrays = returnedData.data;
            console.log($scope.dentistArrays)
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
    $scope.pickPhoto = function (role) {
        var idMap = {
            owner: 'ownerPhotoInput',
            ownerEdit: 'ownerPhotoInputEdit',
            dentist: 'dentistPhotoInput',
            dentistEdit: 'dentistPhotoInputEdit',
            staff: 'staffPhotoInput',
            staffEdit: 'staffPhotoInputEdit'
        };
        var inputId = idMap[role] || idMap.owner;
        var input = document.getElementById(inputId);
        if (!input) {
            // fallback: create a temporary input if markup missing
            input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.style.display = 'none';
            input.onchange = function () { angular.element(this).scope().onPhotoSelected(this.files, role); };
            document.body.appendChild(input);
            input.click();
            // remove later
            setTimeout(function () { if (input && input.parentNode) input.parentNode.removeChild(input); }, 2000);
            return;
        }
        try { input.click(); } catch (e) { console.error('pickPhoto click failed', e); }
    };

    $scope.onPhotoSelected = function (files, role) {
        if (!files || files.length === 0) return;
        var file = files[0];
        if (!file.type || !file.type.startsWith('image/')) {
            Swal.fire({ icon: 'error', title: 'Invalid File', text: 'Please select an image file.' });
            return;
        }

        var reader = new FileReader();
        reader.onload = function (evt) {
            // assign preview & picked file into scope
            $scope.$apply(function () {
                switch (role) {
                    case 'owner':
                        $scope.ownerPhotoPreview = evt.target.result;
                        $scope._pickedOwnerPhotoFile = file;
                        break;
                    case 'ownerEdit':
                        $scope.ownerPhotoPreviewEdit = evt.target.result;
                        $scope._pickedOwnerPhotoFileEdit = file;
                        break;
                    case 'dentist':
                        $scope.dentistPhotoPreview = evt.target.result;
                        $scope._pickedDentistPhotoFile = file;
                        break;
                    case 'dentistEdit':
                        $scope.dentistPhotoPreviewEdit = evt.target.result;
                        $scope._pickedDentistPhotoFileEdit = file;
                        break;
                    case 'staff':
                        $scope.staffPhotoPreview = evt.target.result;
                        $scope._pickedStaffPhotoFile = file;
                        break;
                    case 'staffEdit':
                        $scope.staffPhotoPreviewEdit = evt.target.result;
                        $scope._pickedStaffPhotoFileEdit = file;
                        break;
                    default:
                        $scope.ownerPhotoPreview = evt.target.result;
                        $scope._pickedOwnerPhotoFile = file;
                }
            });

            // Optionally upload immediately and store returned path on scope (role + "UploadedPhotoPath")
            var uploader = null;
            if (RGDCWebApplicationService && typeof RGDCWebApplicationService.uploadUserPhoto === 'function') {
                uploader = RGDCWebApplicationService.uploadUserPhoto;
            } else if (RGDCWebApplicationService && typeof RGDCWebApplicationService.uploadSignature === 'function') {
                uploader = RGDCWebApplicationService.uploadSignature;
            }

            if (!uploader) {
                // no uploader available — leave preview and picked file only
                return;
            }

            Swal.fire({ title: 'Uploading photo...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

            // call uploader; some implementations accept (file, accId), some accept (file)
            var uploadPromise;
            try {
                uploadPromise = uploader(file);
            } catch (e) {
                // fallback: try calling with a second param as null
                try { uploadPromise = uploader(file, null); } catch (ex) { uploadPromise = Promise.reject(ex); }
            }

            uploadPromise
                .then(function (resp) {
                    Swal.close();
                    var data = resp && resp.data ? resp.data : resp;
                    if (data && data.success && data.filePath) {
                        // store returned path on scope for later use (add/edit flows read this)
                        $scope.$applyAsync(function () {
                            try {
                                $scope[role + "UploadedPhotoPath"] = data.filePath;
                            } catch (e) { /* safe guard */ }
                        });
                        Swal.fire({ icon: 'success', title: 'Uploaded', text: 'Photo uploaded successfully.' });
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

        reader.readAsDataURL(file);
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

        try {
            var reader = new FileReader();
            reader.onload = function (e) {
                $scope.selectedPatient = $scope.selectedPatient || {};
                $scope.selectedPatient._photoPreview = e.target.result;
                if (!$scope.$$phase) $scope.$apply();
            };
            reader.readAsDataURL(file);
        } catch (_) { }

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
                    $scope.selectedPatient._photoPreview = null;
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
    $scope.dentistEmailFormatValid = false;
    $scope.dentistEmailTaken = false;

    $scope.validateDentistEditFields = function () {
        $scope.dentistFirstNameValid = $scope.isNonEmpty($scope.dentist && $scope.dentist.firstName);
        $scope.dentistLastNameValid = $scope.isNonEmpty($scope.dentist && $scope.dentist.lastName);
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
        $scope.editDentistSubmitted = true;

        // Ensure dentist.address is up-to-date from split inputs
        try { $scope.syncDentistAddress && $scope.syncDentistAddress(); } catch (_) { }

        $scope.validateDentistEditFields();
        $scope.validateDentistEmailEdit();

        if (!$scope.dentistFirstNameValid || !$scope.dentistLastNameValid ||
            !$scope.dentistContactValid || !$scope.dentistGenderValid || !$scope.dentistBirthDateValid ||
            !$scope.dentistCivilStatusValid || !$scope.dentistReligionValid || !$scope.dentistNationalityValid ||
            !$scope.dentistSpecializationValid || !$scope.dentistBranchValid) {
            Swal.fire({
                icon: 'error',
                title: 'Missing required fields',
                text: 'Please fill in all required fields.'
            });
            return;
        }

        if (!$scope.dentistEmailFormatValid) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Email',
                text: 'Please enter a valid email address.'
            });
            return;
        }

        if ($scope.dentistEmailTaken) {
            Swal.fire({
                icon: 'error',
                title: 'Email Taken',
                text: 'This email is used by another account.'
            });
            return;
        }

        Swal.fire({
            title: 'Saving...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        var photoUploadPromise = Promise.resolve(null);

        if ($scope.dentistPhotoFileEdit) {
            photoUploadPromise = RGDCWebApplicationService.uploadUserPhoto($scope.dentistPhotoFileEdit)
                .then(function (resp) {
                    var data = resp && resp.data ? resp.data : resp;

                    if (data && data.success && data.filePath) {
                        console.log('Dentist photo uploaded:', data.filePath);
                        $scope.dentistPhotoFileEdit = null;
                        return data.filePath;
                    } else {
                        console.warn('Photo upload failed:', data);
                        return null;
                    }
                })
                .catch(function (err) {
                    console.warn('Photo upload error, proceeding without photo', err);
                    return null;
                });
        }

        photoUploadPromise.then(function (photoPath) {

            var accDet = {
                accID: $scope.dentist.accID,
                firstName: $scope.dentist.firstName,
                middleName: $scope.dentist.middleName,
                lastName: $scope.dentist.lastName,
                genderID: $scope.dentist.genderID,
                birthDate: $scope.dentist.birthDate,
                email: $scope.dentist.email,
                contactNumber: $scope.dentist.contactNumber,
                nationality: $scope.dentist.nationality,
                religion: $scope.dentist.religion,
                line1: $scope.dentist.line1,
                line2: $scope.dentist.line2,
                state: $scope.dentist.state,
                country: $scope.dentist.country,
                city: $scope.dentist.city,
                postal: $scope.dentist.postal,
                civilStatus: $scope.dentist.civilStatus
            };

            accDet.photoLink = photoPath || $scope.dentist.photoLink || null;
            if (photoPath) {
                $scope.dentist.photoLink = photoPath;
            }

            return RGDCWebApplicationService.editAccount(accDet);
        })
            .then(function (returnedData) {
                if (returnedData.data.success) {

                    var dentistDet = {
                        dentistID: $scope.dentist.dentistID,
                        specialization: $scope.dentist.specialization,
                        branchID: $scope.dentist.branchID
                    };

                    return RGDCWebApplicationService.editDentist(dentistDet);
                } else {
                    return Promise.reject('Failed to update account');
                }
            })
            .then(function (returnedData) {
                if (returnedData.data.success) {
                    Swal.close();

                    $scope.editDentistSubmitted = false;

                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: 'Successfully updated dentist details.'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            if ($scope.isUserOwner) {
                                window.location.href = "/RGDC/adminClinicStaffTab";
                            } else {
                                window.location.href = "/RGDC/adminDashboard";
                            }
                        }
                    });

                } else {
                    Swal.close();
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Cannot update dentist details.'
                    });
                }
            })
            .catch(function (err) {
                Swal.close();
                console.error('Edit dentist error:', err);

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to update dentist details.'
                });
            });
    };

    // Staff
    var _staffEmailTimer = null;
    $scope.staffFirstNameValid = true;
    $scope.staffLastNameValid = true;
    $scope.staffEmailFormatValid = false;
    $scope.staffEmailTaken = false;

    $scope.validateStaffEditFields = function () {
        $scope.staffFirstNameValid = $scope.isNonEmpty($scope.staff && $scope.staff.firstName);
        $scope.staffLastNameValid = $scope.isNonEmpty($scope.staff && $scope.staff.lastName);
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
        $scope.editStaffSubmitted = true;

        $scope.validateStaffEditFields();
        $scope.validateStaffEmailEdit();

        if (!$scope.staffFirstNameValid || !$scope.staffLastNameValid) {
            Swal.fire({
                icon: 'error',
                title: 'Missing required fields',
                text: 'Please fill in all required fields.'
            });
            return;
        }

        if (!$scope.staffEmailFormatValid) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Email',
                text: 'Please enter a valid email address.'
            });
            return;
        }

        if ($scope.staffEmailTaken) {
            Swal.fire({
                icon: 'error',
                title: 'Email Taken',
                text: 'This email is used by another account.'
            });
            return;
        }

        Swal.fire({
            title: 'Saving...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        var photoUploadPromise = Promise.resolve(null);

        if ($scope._pickedAccountPhotoFile) {
            photoUploadPromise = RGDCWebApplicationService.uploadUserPhoto($scope._pickedAccountPhotoFile)
                .then(function (resp) {
                    var data = resp && resp.data ? resp.data : resp;

                    if (data && data.success && data.filePath) {
                        console.log('Photo uploaded successfully:', data.filePath);
                        $scope._pickedAccountPhotoFile = null;
                        $scope.staffAccountPhotoPreview = null;
                        return data.filePath;
                    } else {
                        console.warn('Photo upload failed:', data);
                        return null;
                    }
                })
                .catch(function (err) {
                    console.warn('Photo upload error, proceeding without photo', err);
                    return null;
                });
        }

        photoUploadPromise.then(function (photoPath) {
            var accDet = {
                accID: $scope.staff.accID,
                firstName: $scope.staff.firstName,
                middleName: $scope.staff.middleName,
                lastName: $scope.staff.lastName,
                genderID: $scope.staff.genderID,
                birthDate: $scope.staff.birthDate,
                email: $scope.staff.email,
                contactNumber: $scope.staff.contactNumber,
                line1: $scope.staff.line1,
                line2: $scope.staff.line2,
                state: $scope.staff.state,
                country: $scope.staff.country,
                city: $scope.staff.city,
                postal: $scope.staff.postal,
                civilStatus: $scope.staff.civilStatus,
                nationality: $scope.staff.nationality,
                religion: $scope.staff.religion
            };

            accDet.photoLink = photoPath || $scope.staff.photoLink || null;
            if (photoPath) {
                $scope.staff.photoLink = photoPath;
            }

            return RGDCWebApplicationService.editAccount(accDet);
        })
            .then(function (returnedData) {
                if (returnedData.data.success) {
                    console.log('Account updated successfully');

                    var staffDet = {
                        staffID: $scope.staff.staffID,
                        staffRole: $scope.staff.staffRole,
                        branchID: $scope.staff.branchID
                    };

                    return RGDCWebApplicationService.editStaff(staffDet);
                } else {
                    return Promise.reject('Failed to update account');
                }
            })
            .then(function (returnedData) {
                if (returnedData.data.success) {
                    console.log('Staff details updated successfully');
                    Swal.close();

                    $scope.editStaffSubmitted = false;

                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: 'Successfully updated staff details.'
                    })
                        .then((result) => {
                            if (result.isConfirmed) {
                                $scope.staffAccountPhotoPreview = null;
                                location.reload();
                            }
                        });
                } else {
                    Swal.close();
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Cannot update staff details.'
                    });
                }
            })
            .catch(function (err) {
                Swal.close();
                console.error('Edit staff error:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to update staff details.'
                });
            });
    };

    $scope.loadCurrentUserPhoto = function () {
        var savedPhoto = sessionStorage.getItem('currentUserPhoto');
        if (savedPhoto) {
            $scope.currentUserPhoto = savedPhoto;
        }

        RGDCWebApplicationService.getCurrentUserPhoto()
            .then(function (resp) {
                var data = resp && resp.data ? resp.data : resp;
                if (data && data.photoLink) {
                    $scope.currentUserPhoto = data.photoLink;
                    sessionStorage.setItem('currentUserPhoto', data.photoLink);
                }
            })
            .catch(function (err) {
                console.warn('Failed to load user photo', err);
            });
    };


    //for edit modal email validation
    $scope.isNonEmpty = function (v) {
        return !!v && String(v).trim().length > 0;
    };

    // Owner edit validation & debounce email check
    $scope.ownerFirstNameValid = false;
    $scope.ownerLastNameValid = false;
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
    $scope.isAddOwnerFormValid = function () {
        return $scope.owner_firstName && $scope.owner_lastName &&
            $scope.ownerEmailFormatValid && !$scope.ownerEmailTaken &&
            $scope.ownerContactValid &&
            $scope.owner_genderID && $scope.owner_birthDate && $scope.owner_civilStatus;
    };

    // DENTIST add form validation
    $scope.dentistFirstNameValid = false;
    $scope.dentistLastNameValid = false;
    $scope.dentistContactValid = false;
    $scope.dentistEmailFormatValid = false;
    $scope.dentistEmailTaken = false;
    $scope.dentistFirstNameTouched = false;
    $scope.dentistLastNameTouched = false;
    $scope.dentistContactTouched = false;
    $scope.dentistEmailTouched = false;
    var _dentistEditEmailTimer = null;
    var _dentistAddEmailTimer = null;

    $scope.validateDentistEditFields = function () {
        $scope.dentistFirstNameValid = $scope.isNonEmpty($scope.dentist && $scope.dentist.firstName);
        $scope.dentistLastNameValid = $scope.isNonEmpty($scope.dentist && $scope.dentist.lastName);
        $scope.dentistContactValid = PHONE_PATTERN.test($scope.dentist && $scope.dentist.contactNumber || '');
        $scope.dentistGenderValid = !!($scope.dentist && $scope.dentist.genderID);
        $scope.dentistBirthDateValid = !!($scope.dentist && $scope.dentist.birthDate);
        $scope.dentistCivilStatusValid = !!($scope.dentist && $scope.dentist.civilStatus);
        $scope.dentistReligionValid = $scope.isNonEmpty($scope.dentist && $scope.dentist.religion);
        $scope.dentistNationalityValid = $scope.isNonEmpty($scope.dentist && $scope.dentist.nationality);
        $scope.dentistSpecializationValid = $scope.isNonEmpty($scope.dentist && $scope.dentist.specialization);
        $scope.dentistBranchValid = ($scope.dentist && ($scope.dentist.branchID !== null && typeof $scope.dentist.branchID !== 'undefined' && $scope.dentist.branchID !== ''));
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

    $scope.isAddDentistFormValid = function () {
        return $scope.dentistEmailFormatValid && !$scope.dentistEmailTaken
    };

    // STAFF add form validation
    $scope.staffFirstNameValid = false;
    $scope.staffLastNameValid = false;
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

    $scope.isAddStaffFormValid = function () {
        return $scope.staffEmailFormatValid && !$scope.staffEmailTaken;
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


    //for datatable nung progress notes
    function initProgressNotesDataTable(opts) {
        opts = opts || {};
        var maxRetries = opts.maxRetries || 30;
        var retryDelay = opts.retryDelay || 120;
        var attempt = 0;

        function tryInit() {
            attempt++;

            if (typeof DataTable === 'undefined') {
                if (attempt < maxRetries) return setTimeout(tryInit, retryDelay);
                console.warn('DataTable lib not available for #progressNotes.');
                return;
            }

            var tables = document.querySelectorAll('table#progressNotes');
            if (!tables || tables.length === 0) {
                if (attempt < maxRetries) return setTimeout(tryInit, retryDelay);
                console.warn('#progressNotes element not found.');
                return;
            }

            var tblElem = tables[0];
            for (var i = 1; i < tables.length; i++) {
                try { tables[i].parentNode.removeChild(tables[i]); } catch (e) { }
            }

            var tbody = tblElem.querySelector('tbody');
            var hasRows = tbody && tbody.querySelectorAll('tr').length > 0;
            if (!hasRows && attempt < maxRetries) return setTimeout(tryInit, retryDelay);

            try {
                if (window.progressNotesTable && typeof window.progressNotesTable.destroy === 'function') {
                    try { window.progressNotesTable.destroy(); } catch (e) { console.warn('destroy previous DataTable failed', e); }
                    window.progressNotesTable = null;
                }

                var parent = tblElem.parentNode;
                if (parent) {
                    Array.prototype.slice.call(parent.children).forEach(function (ch) {
                        if (ch === tblElem) return;
                        if (ch.querySelector && ch.querySelector('#progressNotes')) {
                            try { parent.removeChild(ch); } catch (_) { }
                            return;
                        }
                        try {
                            var cls = ch.className || '';
                            if (typeof cls === 'string' && cls.indexOf('dataTable') !== -1) {
                                try { parent.removeChild(ch); } catch (_) { }
                            }
                        } catch (e) { }
                    });
                }

                window.progressNotesTable = new DataTable(tblElem, {
                    searchable: true,
                    fixedHeight: false,
                    perPage: 5,
                    perPageSelect: [5, 10, 25, 50],
                    labels: {
                        placeholder: "Search procedures, tooth #, dentist...",
                        perPage: "{select} entries per page",
                        noRows: "No progress notes found",
                        info: "Showing {start} to {end} of {rows} entries"
                    }
                });
            } catch (e) {
                console.warn('Error initializing #progressNotes DataTable', e);
            }
        }
        tryInit();
    }


    //para mag reload yuung table sa progress notes kada add or edit
    $scope.progressNotesReady = true;
    function refreshPatientTreatments(callback) {
        $scope.progressNotesReady = false;

        RGDCWebApplicationService.getPatientTreatment()
            .then(function (resp) {
                $scope.patientTreatments = resp && resp.data ? resp.data : [];
                $scope.patientTreatments.forEach(function (pt) {
                    if (pt.date) pt.date = formatDateToMDY(pt.date);
                });

                $timeout(function () {
                    $scope.progressNotesReady = true;
                    $timeout(function () {
                        initProgressNotesDataTable({ maxRetries: 30, retryDelay: 120 });
                        if (typeof callback === 'function') callback();
                    }, 60);
                }, 40);
            })
            .catch(function (err) {
                console.error('refreshPatientTreatments error', err);
                $scope.progressNotesReady = true;
                if (typeof callback === 'function') callback(err);
            });
    }

    //for validation of adding forms in the patient profile
    $scope.isValidAddFormContact = function (num) {
        if (!num) return false;
        return /^09\d{9}$/.test(String(num));
    };
    //function initPatientFormsDataTable(opts) {
    //    opts = opts || {};
    //    var maxRetries = opts.maxRetries || 30;
    //    var retryDelay = opts.retryDelay || 120;
    //    var attempt = 0;

    //for displaying of forms
    $scope._pickedAccountPhotoFile = null;
    $scope.accountPhotoPreview = null;

    $scope.pickAccountPhotoFile = function () {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        document.body.appendChild(input);

        input.onchange = function (e) {
            var file = e.target.files && e.target.files[0];
            if (!file) { document.body.removeChild(input); return; }

            if (!file.type.startsWith('image/')) {
                Swal.fire({ icon: 'error', title: 'Invalid File', text: 'Please select an image file.' });
                document.body.removeChild(input);
                return;
            }

            var reader = new FileReader();
            reader.onload = function (evt) {
                $scope.$apply(function () {
                    $scope.staff.photoLink = evt.target.result;
                    $scope._pickedAccountPhotoFile = file;
                });
            };
            reader.readAsDataURL(file);

            document.body.removeChild(input);
        };

        input.click();
    };

    $scope.pickAccountPhotoFileStaff = function () {
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
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid File',
                    text: 'Please select an image file.'
                });
                document.body.removeChild(input);
                return;
            }

            var reader = new FileReader();
            reader.onload = function (evt) {
                $scope.$apply(function () {
                    $scope.staffAccountPhotoPreview = evt.target.result;
                    $scope._pickedAccountPhotoFile = file;

                    console.log('Photo selected:', file.name, 'Size:', file.size);
                });
            };
            reader.readAsDataURL(file);
            document.body.removeChild(input);
        };

        input.click();
    };

    $scope.saveStaffPhoto = function () {
        var file = $scope._pickedAccountPhotoFile;
        if (!file) {
            Swal.fire({ icon: 'error', title: 'No Image', text: 'Pick an image first.' });
            return;
        }
        Swal.fire({ title: 'Uploading...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        RGDCWebApplicationService.uploadUserPhoto(file)
            .then(function (resp) {
                Swal.close();
                var data = resp && resp.data ? resp.data : resp;
                if (data && data.success && data.filePath) {
                    $scope.staff.photoLink = data.filePath;
                    $scope.accountPhotoPreview = data.filePath;
                    $scope._pickedAccountPhotoFile = null;

                    try { $scope.getSessionVariables(); } catch (e) { }
                    Swal.fire({ icon: 'success', title: 'Saved', text: 'Profile photo updated.' });
                } else {
                    Swal.fire({ icon: 'error', title: 'Upload failed', text: (data && data.message) ? data.message : 'Unknown error uploading photo.' });
                }
            })
            .catch(function (err) {
                Swal.close();
                console.error('UploadStaffPhoto error', err);
                Swal.fire({ icon: 'error', title: 'Upload Error', text: 'Failed to upload profile photo.' });
            });
    };

    $scope.pickAccountPhotoFileOwner = function () {
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
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid File',
                    text: 'Please select an image file.'
                });
                document.body.removeChild(input);
                return;
            }

            var reader = new FileReader();
            reader.onload = function (evt) {
                $scope.$apply(function () {
                    $scope.ownerAccountPhotoPreview = evt.target.result;
                    $scope.ownerPhotoFileEdit = file;

                    console.log('Owner photo selected:', file.name, 'Size:', file.size);
                });
            };
            reader.readAsDataURL(file);
            document.body.removeChild(input);
        };

        input.click();
    };

    $scope.saveOwnerPhoto = function () {
        var file = $scope.ownerPhotoFileEdit;
        if (!file) {
            Swal.fire({ icon: 'error', title: 'No Image', text: 'Pick an image first.' });
            return;
        }

        Swal.fire({ title: 'Uploading...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        RGDCWebApplicationService.uploadUserPhoto(file)
            .then(function (resp) {
                Swal.close();
                var data = resp && resp.data ? resp.data : resp;

                if (data && data.success && data.filePath) {
                    $scope.owner.photoLink = data.filePath;
                    $scope.ownerAccountPhotoPreview = data.filePath;
                    $scope.ownerPhotoFileEdit = null;

                    try { $scope.getSessionVariables(); } catch (e) { }

                    Swal.fire({ icon: 'success', title: 'Saved', text: 'Profile photo updated.' });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Upload failed',
                        text: (data && data.message) ? data.message : 'Unknown error uploading photo.'
                    });
                }
            })
            .catch(function (err) {
                Swal.close();
                console.error('UploadOwnerPhoto error', err);
                Swal.fire({ icon: 'error', title: 'Upload Error', text: 'Failed to upload profile photo.' });
            });
    };
    $scope.pickAccountPhotoFileDentist = function () {
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
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid File',
                    text: 'Please select an image file.'
                });
                document.body.removeChild(input);
                return;
            }

            var reader = new FileReader();
            reader.onload = function (evt) {
                $scope.$apply(function () {
                    $scope.dentistAccountPhotoPreview = evt.target.result;
                    $scope.dentistPhotoFileEdit = file;

                    console.log('Dentist photo selected:', file.name, 'Size:', file.size);
                });
            };
            reader.readAsDataURL(file);
            document.body.removeChild(input);
        };

        input.click();
    };

    $scope.saveDentistPhoto = function () {
        var file = $scope.dentistPhotoFileEdit;
        if (!file) {
            Swal.fire({ icon: 'error', title: 'No Image', text: 'Pick an image first.' });
            return;
        }

        Swal.fire({ title: 'Uploading...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        RGDCWebApplicationService.uploadUserPhoto(file)
            .then(function (resp) {
                Swal.close();
                var data = resp && resp.data ? resp.data : resp;

                if (data && data.success && data.filePath) {
                    $scope.dentist.photoLink = data.filePath;
                    $scope.dentistAccountPhotoPreview = data.filePath;
                    $scope.dentistPhotoFileEdit = null;

                    try { $scope.getSessionVariables(); } catch (e) { }

                    Swal.fire({ icon: 'success', title: 'Saved', text: 'Profile photo updated.' });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Upload failed',
                        text: (data && data.message) ? data.message : 'Unknown error uploading photo.'
                    });
                }
            })
            .catch(function (err) {
                Swal.close();
                console.error('UploadDentistPhoto error', err);
                Swal.fire({ icon: 'error', title: 'Upload Error', text: 'Failed to upload profile photo.' });
            });
    };
    // Dentist signature upload for account (preview + save)
    $scope._pickedAccountSignatureFile = null;
    $scope.accountSignaturePreview = null;

    $scope.pickAccountSignatureFile = function () {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        document.body.appendChild(input);

        input.onchange = function (e) {
            var file = e.target.files && e.target.files[0];
            if (!file) { document.body.removeChild(input); return; }

            if (!file.type.startsWith('image/')) {
                Swal.fire({ icon: 'error', title: 'Invalid File', text: 'Please select an image file.' });
                document.body.removeChild(input);
                return;
            }

            var reader = new FileReader();
            reader.onload = function (evt) {
                $scope.$apply(function () {
                    $scope.accountSignaturePreview = evt.target.result;
                    $scope._pickedAccountSignatureFile = file;
                });
            };
            reader.readAsDataURL(file);

            document.body.removeChild(input);
        };

        input.click();
    };

    $scope.saveAccountSignature = function () {
        var file = $scope._pickedAccountSignatureFile;
        if (!file) {
            Swal.fire({ icon: 'error', title: 'No Image', text: 'Pick an image first.' });
            return;
        }

        Swal.fire({ title: 'Uploading...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        // reuse uploadSignature uploader
        var uploader = RGDCWebApplicationService.uploadSignature || RGDCWebApplicationService.uploadFile;

        uploader(file)
            .then(function (resp) {
                var data = resp && resp.data ? resp.data : resp;
                if (data && data.success && data.filePath) {
                    // Save to dentist record
                    return RGDCWebApplicationService.saveDentistSignature(data.filePath)
                        .then(function (saveResp) {
                            Swal.close();
                            var s = saveResp && saveResp.data ? saveResp.data : saveResp;
                            if (s && s.success) {
                                $scope.accountSignaturePreview = data.filePath;
                                $scope._pickedAccountSignatureFile = null;
                                Swal.fire({ icon: 'success', title: 'Saved', text: 'Signature saved.' });
                            } else {
                                Swal.fire({ icon: 'error', title: 'Save Failed', text: (s && s.message) ? s.message : 'Failed to save signature.' });
                            }
                        });
                } else {
                    Swal.close();
                    Swal.fire({ icon: 'error', title: 'Upload failed', text: (data && data.message) ? data.message : 'Unknown error uploading signature.' });
                }
            })
            .catch(function (err) {
                Swal.close();
                console.error('Upload or save dentist signature error', err);
                Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to upload/save signature.' });
            });
    };
    $scope.viewPayRec = function (paymentID) {
        var paymentData = {
            paymentID: paymentID
        }
        var getPaymentInfo = RGDCWebApplicationService.getPaymentInfo(paymentData);
        getPaymentInfo.then(function (payment) {
            $scope.paymentInfo = payment.data;
            console.log($scope.paymentInfo)
            if ($scope.paymentInfo.paymentDate) {
                $scope.paymentInfo.paymentDate = formatDateToMDY($scope.paymentInfo.paymentDate)
            }
        });
    }

    //for time slot options sa appt add
    $scope.timeOptions = [];

    function generateTimeSlots(startHour, endHour, intervalMinutes) {
        intervalMinutes = typeof intervalMinutes === 'number' ? intervalMinutes : 30;
        var slots = [];

        var base = new Date(2000, 0, 1, 0, 0, 0, 0);
        for (var minutes = startHour * 60; minutes <= endHour * 60; minutes += intervalMinutes) {
            var d = new Date(base.getTime());
            d.setHours(0, 0, 0, 0);
            d.setMinutes(minutes);

            try {
                var s = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                slots.push(s);
            } catch (e) {
                var hh = Math.floor(minutes / 60);
                var mm = minutes % 60;
                var mer = hh >= 12 ? 'PM' : 'AM';
                var h12 = hh % 12;
                if (h12 === 0) h12 = 12;
                var mmStr = String(mm).padStart(2, '0');
                slots.push(h12 + ':' + mmStr + ' ' + mer);
            }
        }
        return slots;
    }

    $scope.updateTimeOptions = function () {
        $scope.timeOptions = $scope.timeOptions || [];

        try {
            if (!$scope.newApptRequest) {
                $scope.timeOptions = [];
                return;
            }

            // Normalize dentistID: number, string, or object
            var rawDentist = $scope.newApptRequest.dentistID;
            var dentistID = null;
            if (rawDentist === null || typeof rawDentist === 'undefined') {
                dentistID = null;
            } else if (typeof rawDentist === 'object') {
                dentistID = rawDentist.dentistID || rawDentist.id || rawDentist.accID || rawDentist.value || null;
            } else {
                dentistID = rawDentist;
            }
            dentistID = (dentistID !== null && dentistID !== '') ? parseInt(dentistID, 10) : null;

            // Consider any numeric id (including 0) valid; only null/NaN/negative are invalid
            function dentistIdIsValid(id) {
                return !(id === null || typeof id === 'undefined' || isNaN(id) || id < 0);
            }

            // Helper to try resolve dentistID from currentDentist or dentistArray name match
            function tryResolveFromContext() {
                try {
                    if ($scope.currentDentist) {
                        var cd = $scope.currentDentist;
                        var cid = cd.dentistID || cd.id || cd.accID || cd.value || null;
                        cid = (cid !== null && cid !== '') ? parseInt(cid, 10) : null;
                        if (dentistIdIsValid(cid)) return cid;
                    }
                } catch (e) { /* ignore */ }

                try {
                    if (Array.isArray($scope.dentistArray) && $scope.dentistArray.length > 0) {
                        var targetName = ($scope.currentDentist && $scope.currentDentist.dentistName) ? String($scope.currentDentist.dentistName).trim() : null;
                        if (!targetName && typeof rawDentist === 'string') targetName = rawDentist;
                        if (targetName) {
                            var match = $scope.dentistArray.find(function (d) {
                                return d && d.dentistName && String(d.dentistName).trim() === targetName && dentistIdIsValid(d.dentistID);
                            });
                            if (match && dentistIdIsValid(match.dentistID)) return parseInt(match.dentistID, 10);
                        }
                        // if only one dentist and its id is valid, use it
                        if ($scope.dentistArray.length === 1 && dentistIdIsValid($scope.dentistArray[0].dentistID)) {
                            return parseInt($scope.dentistArray[0].dentistID, 10);
                        }
                    }
                } catch (e) { /* ignore */ }

                return null;
            }

            // If dentistID invalid, attempt context fallbacks and/or fetch dentist list
            if (!dentistIdIsValid(dentistID)) {
                var resolved = tryResolveFromContext();
                if (resolved !== null) {
                    dentistID = resolved;
                    $scope.newApptRequest.dentistID = dentistID;
                } else {
                    // fetch dentist list and retry resolution
                    RGDCWebApplicationService.getDentistList()
                        .then(function (resp) {
                            var raw = resp && resp.data ? resp.data : [];
                            $scope.dentistArray = (Array.isArray(raw) ? raw : []).map(function (d) {
                                var id = null;
                                if (d && typeof d.dentistID !== 'undefined') id = d.dentistID;
                                else if (d && typeof d.accID !== 'undefined') id = d.accID;
                                else if (d && typeof d.id !== 'undefined') id = d.id;
                                id = (id !== null && id !== '') ? parseInt(id, 10) : null;

                                var name = '';
                                if (d) {
                                    if (d.dentistName) name = d.dentistName;
                                    else if (d.fullName) name = d.fullName;
                                    else if (d.firstName || d.lastName) {
                                        name = ((d.firstName || '') + ' ' + (d.lastName || '')).trim();
                                    } else if (d.email) {
                                        name = d.email;
                                    }
                                }
                                return { dentistID: id, dentistName: name };
                            }).filter(function (x) {
                                return x && typeof x.dentistID !== 'undefined' && x.dentistID !== null && !isNaN(x.dentistID);
                            });

                            // if still unresolved, try first valid dentist
                            if (!dentistIdIsValid(dentistID) && $scope.dentistArray.length > 0) {
                                dentistID = $scope.dentistArray[0].dentistID;
                                $scope.newApptRequest = $scope.newApptRequest || {};
                                $scope.newApptRequest.dentistID = dentistID;
                            }

                            var r2 = tryResolveFromContext();
                            if (r2 !== null) {
                                dentistID = r2;
                                $scope.newApptRequest.dentistID = dentistID;
                            }

                            if (!dentistIdIsValid(dentistID)) {
                                console.warn('updateTimeOptions: invalid dentistID after fetching dentist list', { dentistRaw: rawDentist, dentistArrayLength: $scope.dentistArray.length, currentDentist: $scope.currentDentist });
                                $scope.timeOptions = [];
                                if ($scope.newApptRequest && $scope.newApptRequest.time) $scope.newApptRequest.time = null;
                                return;
                            }

                            // proceed to compute slots
                            computeAndSetTimes(dentistID);
                        })
                        .catch(function (err) {
                            console.error('updateTimeOptions: failed to fetch dentist list', err);
                            $scope.timeOptions = [];
                            if ($scope.newApptRequest && $scope.newApptRequest.time) $scope.newApptRequest.time = null;
                        });
                    return; // async flow continues in then()
                }
            }

            // Normalize date: accept Date, ISO string, or friendly string
            var rawDate = $scope.newApptRequest.dateTime;
            var selectedDate = null;
            if (!rawDate) {
                $scope.timeOptions = [];
                if ($scope.newApptRequest && $scope.newApptRequest.time) $scope.newApptRequest.time = null;
                return;
            }
            if (Object.prototype.toString.call(rawDate) === '[object Date]') {
                selectedDate = rawDate;
            } else if (typeof rawDate === 'string') {
                var tryIso = new Date(rawDate);
                if (!isNaN(tryIso.getTime())) selectedDate = tryIso;
                else selectedDate = parseJsonDateToJsDate(rawDate) || (function () { var m = String(rawDate).match(/\d+/); return m ? new Date(parseInt(m[0], 10)) : null; })();
            } else {
                selectedDate = new Date(rawDate);
            }

            if (!selectedDate || isNaN(selectedDate.getTime())) {
                $scope.timeOptions = [];
                if ($scope.newApptRequest && $scope.newApptRequest.time) $scope.newApptRequest.time = null;
                return;
            }

            var year = selectedDate.getFullYear();
            var month = selectedDate.getMonth();
            var day = selectedDate.getDate();

            // core slot computation (uses dentistID captured)
            function computeSlots(existingAppointments) {
                var durationMs = ($scope._apptDurationMinutes || 120) * 60 * 1000;
                var slotIntervalMs = ($scope._slotIntervalMinutes || 30) * 60 * 1000;

                var startDate = new Date(year, month, day, ($scope._businessStartHour || 8), 0, 0, 0);
                var latestStart = new Date(year, month, day, ($scope._businessEndHour || 18), 0, 0, 0);
                latestStart = new Date(latestStart.getTime() - durationMs);

                var candidates = [];
                for (var t = startDate.getTime(); t <= latestStart.getTime(); t += slotIntervalMs) {
                    candidates.push(new Date(t));
                }

                // Filter existing appointments for same dentist & same day
                var existingForDentist = (Array.isArray(existingAppointments) ? existingAppointments : []).filter(function (a) {
                    var aDentRaw = a && (typeof a.dentistID !== 'undefined' ? a.dentistID : (a.accID || a.id));
                    var aDent = (typeof aDentRaw !== 'undefined' && aDentRaw !== null && aDentRaw !== '') ? parseInt(aDentRaw, 10) : null;
                    if (aDent === null || isNaN(aDent)) return false;
                    if (aDent !== dentistID) return false;
                    var aDate = a.dateTimeObj || parseJsonDateToJsDate(a.dateTime) || a.date;
                    var d = (aDate instanceof Date) ? aDate : new Date(aDate);
                    if (isNaN(d.getTime())) return false;
                    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
                }).map(function (a) {
                    var aDate = a.dateTimeObj || parseJsonDateToJsDate(a.dateTime) || a.date;
                    return (aDate instanceof Date) ? aDate : new Date(aDate);
                }).filter(Boolean);

                var allowed = candidates.filter(function (slot) {
                    var sMs = slot.getTime();
                    var sEnd = sMs + durationMs;
                    for (var i = 0; i < existingForDentist.length; i++) {
                        var aMs = existingForDentist[i].getTime();
                        var aEnd = aMs + durationMs;
                        if (sMs < aEnd && sEnd > aMs) return false;
                    }
                    return true;
                });

                var formatted = allowed.map(function (d) {
                    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                });

                formatted = formatted.filter(function (v, i, arr) { return arr.indexOf(v) === i; });
                formatted.sort(function (a, b) {
                    var da = new Date('2000-01-01 ' + a);
                    var db = new Date('2000-01-01 ' + b);
                    return da - db;
                });

                return formatted;
            }

            function computeAndSetTimes(resolvedDentistID) {
                if (Array.isArray($scope.adminAppointments) && $scope.adminAppointments.length > 0) {
                    $scope.timeOptions = computeSlots($scope.adminAppointments);
                    if ($scope.newApptRequest && $scope.newApptRequest.time && $scope.timeOptions.indexOf($scope.newApptRequest.time) === -1) {
                        $scope.newApptRequest.time = null;
                    }
                    return;
                }

                RGDCWebApplicationService.getAdminScheduledAppointments()
                    .then(function (resp) {
                        var remote = resp && resp.data ? (Array.isArray(resp.data) ? resp.data : []) : [];
                        $scope.adminAppointments = (remote || []).map(function (a) {
                            var dt = parseJsonDateToJsDate(a.dateTime);
                            return Object.assign({}, a, { dateTimeObj: dt });
                        });
                        $scope.timeOptions = computeSlots($scope.adminAppointments);
                        if ($scope.newApptRequest && $scope.newApptRequest.time && $scope.timeOptions.indexOf($scope.newApptRequest.time) === -1) {
                            $scope.newApptRequest.time = null;
                        }
                    })
                    .catch(function (err) {
                        console.error('updateTimeOptions: failed to fetch admin appointments', err);
                        $scope.timeOptions = [];
                        if ($scope.newApptRequest && $scope.newApptRequest.time) $scope.newApptRequest.time = null;
                    });
            }

            // finally compute times using resolved dentistID
            computeAndSetTimes(dentistID);

        } catch (ex) {
            console.error('updateTimeOptions unexpected error', ex);
            $scope.timeOptions = [];
            if ($scope.newApptRequest && $scope.newApptRequest.time) $scope.newApptRequest.time = null;
        }
    };

    $scope.$watch('newApptRequest.dateTime', function (nv, ov) {
        try { $scope.updateTimeOptions(); } catch (e) { console.warn('watch date updateTimeOptions failed', e); }
    });
    $scope.$watch('newApptRequest.dentistID', function (nv, ov) {
        try { $scope.updateTimeOptions(); } catch (e) { console.warn('watch dentist updateTimeOptions failed', e); }
    });

    function initDataTableSafe(selector, instanceName) {
        // Only the scheduled grid uses jQuery DataTables + static HTML action cells.
        // Requested / past tables must stay Angular-rendered so ng-if / ng-click (accept/deny) keep working.
        if (selector && selector !== '#adminScheduledAppointment') {
            return;
        }
        // Wait a bit so Angular has rendered rows
        $timeout(function () {
            try {
                var tbl = document.querySelector('#adminScheduledAppointment');
                if (!tbl) return;

                // Build data rows from Angular model (use simple arrays for DataTables)
                var dtData = ($scope.adminAppointments || []).map(function (a) {
                    return [
                        a.date || '',
                        a.time || '',
                        a.purpose || '',
                        a.remarks || '',
                        a.dentistName || '',
                        a.patientName || '',
                        a.displayStatus || a.status || '',
                        // placeholder for actions column; DataTable will render HTML from columnDefs below
                        a.apptID || ''
                    ];
                });

                // If a previous instance exists and is a jQuery DataTable, reuse it by clearing and adding rows.
                var prev = window._adminScheduledDataTableInstance;
                var isJQueryDt = prev && prev.settings && typeof prev.clear === 'function' && typeof prev.rows === 'function';

                if (isJQueryDt) {
                    try {
                        // clear and repopulate
                        prev.clear();
                        if (dtData.length > 0) prev.rows.add(dtData);
                        prev.draw(false);
                    } catch (e) {
                        console.warn('Failed to refresh existing jQuery DataTable, destroying and recreating', e);
                        try { prev.destroy(true); } catch (ex) { /* ignore */ }
                        window._adminScheduledDataTableInstance = null;
                    }
                }

                // If no instance (or destroyed), create one using jQuery DataTables if available
                if (!window._adminScheduledDataTableInstance) {
                    if (window.jQuery && jQuery.fn && jQuery.fn.dataTable) {
                        // remove any leftover wrappers
                        try {
                            if (jQuery.fn.dataTable.isDataTable(tbl)) {
                                try { jQuery(tbl).DataTable().clear().destroy(true); } catch (e) { /* ignore */ }
                            }
                        } catch (e) { /* ignore */ }

                        // Initialize with array data; last column will render action buttons
                        window._adminScheduledDataTableInstance = jQuery(tbl).DataTable({
                            destroy: true,
                            data: dtData,
                            columns: [
                                { title: "Date", data: 0 },
                                { title: "Time", data: 1 },
                                { title: "Purpose", data: 2 },
                                { title: "Notes", data: 3 },
                                { title: "Dentist", data: 4 },
                                { title: "Patient", data: 5 },
                                { title: "Status", data: 6 },
                                {
                                    title: "",
                                    data: 7,
                                    orderable: false,
                                    searchable: false,
                                    render: function (data, type, row, meta) {
                                        // data == apptID
                                        var id = data || '';
                                        if ($scope.isUserDentist || $scope.isUserOwner) {
                                            var btns = '<div class="appt-action-buttons" style="display:flex; gap:6px;">' +
                                                '<a class="btn-view-appt btn-floating btn-small brown lighten-4 p-0 smallBtn redBtn" data-apptid="' + id + '" data-tooltip="View Appointment" role="button" aria-label="View appointment"><i class="material-icons brown-text lighten-1">visibility</i></a>' +
                                                '</div>';
                                        } else {
                                            var btns = '<div class="appt-action-buttons" style="display:flex; gap:6px;">' +
                                                '<a class="btn-delete-appt btn-floating btn-small brown lighten-4 p-0 smallBtn redBtn" data-apptid="' + id + '" data-tooltip="Delete Appointment" role="button" aria-label="Delete appointment"><i class="material-icons brown-text lighten-1">archive</i></a>' +
                                                '<a class="btn-edit-appt btn-floating btn-small brown lighten-4 p-0 smallBtn" data-apptid="' + id + '" data-tooltip="Edit Appointment" role="button" aria-label="Edit appointment"><i class="material-icons brown-text lighten-1">edit</i></a>' +
                                                '<a class="reschedule-btn btn-floating btn-small brown lighten-4 p-0 smallBtn" data-apptid="' + id + '" data-tooltip="Request Reschedule" role="button" aria-label="Request reschedule"><i class="material-icons brown-text lighten-1">autorenew</i></a>' +
                                                '</div>';
                                        }
                                        return btns;
                                    }
                                }
                            ],
                            pageLength: 10,
                            lengthMenu: [5, 10, 25, 50],
                            language: { searchPlaceholder: "Search..." }
                        });
                    } else if (typeof window.DataTable === 'function') {
                        // Fallback to Simple-DataTables if jQuery DataTables not present
                        try {
                            window._adminScheduledDataTableInstance = new DataTable('#adminScheduledAppointment', {
                                searchable: true,
                                fixedHeight: false,
                                perPage: 10,
                                perPageSelect: [5, 10, 25, 50],
                                labels: {
                                    placeholder: "Search...",
                                    perPage: "{select} entries per page",
                                    noRows: "No rows found",
                                    info: "Showing {start} to {end} of {rows} entries"
                                }
                            });
                        } catch (e) {
                            console.warn('Simple DataTable init failed for #adminScheduledAppointment', e);
                        }
                    } else {
                        console.warn('No DataTable lib found; using plain table DOM.');
                    }
                }

                // Delegated handlers for action buttons (single place to avoid multiple bindings)
                try {
                    // Remove previous delegated handlers to avoid duplicates
                    jQuery(document).off('click', '.btn-delete-appt');
                    jQuery(document).off('click', '.btn-edit-appt');

                    jQuery(document).on('click', '.btn-delete-appt', function (ev) {
                        ev.preventDefault();
                        var apptID = jQuery(this).attr('data-apptid');
                        var scope = angular.element(document.querySelector('[ng-controller="RGDCWebApplicationController"]')).scope();
                        if (!scope) return;
                        scope.$apply(function () {
                            try {
                                scope.openDeleteApptModal({ apptID: parseInt(apptID, 10) }, 'scheduled');
                            } catch (e) { console.error(e); }
                        });
                    });

                    jQuery(document).on('click', '.btn-edit-appt', function (ev) {
                        ev.preventDefault();
                        var apptID = jQuery(this).attr('data-apptid');
                        var scope = angular.element(document.querySelector('[ng-controller="RGDCWebApplicationController"]')).scope();
                        if (!scope) return;
                        // find appointment object from scope.adminAppointments
                        scope.$apply(function () {
                            var id = parseInt(apptID, 10);
                            var appt = (scope.adminAppointments || []).find(function (x) { return parseInt(x.apptID, 10) === id; });
                            try {
                                scope.openEditApptModal(appt, null);
                            } catch (e) { console.error(e); }
                        });
                    });

                    jQuery(document).on('click', '.btn-view-appt', function (ev) {
                        ev.preventDefault();
                        var apptID = jQuery(this).attr('data-apptid');
                        var scope = angular.element(document.querySelector('[ng-controller="RGDCWebApplicationController"]')).scope();
                        if (!scope) return;
                        // find appointment object from scope.adminAppointments
                        scope.$apply(function () {
                            var id = parseInt(apptID, 10);
                            var appt = (scope.adminAppointments || []).find(function (x) { return parseInt(x.apptID, 10) === id; });
                            try {
                                scope.openViewApptModal(appt, null);
                            } catch (e) { console.error(e); }
                        });
                    });

                    try {
                        jQuery(document).off('click', '.reschedule-btn');
                        jQuery(document).on('click', '.reschedule-btn', function (ev) {
                            ev.preventDefault();
                            var apptID = parseInt(jQuery(this).attr('data-apptid'), 10);
                            if (isNaN(apptID)) return;
                            var scope = angular.element(document.querySelector('[ng-controller="RGDCWebApplicationController"]')).scope();
                            if (!scope) return;
                            scope.$apply(function () {
                                var appt = (scope.adminAppointments || []).find(function (x) { return parseInt(x.apptID, 10) === apptID; });
                                if (!appt) {
                                    // try other lists
                                    appt = (scope.requestedAppointments || []).find(function (x) { return parseInt(x.apptID, 10) === apptID; });
                                }
                                if (appt && typeof scope.openRescheduleModal === 'function') {
                                    scope.openRescheduleModal(appt, null);
                                }
                            });
                        });
                    } catch (e) {
                        console.warn('Failed to attach reschedule delegated handler', e);
                    }
                } catch (e) {
                    console.warn('Failed to attach delegated action handlers for scheduled table', e);
                }
            } catch (e) {
                console.error('Failed to init/refresh admin scheduled DataTable:', e);
            }
        }, 60);
    }

    // Password visibility toggles
    $scope.showLoginPassword = false;
    $scope.showSignUpPassword = false;
    $scope.showSignUpConfPassword = false;
    $scope.showForgotPassword = false;

    $scope.toggleLoginPassword = function () {
        $scope.showLoginPassword = !$scope.showLoginPassword;
    };

    $scope.toggleSignUpPassword = function () {
        $scope.showSignUpPassword = !$scope.showSignUpPassword;
    };

    $scope.toggleSignUpConfPassword = function () {
        $scope.showSignUpConfPassword = !$scope.showSignUpConfPassword;
    };

    $scope.toggleForgotPassword = function () {
        $scope.showForgotPassword = !$scope.showForgotPassword;
    };

    $scope._uploadedSignUpPhotoPath = $scope._uploadedSignUpPhotoPath || null;
    $scope.signupPhotoPreview = $scope.signupPhotoPreview || null;

    $scope.pickSignUpPhoto = function () {
        var fileInput = document.getElementById('signUpPhotoInput');
        if (fileInput) fileInput.click();
    };

    $scope.onSignUpPhotoSelected = function (files) {
        if (!files || files.length === 0) return;
        var file = files[0];

        if (!file.type.startsWith('image/')) {
            Swal.fire({ icon: 'error', title: 'Invalid File', text: 'Please select an image file.' });
            return;
        }
        var maxSizeMB = 5;
        if (file.size > maxSizeMB * 1024 * 1024) {
            Swal.fire({ icon: 'error', title: 'File Too Large', text: 'Max allowed size is ' + maxSizeMB + ' MB.' });
            return;
        }

        var reader = new FileReader();
        reader.onload = function (e) {
            try {
                $scope.$apply(function () {
                    $scope.signupPhotoPreview = e.target.result;
                });
            } catch (ex) {
                $scope.signupPhotoPreview = e.target.result;
                try { $scope.$digest(); } catch (x) { }
            }
        };
        reader.readAsDataURL(file);


        RGDCWebApplicationService.uploadSignature(file)
            .then(function (resp) {
                var path = '';
                if (resp && resp.data) {
                    path = resp.data.filePath || resp.data.path || resp.data.imagePath || resp.data.url || '';
                }
                $scope._uploadedSignUpPhotoPath = path;
            })
            .catch(function (err) {
                console.error('Upload failed', err);
                Swal.fire({ icon: 'error', title: 'Upload Failed', text: 'Failed to upload photo.' });
            });
    };

    //for email duplication checker signup
    var _emailCheckTimeout = null;

    $scope.getSafePhotoUrl = function () {
        var placeholder = 'https://placehold.co/400';
        try {
            var p = ($scope.selectedPatient && $scope.selectedPatient.photoLink) ? String($scope.selectedPatient.photoLink).trim() : '';
            if (!p) return placeholder;
            if (/^https?:\/\//i.test(p)) return p;
            if (p.charAt(0) === '/') return window.location.origin + p;
            return window.location.origin + '/' + p;
        } catch (e) {
            return placeholder;
        }
    };


    $scope.onBackFromPatientProfile = function (evt) {
        if (evt && evt.preventDefault) evt.preventDefault();

        function navigate() {
            if ($scope.isUserPatient) {
                window.location.href = '/RGDC/adminDashboard';
            } else {
                window.location.href = '/RGDC/adminPatientsTab';
            }
        }

        if (typeof $scope.isUserPatient !== 'undefined' && $scope.isUserPatient !== null) {
            navigate();
            return;
        }

        $scope.getSessionVariables()
            .then(function () {
                navigate();
            })
            .catch(function () {
                window.location.href = '/RGDC';
            });
    };
    // ---- end new functions ----


    $scope._apptDurationMinutes = 120;
    $scope._slotIntervalMinutes = 30;
    $scope._businessStartHour = 8;
    $scope._businessEndHour = 18;


    $scope.statusOptions = [
        "Scheduled",
        "Checked-in",
        "Ongoing",
        "Completed",
        "No-show",
        "Cancelled",
        "Rescheduled"
    ];

    $scope.editingAppt = {
        apptID: null,
        dateObj: '',
        dateStr: '',
        timeStr: '',
        purpose: '',
        dentistName: '',
        patientName: '',
        status: 'Scheduled',
        remarks: ''
    };

    //rescheduling
    $scope.rescheduleRequest = {
        originalApptID: null,
        patientID: null,
        dentistID: null,
        dateTime: null, // ISO date string from Materialize datepicker
        time: "12:00 AM",
        reason: "",
        contactNumber: "",
        requesterName: "",
        dentistName: "",
        patientName: ""
    };

    $scope.rescheduleTimeOptions = [];

    function sanitizeContactNumber(raw) {
        var s = String(raw || '');
        // digits only
        s = s.replace(/\D/g, '');
        // keep max 11 digits
        if (s.length > 11) s = s.slice(0, 11);
        return s;
    }

    $scope.filterRescheduleContactNumber = function () {
        try {
            if (!$scope.rescheduleRequest) $scope.rescheduleRequest = {};
            $scope.rescheduleRequest.contactNumber = sanitizeContactNumber($scope.rescheduleRequest.contactNumber);
        } catch (_) { }
    };

    function isValidMobile09(s) {
        return /^09\d{9}$/.test(String(s || ''));
    }

    function refreshMaterializeSelect(selectId) {
        try {
            var el = document.getElementById(selectId);
            if (!el) return;
            if (typeof M !== 'undefined' && M && M.FormSelect) {

                try {
                    var existingInst = M.FormSelect.getInstance(el);
                    if (existingInst) existingInst.destroy();
                } catch (_) { }

                try {
                    // If select is already wrapped, unwrap it (remove the old wrapper)
                    var wrapper = el.closest ? el.closest('.select-wrapper') : null;
                    if (wrapper && wrapper.parentNode) {
                        var parent = wrapper.parentNode;
                        parent.insertBefore(el, wrapper);
                        parent.removeChild(wrapper);
                    }
                } catch (_) { }

                // Remove any leftover dropdown content siblings (defensive cleanup)
                try {
                    var parent2 = el.parentNode;
                    if (parent2) {
                        var leftovers = parent2.querySelectorAll ? parent2.querySelectorAll('.select-wrapper') : [];
                        // If any wrappers still exist alongside the select, remove them
                        for (var i = 0; i < leftovers.length; i++) {
                            if (leftovers[i] && leftovers[i].parentNode) leftovers[i].parentNode.removeChild(leftovers[i]);
                        }
                    }
                } catch (_) { }

                M.FormSelect.init(el);
            }
        } catch (_) { }
    }

    $scope.updateRescheduleTimeOptions = function () {
        try {
            $scope.rescheduleTimeOptions = [];
            if (!$scope.rescheduleRequest) return;

            var did = $scope.rescheduleRequest.dentistID;
            var dateStr = $scope.rescheduleRequest.dateTime;
            if (did === null || typeof did === 'undefined' || did === '' || !dateStr) {
                $scope.rescheduleTimeOptions = [];
                $scope.rescheduleRequest.time = null;
                return;
            }

            did = parseInt(did, 10);
            if (isNaN(did) || did < 0) {
                $scope.rescheduleTimeOptions = [];
                $scope.rescheduleRequest.time = null;
                return;
            }

            var dateObj = (typeof dateStr === 'string') ? new Date(dateStr) : new Date(dateStr);
            if (!dateObj || isNaN(dateObj.getTime())) {
                $scope.rescheduleTimeOptions = [];
                $scope.rescheduleRequest.time = null;
                return;
            }

            // Temporarily compute using the same schedule + taken slots logic as updateTimeOptions,
            // but write to rescheduleTimeOptions instead of timeOptions.
            var dow = dateObj.getDay();

            RGDCWebApplicationService.getDentistSchedule(did)
                .then(function (resp) {
                    var schedule = resp && resp.data ? resp.data : [];
                    var dayEntries = (Array.isArray(schedule) ? schedule : []).filter(function (s) {
                        return parseInt(s.dayOfWeek, 10) === parseInt(dow, 10);
                    });

                    var slots = [];
                    dayEntries.forEach(function (entry) {
                        var startMin = null, endMin = null, slotMins = 30;
                        if (typeof entry.startTime === 'string') startMin = parseTimeToMinutes(entry.startTime);
                        else if (entry.startTime && typeof entry.startTime === 'object' && entry.startTime.TotalMinutes) startMin = Math.floor(entry.startTime.TotalMinutes);
                        if (typeof entry.endTime === 'string') endMin = parseTimeToMinutes(entry.endTime);
                        else if (entry.endTime && typeof entry.endTime === 'object' && entry.endTime.TotalMinutes) endMin = Math.floor(entry.endTime.TotalMinutes);
                        if (entry.slotMinutes) slotMins = parseInt(entry.slotMinutes, 10) || 30;
                        if (startMin == null || endMin == null || endMin <= startMin) return;
                        var cur = startMin;
                        while (cur + 0 <= endMin - slotMins) {
                            slots.push(minutesToDisplay(cur));
                            cur += slotMins;
                        }
                    });

                    var unique = Array.from(new Set(slots));

                    // Exclude already-taken times for this dentist + date
                    return RGDCWebApplicationService.getAdminScheduledAppointments()
                        .then(function (resp2) {
                            var remote = resp2 && resp2.data ? (Array.isArray(resp2.data) ? resp2.data : []) : [];
                            var dayY = dateObj.getFullYear(), dayM = dateObj.getMonth(), dayD = dateObj.getDate();
                            var takenMinutes = new Set();

                            remote.forEach(function (a) {
                                try {
                                    var aDent = parseInt(a.dentistID || a.dentistAccID || a.accID || a.id, 10);
                                    if (isNaN(aDent) || aDent !== did) return;
                                    var aDate = parseJsonDateToJsDate(a.dateTime);
                                    if (!aDate) return;
                                    if (aDate.getFullYear() !== dayY || aDate.getMonth() !== dayM || aDate.getDate() !== dayD) return;
                                    // allow the original appointment slot to remain selectable
                                    if ($scope.rescheduleRequest && $scope.rescheduleRequest.originalApptID && a.apptID && String(a.apptID) === String($scope.rescheduleRequest.originalApptID)) {
                                        return;
                                    }
                                    takenMinutes.add(aDate.getHours() * 60 + aDate.getMinutes());
                                } catch (_) { }
                            });

                            function displayToMinutes(s) {
                                var m = String(s || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                                if (!m) return null;
                                var hh = parseInt(m[1], 10);
                                var mm = parseInt(m[2], 10);
                                var mer = (m[3] || 'AM').toUpperCase();
                                if (mer === 'PM' && hh !== 12) hh += 12;
                                if (mer === 'AM' && hh === 12) hh = 0;
                                return hh * 60 + mm;
                            }

                            $scope.rescheduleTimeOptions = unique.filter(function (t) {
                                var mins = displayToMinutes(t);
                                if (mins === null) return true;
                                return !takenMinutes.has(mins);
                            });

                            if ($scope.rescheduleRequest && $scope.rescheduleRequest.time && Array.isArray($scope.rescheduleTimeOptions)) {
                                if ($scope.rescheduleTimeOptions.indexOf($scope.rescheduleRequest.time) === -1) {
                                    $scope.rescheduleRequest.time = null;
                                }
                            }
                            $timeout(function () { }, 0);
                        })
                        .catch(function () {
                            $scope.rescheduleTimeOptions = unique;
                            $timeout(function () { }, 0);
                        });
                })
                .catch(function (err) {
                    console.error('updateRescheduleTimeOptions failed', err);
                    $scope.rescheduleTimeOptions = [];
                    $scope.rescheduleRequest.time = null;
                    $timeout(function () { }, 0);
                });
        } catch (ex) {
            console.error('updateRescheduleTimeOptions error', ex);
            $scope.rescheduleTimeOptions = [];
            try { $scope.rescheduleRequest.time = null; } catch (_) { }
            $timeout(function () { }, 0);
        }
    };

    $scope.openRescheduleModal = function (appt, $event) {
        if ($event && $event.preventDefault) {
            $event.preventDefault();
            if ($event.stopPropagation) $event.stopPropagation();
        }
        if (!appt || !appt.apptID) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No valid appointment selected.' });
            return;
        }

        // populate model
        $scope.rescheduleRequest = $scope.rescheduleRequest || {};
        $scope.rescheduleRequest.originalApptID = appt.apptID;
        $scope.rescheduleRequest.patientID = appt.patientID || null;
        $scope.rescheduleRequest.dentistID = appt.dentistID || null;
        $scope.rescheduleRequest.dentistName = appt.dentistName || "";
        $scope.rescheduleRequest.patientName = appt.patientName || "";
        $scope.rescheduleRequest.reason = ""; // requester should provide
        $scope.rescheduleRequest.contactNumber = ""; // requester provides
        $scope.rescheduleRequest.time = "12:00 AM";

        // Prefill requester name from session full name if available
        $scope.rescheduleRequest.requesterName = $scope.currentUserFullName || "";

        // open modal
        $timeout(function () {
            var modalElem = document.getElementById('modalRescheduleAppt');
            if (modalElem) {
                // If this modal was previously initialized with Materialize select,
                // it may have left behind a .select-wrapper overlay that blocks inputs.
                try {
                    var sel = document.getElementById('rescheduleTime');
                    if (sel) {
                        var wrap = sel.closest ? sel.closest('.select-wrapper') : null;
                        if (wrap && wrap.parentNode) {
                            var parent = wrap.parentNode;
                            parent.insertBefore(sel, wrap);
                            parent.removeChild(wrap);
                        }
                    }
                    // Also remove any other leftover wrappers inside the modal (defensive)
                    var leftovers = modalElem.querySelectorAll ? modalElem.querySelectorAll('.select-wrapper') : [];
                    for (var i = 0; i < leftovers.length; i++) {
                        if (leftovers[i] && leftovers[i].parentNode) leftovers[i].parentNode.removeChild(leftovers[i]);
                    }

                    // Materialize also inserts an input.select-dropdown + ul.dropdown-content which can overlay fields.
                    var fakeInputs = modalElem.querySelectorAll ? modalElem.querySelectorAll('input.select-dropdown') : [];
                    for (var j = 0; j < fakeInputs.length; j++) {
                        if (fakeInputs[j] && fakeInputs[j].parentNode) fakeInputs[j].parentNode.removeChild(fakeInputs[j]);
                    }
                    var dropdowns = modalElem.querySelectorAll ? modalElem.querySelectorAll('ul.dropdown-content') : [];
                    for (var k = 0; k < dropdowns.length; k++) {
                        if (dropdowns[k] && dropdowns[k].parentNode) dropdowns[k].parentNode.removeChild(dropdowns[k]);
                    }

                    // Ensure contact number input is not blocked/disabled
                    var contact = modalElem.querySelector ? modalElem.querySelector('input[ng-model="rescheduleRequest.contactNumber"]') : null;
                    if (contact) {
                        contact.disabled = false;
                        contact.readOnly = false;
                        contact.style.pointerEvents = 'auto';
                        contact.style.position = 'relative';
                        contact.style.zIndex = '2';
                    }
                } catch (_) { }

                var inst = M.Modal.getInstance(modalElem);
                if (!inst) inst = M.Modal.init(modalElem, {});
                inst.open();
            }
            // compute time options for this dentist/date selection
            try { $scope.updateRescheduleTimeOptions(); } catch (_) { }
        }, 60);
    };

    $scope.createRescheduleRequest = function () {
        // basic validation
        if (!$scope.rescheduleRequest || !$scope.rescheduleRequest.originalApptID) {
            return Swal.fire({ icon: 'error', title: 'Error', text: 'No appointment selected.' });
        }

        if (!$scope.rescheduleRequest.dateTime) {
            return Swal.fire({ icon: 'error', title: 'Missing Date', text: 'Select a new date.' });
        }

        if (!$scope.rescheduleRequest.time) {
            return Swal.fire({ icon: 'error', title: 'Missing Time', text: 'Select a new time.' });
        }

        if (!$scope.rescheduleRequest.reason || !$scope.rescheduleRequest.reason.trim()) {
            return Swal.fire({ icon: 'error', title: 'Missing Reason', text: 'Provide a reason for rescheduling.' });
        }

        // Some modal/overlay situations can prevent ng-model from updating reliably.
        // Pull the value directly from the input as a fallback before validating.
        try {
            if (!$scope.rescheduleRequest.contactNumber || !String($scope.rescheduleRequest.contactNumber).trim()) {
                var el = document.getElementById('rescheduleContactNumber');
                if (el && typeof el.value !== 'undefined') {
                    $scope.rescheduleRequest.contactNumber = el.value;
                }
            }
        } catch (_) { }

        if (!$scope.rescheduleRequest.contactNumber || !$scope.rescheduleRequest.contactNumber.trim()) {
            return Swal.fire({ icon: 'error', title: 'Missing Contact', text: 'Provide a contact number.' });
        }

        // normalize + validate contact number: digits only, 11 digits, starts with 09
        $scope.rescheduleRequest.contactNumber = sanitizeContactNumber($scope.rescheduleRequest.contactNumber);
        if (!isValidMobile09($scope.rescheduleRequest.contactNumber)) {
            return Swal.fire({ icon: 'error', title: 'Invalid Contact', text: 'Contact number must be 11 digits and start with 09 (e.g., 09XXXXXXXXX).' });
        }

        // parse date and time into JS Date
        var dateObj = (typeof $scope.rescheduleRequest.dateTime === 'string') ? new Date($scope.rescheduleRequest.dateTime) : new Date($scope.rescheduleRequest.dateTime);
        if (isNaN(dateObj.getTime())) {
            return Swal.fire({ icon: 'error', title: 'Invalid Date', text: 'Please select a valid date.' });
        }

        var tMatch = ($scope.rescheduleRequest.time || "12:00 AM").match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (!tMatch) {
            return Swal.fire({ icon: 'error', title: 'Invalid Time', text: 'Select a valid time.' });
        }
        var hours = parseInt(tMatch[1], 10);
        var minutes = parseInt(tMatch[2], 10);
        var mer = (tMatch[3] || '').toUpperCase();
        if (mer) {
            if (mer === 'PM' && hours !== 12) hours += 12;
            if (mer === 'AM' && hours === 12) hours = 0;
        }
        dateObj.setHours(hours, minutes, 0, 0);

        // re-check availability then submit
        RGDCWebApplicationService.getAdminScheduledAppointments()
            .then(function (resp) {
                var remote = resp && resp.data ? (Array.isArray(resp.data) ? resp.data : []) : [];
                var dentistNum = $scope.rescheduleRequest.dentistID;
                var conflict = remote.some(function (a) {
                    var aDate = parseJsonDateToJsDate(a.dateTime);
                    if (!aDate) return false;
                    var aDent = a.dentistID || a.dentistAccID || null;
                    if (aDent !== null && aDent !== undefined && aDent !== dentistNum) return false;
                    return aDate.getFullYear() === dateObj.getFullYear() &&
                        aDate.getMonth() === dateObj.getMonth() &&
                        aDate.getDate() === dateObj.getDate() &&
                        aDate.getHours() === dateObj.getHours() &&
                        aDate.getMinutes() === dateObj.getMinutes();
                });

                if (conflict) {
                    Swal.fire({ icon: 'error', title: 'Time Taken', text: 'The selected time is no longer available. Please choose another slot.' });
                    $scope.loadAdminScheduledAppointments();
                    return;
                }

                // build payload using the same AppointmentRequestData shape (includes originalApptID, contactNumber, requesterName)
                var payload = {
                    patientID: parseInt($scope.rescheduleRequest.patientID, 10),
                    dentistID: parseInt($scope.rescheduleRequest.dentistID, 10),
                    dateTime: dateObj,
                    reason: $scope.rescheduleRequest.reason,
                    originalApptID: parseInt($scope.rescheduleRequest.originalApptID, 10),
                    contactNumber: $scope.rescheduleRequest.contactNumber,
                    requesterName: $scope.rescheduleRequest.requesterName
                };

                RGDCWebApplicationService.createAppointmentRequest(payload)
                    .then(function (response) {
                        if (response && response.data && response.data.success) {
                            Swal.fire({ icon: 'success', title: 'Requested', text: 'Reschedule request sent.' }).then(function () {
                                // close modal
                                var modalElem = document.getElementById('modalRescheduleAppt');
                                if (modalElem) {
                                    var inst = M.Modal.getInstance(modalElem);
                                    if (inst) inst.close();
                                }
                                // refresh lists
                                $scope.loadRequestedAppointments();
                                $scope.loadAdminScheduledAppointments();
                            });
                        } else {
                            Swal.fire({ icon: 'error', title: 'Error', text: (response && response.data && response.data.message) || 'Failed to send reschedule request.' });
                        }
                    })
                    .catch(function (err) {
                        console.error('createRescheduleRequest error', err);
                        Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred while sending the request.' });
                    });
            })
            .catch(function (err) {
                console.error('availability check error', err);
                Swal.fire({ icon: 'error', title: 'Error', text: 'Unable to check availability. Try again later.' });
            });
    };

    // keep reschedule time options synced
    $scope.$watch('rescheduleRequest.dentistID', function () {
        try { $scope.updateRescheduleTimeOptions(); } catch (_) { }
    });
    $scope.$watch('rescheduleRequest.dateTime', function () {
        try { $scope.updateRescheduleTimeOptions(); } catch (_) { }
    });

    $scope.canActOnRequest = function (appt) {
        if (!appt) return false;

        try {
            // Only pending requests can be accepted/denied.
            if (String(appt.status || '').toLowerCase() !== 'requested') return false;

            // current logged-in acc id (session)
            var curAcc = $scope.currentUserID ? String($scope.currentUserID) : null;

            // If current user is the creator/sender -> cannot act
            if (curAcc && appt.createdBy != null && appt.createdBy !== undefined && String(appt.createdBy) === curAcc) return false;

            // Front desk: handle requests for any dentist/patient (server enforces the same)
            if ($scope.isUserStaff === true) return true;

            // Owner/admin allow (UI can still call server; server double-checks)
            var auth = String($scope.currentUserAuthorization || "");
            if (auth === "0" || auth === "1") return true;

            // If appointment has dentistID and currentDentist is loaded, allow if match
            try {
                if ($scope.currentDentist && $scope.currentDentist.dentistID != null && appt.dentistID != null && !isNaN(parseInt(appt.dentistID, 10))) {
                    if (parseInt($scope.currentDentist.dentistID, 10) === parseInt(appt.dentistID, 10)) return true;
                }
            } catch (e) { /* ignore */ }

            // If current user is patient and we resolved their patientID (_ownPatientID), allow if matches appt.patientID
            try {
                if ($scope._ownPatientID != null && appt.patientID != null && !isNaN(parseInt(appt.patientID, 10))) {
                    if (parseInt($scope._ownPatientID, 10) === parseInt(appt.patientID, 10)) return true;
                }
            } catch (e) { /* ignore */ }

            // As fallback, compare currentUserFullName to dentistName or patientName (best-effort)
            try {
                if ($scope.currentUserFullName && appt.dentistName && String($scope.currentUserFullName).trim() === String(appt.dentistName).trim()) return true;
                if ($scope.currentUserFullName && appt.patientName && String($scope.currentUserFullName).trim() === String(appt.patientName).trim()) return true;
            } catch (e) { /* ignore */ }
        } catch (ex) {
            console.warn('canActOnRequest error', ex);
        }

        return false;
    };

    // For pending requested rows: creator can cancel their own request.
    $scope.isRequestCreator = function (appt) {
        try {
            if (!appt) return false;
            var curAcc = $scope.currentUserID ? String($scope.currentUserID) : null;
            if (!curAcc) return false;
            if (appt.createdBy == null || appt.createdBy === undefined) return false;
            return String(appt.createdBy) === curAcc;
        } catch (_) {
            return false;
        }
    };

    $scope.isRequestedStatus = function (appt) {
        try {
            return String((appt && appt.status) || '').toLowerCase() === 'requested';
        } catch (_) {
            return false;
        }
    };

    $scope.isDeniedStatus = function (appt) {
        try {
            return String((appt && appt.status) || '').toLowerCase() === 'denied';
        } catch (_) {
            return false;
        }
    };

    $scope.cancelRequestedAppointment = function (appt) {
        if (!$scope.isRequestedStatus(appt)) {
            return Swal.fire({ icon: 'info', title: 'Not Pending', text: 'Only pending requests can be cancelled.' });
        }
        // Reuse existing cancel flow (includes server-side enforcement)
        return $scope.cancelAppointment(appt);
    };

    // For denied requests: creator can "delete" which archives it into Past Appointments.
    $scope.deleteDeniedRequest = function (appt) {
        try {
            if (!appt || !appt.apptID) return Swal.fire({ icon: 'error', title: 'Error', text: 'No appointment selected.' });
            if (!$scope.isRequestCreator(appt)) return Swal.fire({ icon: 'error', title: 'Not allowed', text: 'Only the creator can delete this request.' });
            if (!$scope.isDeniedStatus(appt)) {
                return Swal.fire({ icon: 'info', title: 'Not Denied', text: 'Only denied requests can be deleted from this list.' });
            }

            Swal.fire({
                title: 'Delete Denied Request?',
                text: 'This will remove it from Requested and move it to Past Appointments.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Delete'
            }).then(function (res) {
                if (!res.isConfirmed) return;
                Swal.fire({ title: 'Processing...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

                RGDCWebApplicationService.archiveAppointment({ apptID: appt.apptID })
                    .then(function (resp) {
                        Swal.close();
                        if (resp && resp.data && resp.data.success) {
                            Swal.fire({ icon: 'success', title: 'Deleted', text: resp.data.message || 'Moved to Past Appointments.' }).then(function () {
                                $scope.loadRequestedAppointments();
                                $scope.loadPastAppointments();
                            });
                        } else {
                            Swal.fire({ icon: 'error', title: 'Error', text: (resp && resp.data && resp.data.message) || 'Failed to delete denied request.' });
                        }
                    })
                    .catch(function (err) {
                        Swal.close();
                        console.error('deleteDeniedRequest error', err);
                        Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred while deleting the denied request.' });
                    });
            });
        } catch (e) {
            console.error('deleteDeniedRequest failed', e);
        }
    };

    function parseTimeToMinutes(t) {
        if (!t) return null;
        // accept "hh:mm" or "HH:mm:ss" or "hh:mm:ss"
        var parts = String(t).split(':');
        if (parts.length < 2) return null;
        var hh = parseInt(parts[0], 10);
        var mm = parseInt(parts[1], 10);
        if (isNaN(hh) || isNaN(mm)) return null;
        return hh * 60 + mm;
    }

    // Format minutes since midnight to "h:mm AM/PM"
    function minutesToDisplay(m) {
        var hh = Math.floor(m / 60);
        var mm = m % 60;
        var mer = 'AM';
        if (hh >= 12) mer = 'PM';
        var dispH = hh % 12;
        if (dispH === 0) dispH = 12;
        return dispH + ':' + String(mm).padStart(2, '0') + ' ' + mer;
    }

    // Compute time options for selected dentist/date
    $scope.updateTimeOptions = function () {
        try {
            $scope.timeOptions = [];
            if (!$scope.newApptRequest) $scope.newApptRequest = {};
            var did = $scope.newApptRequest.dentistID;
            var dateStr = $scope.newApptRequest.dateTime;
            if (!did || !dateStr) {
                // no dentist or date selected -> keep default global timeOptions if any
                $scope.timeOptions = [];
                return;
            }

            var dateObj = (typeof dateStr === 'string') ? new Date(dateStr) : new Date(dateStr);
            if (!dateObj || isNaN(dateObj.getTime())) {
                $scope.timeOptions = [];
                return;
            }
            var dow = dateObj.getDay(); // 0..6

            // call server for dentist schedule
            RGDCWebApplicationService.getDentistSchedule(did)
                .then(function (resp) {
                    var schedule = resp && resp.data ? resp.data : [];
                    // filter for this dayOfWeek
                    var dayEntries = (Array.isArray(schedule) ? schedule : []).filter(function (s) {
                        return parseInt(s.dayOfWeek, 10) === parseInt(dow, 10);
                    });

                    var slots = [];
                    dayEntries.forEach(function (entry) {
                        // entry.startTime may be serialized as "hh:mm:ss" or TimeSpan-like
                        var startMin = null, endMin = null, slotMins = 30;
                        if (typeof entry.startTime === 'string') {
                            startMin = parseTimeToMinutes(entry.startTime);
                        } else if (entry.startTime && typeof entry.startTime === 'object' && entry.startTime.TotalMinutes) {
                            startMin = Math.floor(entry.startTime.TotalMinutes);
                        }
                        if (typeof entry.endTime === 'string') {
                            endMin = parseTimeToMinutes(entry.endTime);
                        } else if (entry.endTime && typeof entry.endTime === 'object' && entry.endTime.TotalMinutes) {
                            endMin = Math.floor(entry.endTime.TotalMinutes);
                        }
                        if (entry.slotMinutes) slotMins = parseInt(entry.slotMinutes, 10) || 30;
                        if (startMin == null || endMin == null || endMin <= startMin) return;

                        var cur = startMin;
                        while (cur + 0 <= endMin - slotMins) {
                            slots.push(minutesToDisplay(cur));
                            cur += slotMins;
                        }
                    });

                    // remove duplicates & sort by actual minutes
                    var unique = Array.from(new Set(slots));
                    unique.sort(function (a, b) {
                        // convert "h:mm AM/PM" back to minutes for sorting
                        function toMinFromDisplay(s) {
                            var m = s.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                            if (!m) return 0;
                            var hh = parseInt(m[1], 10);
                            var mm = parseInt(m[2], 10);
                            var mer = (m[3] || 'AM').toUpperCase();
                            if (mer === 'PM' && hh !== 12) hh += 12;
                            if (mer === 'AM' && hh === 12) hh = 0;
                            return hh * 60 + mm;
                        }
                        return toMinFromDisplay(a) - toMinFromDisplay(b);
                    });

                    // Exclude already-taken times (scheduled appointments) for this dentist + date.
                    RGDCWebApplicationService.getAdminScheduledAppointments()
                        .then(function (resp2) {
                            // Prefer the already-mapped $scope.adminAppointments (has dateTimeObj + normalized dentistID)
                            // to avoid timezone/parsing mismatches from raw /Date(...)/ strings.
                            var remote = (Array.isArray($scope.adminAppointments) && $scope.adminAppointments.length > 0)
                                ? $scope.adminAppointments
                                : (resp2 && resp2.data ? (Array.isArray(resp2.data) ? resp2.data : []) : []);
                            var dayY = dateObj.getFullYear(), dayM = dateObj.getMonth(), dayD = dateObj.getDate();
                            var takenMinutes = new Set();

                            remote.forEach(function (a) {
                                try {
                                    var aDent = parseInt(a.dentistID || a.dentistAccID || a.accID || a.id, 10);
                                    if (isNaN(aDent) || aDent !== parseInt(did, 10)) return;
                                    var aDate = a.dateTimeObj || parseJsonDateToJsDate(a.dateTime) || parseJsonDateToJsDate(a.date) || null;
                                    if (!aDate) return;
                                    if (aDate.getFullYear() !== dayY || aDate.getMonth() !== dayM || aDate.getDate() !== dayD) return;
                                    takenMinutes.add(aDate.getHours() * 60 + aDate.getMinutes());
                                } catch (_) { }
                            });

                            function displayToMinutes(s) {
                                var m = s.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                                if (!m) return null;
                                var hh = parseInt(m[1], 10);
                                var mm = parseInt(m[2], 10);
                                var mer = (m[3] || 'AM').toUpperCase();
                                if (mer === 'PM' && hh !== 12) hh += 12;
                                if (mer === 'AM' && hh === 12) hh = 0;
                                return hh * 60 + mm;
                            }

                            $scope.timeOptions = unique.filter(function (t) {
                                var mins = displayToMinutes(t);
                                if (mins === null) return true;
                                return !takenMinutes.has(mins);
                            });

                            // If previously selected time is now invalid, clear it
                            try {
                                if ($scope.newApptRequest && $scope.newApptRequest.time && Array.isArray($scope.timeOptions)) {
                                    if ($scope.timeOptions.indexOf($scope.newApptRequest.time) === -1) {
                                        $scope.newApptRequest.time = null;
                                    }
                                }
                            } catch (_) { }

                            $timeout(function () { }, 0);
                        })
                        .catch(function () {
                            // fallback: show schedule-derived slots only
                            $scope.timeOptions = unique;
                            $timeout(function () { }, 0);
                        });
                })
                .catch(function (err) {
                    console.error('Failed to load dentist schedule', err);
                    $scope.timeOptions = [];
                });
        } catch (ex) {
            console.error('updateTimeOptions error', ex);
            $scope.timeOptions = [];
        }
    };

    $scope.$watch('newApptRequest.dentistID', function (nv) {
        try { $scope.updateTimeOptions(); } catch (e) { }
    });

    $scope.$watch('newApptRequest.dateTime', function (nv) {
        try { $scope.updateTimeOptions(); } catch (e) { }
    });

    $scope.initModalScheduleDays = function () {
        // Keep schedule times as "HH:mm" strings.
        // Converting to Date objects causes some browsers to render them as "08:00:00.000 AM" and breaks validation.
        if (!$scope.modalScheduleDays || !Array.isArray($scope.modalScheduleDays)) return;
        $scope.modalScheduleDays.forEach(function (d) {
            try {
                // normalize common string formats to HH:mm
                var st = formatTimeToHHMM(d.startTime);
                var et = formatTimeToHHMM(d.endTime);
                d.startTime = st || '08:00';
                d.endTime = et || '12:00';
                d.slotMinutes = (typeof d.slotMinutes === 'number') ? d.slotMinutes : parseInt(d.slotMinutes, 10) || 30;
            } catch (e) {
                console.warn('initModalScheduleDays normalize failed for', d, e);
            }
        });
    };

    try { $scope.initModalScheduleDays(); } catch (e) { /* safe fallback */ }

    // Build API payload from modal model
    $scope._buildDentistSchedulePayload = function (accID) {
        var payload = [];
        $scope.modalScheduleDays.forEach(function (d) {
            if (!d || !d.enabled) return;
            // convert Date (or string) model to "HH:mm"
            var start = formatTimeToHHMM(d.startTime) || '';
            var end = formatTimeToHHMM(d.endTime) || '';
            if (!start || !end) return;
            payload.push({
                dentistID: accID,
                dayOfWeek: parseInt(d.dayOfWeek, 10),
                startTime: start,
                endTime: end,
                slotMinutes: parseInt(d.slotMinutes || 30, 10)
            });
        });
        return payload;
    };

    // Persist schedule to server (called after dentist record is created)
    $scope.persistDentistScheduleAfterSignup = function (dentistAccID) {
        return new Promise(function (resolve, reject) {
            try {
                if (!dentistAccID) return resolve(); // nothing to persist
                var arr = Array.isArray($scope.modalScheduleDays) ? $scope.modalScheduleDays : [];
                var payload = arr.filter(function (d) { return !!d && !!d.enabled; }).map(function (d) {
                    var st = formatTimeToHHMM(d.startTime) || '';
                    var et = formatTimeToHHMM(d.endTime) || '';
                    return {
                        dentistID: dentistAccID,
                        dayOfWeek: parseInt(d.dayOfWeek, 10),
                        // Send HH:mm:ss for MVC TimeSpan binding reliability
                        startTime: st ? (st + ':00') : '',
                        endTime: et ? (et + ':00') : '',
                        slotMinutes: parseInt(d.slotMinutes, 10) || 30
                    };
                });

                if (!payload || payload.length === 0) return resolve();

                RGDCWebApplicationService.saveDentistSchedule(payload)
                    .then(function (resp) { resolve(resp); })
                    .catch(function (err) { console.error('saveDentistSchedule failed', err); reject(err); });
            } catch (e) {
                console.error('persistDentistScheduleAfterSignup error', e);
                reject(e);
            }
        });
    };

    $scope.openScheduleModal = function () {
        try {
            $scope.initModalScheduleDays();
            var modalElem = document.getElementById('modalSchedule');
            if (!modalElem) return;

            // Materialize does not support true nested modals well.
            // If the signup info form modal is open, close it first so the schedule modal can receive clicks.
            try {
                var parent = document.getElementById('modalInfoForm');
                if (parent && typeof M !== 'undefined' && M && M.Modal) {
                    var parentInst = M.Modal.getInstance(parent);
                    if (parentInst && parent.classList.contains('open')) {
                        parentInst.close();
                    }
                }
            } catch (_) { }

            if (typeof M !== 'undefined' && M && M.Modal) {
                var inst = M.Modal.getInstance(modalElem);
                if (!inst) inst = M.Modal.init(modalElem, { dismissible: false });
                inst.open();
            } else {
                modalElem.style.display = "block";
            }
        } catch (e) {
            console.error('openScheduleModal error', e);
        }
    };

    function formatTimeToHHMM(dt) {
        if (!dt && dt !== 0) return null;
        if (dt instanceof Date && !isNaN(dt.getTime())) {
            var hh = dt.getHours().toString().padStart(2, '0');
            var mm = dt.getMinutes().toString().padStart(2, '0');
            return hh + ':' + mm;
        }
        // If string already "HH:mm", return as-is (validate)
        if (typeof dt === 'string') {
            var s = dt.trim();
            var m = s.match(/^(\d{1,2}):(\d{2})$/);
            if (m) return m[1].padStart(2, '0') + ':' + m[2];

            // "HH:mm:ss"
            var m2 = s.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
            if (m2) return m2[1].padStart(2, '0') + ':' + m2[2];

            // "08:00:00.000 AM"
            var m3 = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?\s*(AM|PM)$/i);
            if (m3) {
                var hh3 = parseInt(m3[1], 10);
                var mm3 = parseInt(m3[2], 10);
                var mer = (m3[4] || '').toUpperCase();
                if (mer === 'PM' && hh3 !== 12) hh3 += 12;
                if (mer === 'AM' && hh3 === 12) hh3 = 0;
                return String(hh3).padStart(2, '0') + ':' + String(mm3).padStart(2, '0');
            }
        }
        return null;
    }

    $scope.closeScheduleModal = function () {
        try {
            var modalElem = document.getElementById('modalSchedule');
            if (modalElem && typeof M !== 'undefined' && M && M.Modal) {
                var inst = M.Modal.getInstance(modalElem);
                if (inst) inst.close();
            }

            // Re-open the parent info modal so user can continue signup
            var parent = document.getElementById('modalInfoForm');
            if (parent && typeof M !== 'undefined' && M && M.Modal) {
                var parentInst = M.Modal.getInstance(parent);
                if (!parentInst) parentInst = M.Modal.init(parent, {});
                parentInst.open();
            }
        } catch (e) {
            console.error('closeScheduleModal error', e);
        }
    };
});
