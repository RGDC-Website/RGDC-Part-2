app.controller("RGDCWebApplicationController", function ($scope, RGDCWebApplicationService) {

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
            $scope.pwdChecks = { length:false, upper:false, lower:false, number:false, special:false };
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

    $scope.emailChecks = { hasAt:false, noSpace:true, hasDotAfterAt:false };

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
                if (modal ) {
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

    $scope.getGender = function (){
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
                    signUp.then(function () {
                         window.location.href = "/RGDC/logIn";
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
            if ($scope.currentUserAuthorization == "0") {
                $scope.isUserOwner = true;
                $scope.isUserAdmin = true;
            } else if ($scope.currentUserAuthorization == "1" || currentUserAuthorization == "2") {
                $scope.isUserAdmin = true;
            } else if ($scope.currentUserAuthorization == "3") {
                $scope.isUserPatient = true;
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
});
