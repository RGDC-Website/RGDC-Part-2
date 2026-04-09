using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Services;
using Microsoft.Ajax.Utilities;
using MySql.Data.MySqlClient;
using MySqlX.XDevAPI.Common;
using System.Data.Entity;
using Newtonsoft.Json;
using RGDC_Web_Application.Models;
using RGDC_Web_Application.Models.Context;
using RGDC_Web_Application.Models.Map;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Management.Instrumentation;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Mail;
using System.Runtime.ConstrainedExecution;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Web.Helpers;
using System.Web.Mvc;
using static System.Net.Mime.MediaTypeNames;


namespace RGDC_Web_Application.Controllers
{
    public class RGDCController : Controller
    {
        public ActionResult signUp()
        {
            return View();
        }

        public JsonResult GetCurrentDentist()
        {
            try
            {
                var sessionVal = Session["UserID"];
                if (sessionVal == null) return Json(new { success = false, message = "Not logged in" }, JsonRequestBehavior.AllowGet);
                if (!int.TryParse(sessionVal.ToString(), out int accID)) return Json(new { success = false, message = "Invalid user" }, JsonRequestBehavior.AllowGet);

                using (var db = new RGDCContext())
                {
                    var dent = db.tbl_dentist.FirstOrDefault(d => d.accID == accID);
                    if (dent == null) return Json(new { success = false, message = "No dentist record" }, JsonRequestBehavior.AllowGet);
                    var acc = db.tbl_account.FirstOrDefault(a => a.accID == accID);
                    var name = acc != null ? acc.firstName + " " + acc.lastName : null;
                    return Json(new { success = true, dentistID = dent.dentistID, dentistName = name }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult DeleteAppointment(int apptID)
        {
            try
            {
                if (apptID <= 0)
                    return Json(new { success = false, message = "Invalid appointment ID." });

                using (var db = new RGDCContext())
                {
                    var appt = db.tbl_appointment.FirstOrDefault(a => a.apptID == apptID);
                    if (appt == null)
                        return Json(new { success = false, message = "Appointment not found." });

                    db.tbl_appointment.Remove(appt);
                    db.SaveChanges();

                    return Json(new { success = true, message = "Appointment deleted successfully." });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error deleting appointment: {ex.Message}" });
            }
        }

        public ActionResult adminDashboard()
        {
            return View();
        }

        public ActionResult logIn()
        {
            return View();
        }


        public ActionResult adminPatientsTab()
        {
            return View();
        }

        public ActionResult patientDashboard()
        {
            return View();
        }

        public ActionResult adminFinance()
        {
            return View();
        }

        public ActionResult adminAppointment()
        {
            return View();
        }

        public ActionResult adminClinicStaffTab()
        {
            return View();
        }

        public ActionResult staffDashboard()
        {
            return View();
        }
        public ActionResult dentistDashboard()
        {
            return View();
        }

        public ActionResult staffPatientsTab()
        {
            return View();
        }
        public ActionResult staffFinance()
        {
            return View();
        }
        public ActionResult dentistPatientsTab()
        {
            return View();
        }

        public ActionResult dentistFinance()
        {
            return View();
        }

        public ActionResult contactUsPage()
        {
            return View();
        }

        public ActionResult faqPage()
        {
            return View();
        }

        [HttpPost]
        public JsonResult CheckEmail(string email, int? excludeAccID = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(email))
                    return Json(new { exists = false }, JsonRequestBehavior.AllowGet);

                var normalized = email.Trim().ToLowerInvariant();

                using (var db = new RGDCContext())
                {
                    var exists = db.tbl_account
                        .Any(a => a.email != null
                                  && a.email.Trim().ToLower() == normalized
                                  && (!excludeAccID.HasValue || a.accID != excludeAccID.Value));

                    return Json(new { exists = exists }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { exists = false, error = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult getGender()
        {
            try
            {
                using (var db = new RGDCContext())
                {
                    var getData = db.tbl_gender.ToList();
                    return Json(getData, JsonRequestBehavior.AllowGet);

                }
            }
            catch (Exception ex)
            {
                throw new ArgumentException($"There is an error {ex.Message}");
            }
        }

        public JsonResult getBranch()
        {
            try
            {
                using (var db = new RGDCContext())
                {
                    var getData = db.tbl_branch.ToList();
                    return Json(getData, JsonRequestBehavior.AllowGet);

                }
            }
            catch (Exception ex)
            {
                throw new ArgumentException($"There is an error {ex.Message}");
            }
        }
        [HttpPost]
        public JsonResult signUpAcc(tblAccountModel accDetails)
        {
            var role = Session["UserAuthorization"] != null ? Session["UserAuthorization"].ToString() : null;
            // Block staff from creating patient records
            if (role == "1")
                return Json(new { success = false, message = "Not authorized" }, JsonRequestBehavior.AllowGet);
            try
            {
                using (var addUser = new RGDCContext())
                {
                    var newData = new tblAccountModel()
                    {
                        firstName = accDetails.firstName,
                        middleName = accDetails.middleName,
                        lastName = accDetails.lastName,
                        genderID = accDetails.genderID,
                        birthDate = accDetails.birthDate,
                        email = accDetails.email,
                        contactNumber = accDetails.contactNumber,
                        address = accDetails.address,
                        civilStatus = accDetails.civilStatus,
                        password = passwordHash(accDetails.password),
                        lastLogin = DateTime.Now,
                        accCreatedAt = DateTime.Now,
                        accUpdatedAt = DateTime.Now,
                        photoLink = accDetails.photoLink,
                        role = accDetails.role > 0 ? accDetails.role : 3
                    };
                    addUser.tbl_account.Add(newData);
                    addUser.SaveChanges();

                    if (newData.role == 3)
                    {
                        var patient = new tblPatientModel()
                        {
                            accID = newData.accID,
                            currentPhysician = string.Empty,
                            referral = string.Empty,
                            lastVisit = DateTime.Now,
                            medicalHistory = string.Empty,
                            medHistUpdate = DateTime.Now,
                            lastUpdated = DateTime.Now
                        };

                        addUser.tbl_patient.Add(patient);
                        addUser.SaveChanges();
                    }

                    return Json(new
                    {
                        accID = newData.accID
                    }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                var inner = ex.InnerException?.InnerException?.Message;
                throw new Exception(inner ?? ex.Message);
            }
        }

        [HttpPost]
        public JsonResult signUpPatient(tblPatientModel accDetails)
        {
            try
            {
                using (var db = new RGDCContext())
                {
                    var existing = db.tbl_patient.FirstOrDefault(p => p.accID == accDetails.accID);
                    if (existing != null)
                    {
                        return Json(new
                        {
                            success = false,
                            message = "Patient record already exists for this account.",
                            patientID = existing.patientID
                        }, JsonRequestBehavior.AllowGet);
                    }

                    var newData = new tblPatientModel()
                    {
                        accID = accDetails.accID,
                        currentPhysician = accDetails.currentPhysician,
                        referral = accDetails.referral,
                        lastVisit = accDetails.lastVisit,
                        medicalHistory = accDetails.medicalHistory,
                        medHistUpdate = DateTime.Now,
                        lastUpdated = DateTime.Now
                    };

                    db.tbl_patient.Add(newData);
                    db.SaveChanges();

                    return Json(new
                    {
                        success = true,
                        message = "Patient inserted successfully.",
                        patientID = newData.patientID
                    }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = ex.Message
                }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult login(string email, string password)
        {
            try
            {
                if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
                {
                    return Json(new { success = false, message = "Email and password are required" }, JsonRequestBehavior.AllowGet);
                }

                const int MAX_FAILED_ATTEMPTS = 3;
                const int LOCKOUT_MINUTES = 15;
                string failKey = $"LOGIN_FAIL_{email}";
                string lockKey = $"LOGIN_LOCK_{email}";

                if (Session[lockKey] != null)
                {
                    if (DateTime.TryParse(Session[lockKey].ToString(), out DateTime lockedUntil))
                    {
                        if (lockedUntil > DateTime.Now)
                        {
                            return Json(new { success = false, message = $"Account locked until {lockedUntil.ToString("g")}" }, JsonRequestBehavior.AllowGet);
                        }
                        else
                        {
                            Session.Remove(lockKey);
                        }
                    }
                    else
                    {
                        Session.Remove(lockKey);
                    }
                }


                using (var db = new RGDCContext())
                {
                    var hashedPassword = passwordHash(password);
                    var user = db.tbl_account.FirstOrDefault(u =>
                        u.email == email && u.password == hashedPassword);

                    if (user != null)
                    {
                        // Set session variables
                        Session.Remove(failKey);
                        Session.Remove(lockKey);
                        Session["UserID"] = user.accID;
                        Session["UserName"] = user.firstName;
                        Session["UserFullName"] = user.firstName + " " + user.lastName;
                        Session["UserAuthorization"] = user.role;
                        Session["IsLoggedIn"] = true;
                        Session["UserPhoto"] = string.IsNullOrEmpty(user.photoLink) ? "" : user.photoLink;

                        return Json(new
                        {
                            success = true,
                            message = "Login successful",
                            firstName = Session["UserName"].ToString(),
                            fullName = Session["UserFullName"].ToString(),
                            authorization = user.role,
                            photoLink = Session["UserPhoto"].ToString()
                        }, JsonRequestBehavior.AllowGet);
                    }
                    else
                    {
                        int failedAttempts = 0;
                        if (Session[failKey] != null)
                        {
                            int.TryParse(Session[failKey].ToString(), out failedAttempts);
                        }

                        failedAttempts++;
                        Session[failKey] = failedAttempts;

                        if (failedAttempts >= MAX_FAILED_ATTEMPTS)
                        {
                            var lockedUntil = DateTime.Now.AddMinutes(LOCKOUT_MINUTES);
                            Session[lockKey] = lockedUntil;
                            Session.Remove(failKey);

                            return Json(new
                            {
                                success = false,
                                message = $"Account locked due to {MAX_FAILED_ATTEMPTS} failed attempts. Try again after {lockedUntil.ToString("g")}"
                            }, JsonRequestBehavior.AllowGet);
                        }
                        else
                        {
                            int remaining = MAX_FAILED_ATTEMPTS - failedAttempts;
                            return Json(new { success = false, message = $"Invalid email or password. {remaining} attempt(s) left." }, JsonRequestBehavior.AllowGet);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error during login: {ex.Message}" }, JsonRequestBehavior.AllowGet);
            }
        }

        //Google Auth
        [AllowAnonymous]
        public void ExternalLogin(string provider)
        {
            if (!string.Equals(provider, "Google", StringComparison.OrdinalIgnoreCase))
            {
                Response.Redirect(Url.Action("", "RGDC"));
                return;
            }
            string clientId = ConfigurationManager.AppSettings["GoogleClientId"];
            string redirectUri = "https://localhost:44357/RGDC/ExternalLoginCallback";

            string googleUrl = $"https://accounts.google.com/o/oauth2/v2/auth?" +
                               $"client_id={clientId}&" +
                               $"redirect_uri={HttpUtility.UrlEncode(redirectUri)}&" +
                               $"response_type=code&" +
                               $"scope=openid%20email%20profile&" +
                               $"state={Guid.NewGuid()} dbo.[spInsertAudit]";


            Response.Redirect(googleUrl);
        }

        [AllowAnonymous]
        public async Task<ActionResult> ExternalLoginCallback(string code)
        {
            if (string.IsNullOrEmpty(code)) return RedirectToAction("");

            string clientId = ConfigurationManager.AppSettings["GoogleClientId"];
            string clientSecret = ConfigurationManager.AppSettings["GoogleClientSecret"];
            string redirectUri = "https://localhost:44357/RGDC/ExternalLoginCallback";

            using (HttpClient client = new HttpClient())
            {
                var values = new Dictionary<string, string>
        {
            { "code", code },
            { "client_id", clientId },
            { "client_secret", clientSecret },
            { "redirect_uri", redirectUri },
            { "grant_type", "authorization_code" }
        };

                var response = await client.PostAsync("https://oauth2.googleapis.com/token",
                                   new FormUrlEncodedContent(values));

                if (!response.IsSuccessStatusCode)
                    return Content(await response.Content.ReadAsStringAsync());

                var tokenData = JsonConvert.DeserializeObject<Dictionary<string, dynamic>>(
                                    await response.Content.ReadAsStringAsync());

                if (!tokenData.ContainsKey("access_token"))
                    return RedirectToAction("", "RGDC");

                string accessToken = tokenData["access_token"];
                client.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", accessToken);

                var userInfo = JsonConvert.DeserializeObject<Dictionary<string, dynamic>>(
                                   await client.GetStringAsync("https://www.googleapis.com/oauth2/v2/userinfo"));

                string email = userInfo["email"].ToString();

                // Set Forms Auth cookie
                System.Web.Security.FormsAuthentication.SetAuthCookie(email, false);

                // Secure session cookie
                if (Response.Cookies["ASP.NET_SessionId"] != null)
                {
                    Response.Cookies["ASP.NET_SessionId"].HttpOnly = true;
                    Response.Cookies["ASP.NET_SessionId"].Secure = Request.IsSecureConnection;
                }

 
                using (var db = new RGDCContext())
                {
                    var user = db.tbl_account.FirstOrDefault(u => u.email == email);

                    if (user == null)
                    {

                        Session["UserEmail"] = email;
                        Session["IsLoggedIn"] = false;
                        return RedirectToAction("signUp", "RGDC");
                    }


                    Session["UserID"] = user.accID;
                    Session["UserEmail"] = email;
                    Session["UserName"] = user.firstName;
                    Session["UserFullName"] = user.firstName + " " + user.lastName;
                    Session["UserAuthorization"] = user.role;
                    Session["UserPhoto"] = user.photoLink ?? "";
                    Session["IsLoggedIn"] = true;

                    return RedirectToAction("adminDashboard", "RGDC");
                }
            }
        }
        public JsonResult getSessionVariable()
        {
            try
            {
                if (Session["UserName"] == null || Session["UserFullName"] == null || Session["UserAuthorization"] == null)
                {
                    return Json(new { success = false, message = "User session expired." }, JsonRequestBehavior.AllowGet);
                }
                var userPhoto = Session["UserPhoto"] != null ? Session["UserPhoto"].ToString() : "";
                bool googleCalendarEnabled = false;
                bool googleRefreshTokenPresent = false;
                int accID = 0;

                if (Session["UserID"] != null && int.TryParse(Session["UserID"].ToString(), out accID))
                {
                    using (var db = new RGDCContext())
                    {
                        var acc = db.tbl_account.FirstOrDefault(a => a.accID == accID);
                        if (acc != null)
                        {
                            googleCalendarEnabled = acc.googleCalendarEnabled;
                            googleRefreshTokenPresent = !string.IsNullOrEmpty(acc.googleRefreshToken);
                        }
                    }
                }

                return Json(new
                {
                    userName = Session["UserName"].ToString(),
                    fullName = Session["UserFullName"].ToString(),
                    userAuthorization = Session["UserAuthorization"].ToString(),
                    userPhoto = userPhoto,
                    googleCalendarEnabled = googleCalendarEnabled,
                    googleRefreshTokenPresent = googleRefreshTokenPresent
                }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error retrieving session: {ex.Message}" }, JsonRequestBehavior.AllowGet);
            }
        }

        public string passwordHash(string password)
        {
            using (SHA256 sha256Hash = SHA256.Create())
            {
                byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(password));
                StringBuilder builder = new StringBuilder();
                for (int i = 0; i < bytes.Length; i++)
                {
                    builder.Append(bytes[i].ToString("x2"));
                }
                return builder.ToString();
            }
        }

        public ActionResult patientProfile()
        {
            return View();
        }
        public ActionResult patientFinance()
        {
            return View();
        }
        [HttpGet]
        public JsonResult GetAuthEmail()
        {
            if (Session["UserEmail"] != null)
            {
                return Json(new
                {
                    email = Session["UserEmail"].ToString(),
                }, JsonRequestBehavior.AllowGet);
            }
            else
            {
                return Json(new
                {
                    email = ""
                }, JsonRequestBehavior.AllowGet);
            }

        }

        [HttpPost]
        public JsonResult sendOTP(string email)
        {
            using (var db = new RGDCContext())
            {
                var user = db.tbl_account.FirstOrDefault(u => u.email == email);
                if (user == null)
                    return Json(new { success = false, message = "Email not found" });

                var otp = new Random().Next(100000, 999999).ToString();

                Session["RESET_OTP"] = otp;
                Session["RESET_EMAIL"] = email;
                Session["RESET_OTP_EXPIRY"] = DateTime.Now.AddMinutes(10);  

                try
                {
                    // SEND EMAIL
                    MailMessage mail = new MailMessage();
                    mail.To.Add(email);
                    mail.Subject = "Password Reset OTP";
                    mail.Body = $"Your OTP is: {otp}";
                    mail.From = new MailAddress("reyesguansingdc.noreply@gmail.com");

                    SmtpClient smtp = new SmtpClient("smtp.gmail.com", 587);
                    smtp.Credentials = new NetworkCredential("reyesguansingdc.noreply@gmail.com", "nniircdehqoxkkqa");
                    smtp.EnableSsl = true;
                    smtp.Send(mail);

                    return Json(new { success = true, message = "OTP sent successfully" });
                }
                catch (Exception ex)
                {
                    return Json(new { success = false, message = ex.Message });
                }
            }
        }

        [HttpPost]
        public JsonResult sendEmail(string email)
        {
            using (var db = new RGDCContext())
            {
                var user = db.tbl_account.FirstOrDefault(u => u.email == email);
                if (user == null)
                    return Json(new { success = false, message = "Email not found" });

                var otp = new Random().Next(100000, 999999).ToString();

                Session["RESET_EMAIL"] = email;

                try
                {
                    // SEND EMAIL
                    MailMessage mail = new MailMessage();
                    mail.To.Add(email);
                    mail.Subject = "Password for your account!";
                    mail.Body = $"Your Password is Default123, please change it immediately on your next login.";
                    mail.From = new MailAddress("reyesguansingdc.noreply@gmail.com");

                    SmtpClient smtp = new SmtpClient("smtp.gmail.com", 587);
                    smtp.Credentials = new NetworkCredential("reyesguansingdc.noreply@gmail.com", "nniircdehqoxkkqa");
                    smtp.EnableSsl = true;
                    smtp.Send(mail);

                    return Json(new { success = true, message = "Email sent successfully" });
                }
                catch (Exception ex)
                {
                    return Json(new { success = false, message = ex.Message });
                }
            }
        }

        [HttpPost]
        public JsonResult resetPassword(string email, string otp, string password)
        {
            using (var db = new RGDCContext())
            {
                if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(otp) || string.IsNullOrWhiteSpace(password)) {
                    return Json(new { success = false, message = "Email, OTP and new password are required" });
                }

                if (Session["RESET_EMAIL"] == null || Session["RESET_OTP"] == null || Session["RESET_OTP_EXPIRY"] == null)
                {
                    return Json(new { success = false, message = "No OTP was requested or it has already been used/cleared" });
                }

                string sessionEmail = Session["RESET_EMAIL"].ToString();
                string sessionOtp = Session["RESET_OTP"].ToString();
                DateTime expiry;
                if (!DateTime.TryParse(Session["RESET_OTP_EXPIRY"].ToString(), out expiry) || expiry < DateTime.Now)
                {
                    Session.Remove("RESET_OTP");
                    Session.Remove("RESET_EMAIL");
                    Session.Remove("RESET_OTP_EXPIRY");
                    return Json(new { success = false, message = "OTP expired. Please request a new one." });
                }

                if (!string.Equals(sessionEmail, email, StringComparison.OrdinalIgnoreCase) ||
                    !string.Equals(sessionOtp, otp, StringComparison.Ordinal))
                {
                    return Json(new { success = false, message = "Invalid OTP or email" });
                }

                var user = db.tbl_account.FirstOrDefault(u => u.email == email);
                if (user == null)
                    return Json(new { success = false, message = "Email not found" });

                if (password.Length < 8)
                    return Json(new { success = false, message = "Password must be at least 8 characters long" });
                if (!password.Any(char.IsUpper))
                    return Json(new { success = false, message = "Password must contain at least 1 uppercase letter" });
                if (!password.Any(ch => !char.IsLetterOrDigit(ch)))
                    return Json(new { success = false, message = "Password must contain at least 1 special character" });

                user.password = passwordHash(password);
                db.SaveChanges();

                Session.Remove("RESET_OTP");
                Session.Remove("RESET_EMAIL");
                Session.Remove("RESET_OTP_EXPIRY");

                return Json(new { success = true, message = "Password reset successfully" });
            }
        }

        public JsonResult getPatientList()
        {
            using (var db = new RGDCContext())
            {
                var today = DateTime.Now;
                var result = (
                    from p in db.tbl_patient
                    join a in db.tbl_account
                        on p.accID equals a.accID
                    select new
                    {
                        patientID = p.patientID,
                        accID = p.accID,
                        patientName = a.firstName + " " + a.lastName,
                        lastVisit = p.lastVisit,

                        // count upcoming/pending appointments for this patient
                        appointmentsScheduled = db.tbl_appointment.Count(ap => ap.patientID == p.patientID && (ap.status == "Requested" || ap.status == "Scheduled"))
                    }
                ).ToList();
                return Json(result, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult GetPastAppointments()
        {
            try
            {
                using (var db = new RGDCContext())
                {
                    var result = (
                        from appt in db.tbl_appointment
                        join pat in db.tbl_patient on appt.patientID equals pat.patientID into patj
                        from pat in patj.DefaultIfEmpty()
                        join patAcc in db.tbl_account on pat.accID equals patAcc.accID into patAccj
                        from patAcc in patAccj.DefaultIfEmpty()
                        join dent in db.tbl_dentist on appt.dentistID equals dent.dentistID into dentj
                        from dent in dentj.DefaultIfEmpty()
                        join dentAcc in db.tbl_account on dent.accID equals dentAcc.accID into dentAccj
                        from dentAcc in dentAccj.DefaultIfEmpty()
                        where appt.status != "Scheduled"
                        orderby appt.dateTime descending
                        select new
                        {
                            apptID = appt.apptID,
                            dateTime = appt.dateTime,
                            purpose = appt.reason,
                            dentistName = dentAcc != null ? (dentAcc.firstName + " " + dentAcc.lastName) : null,
                            patientName = patAcc != null ? (patAcc.firstName + " " + patAcc.lastName) : null,
                            status = appt.status,
                            displayStatus = appt.status == "Scheduled" ? "Scheduled" : (appt.status == "Done" ? "Completed/Done" : appt.status),
                            remarks = appt.remarks
                        }
                    ).ToList();

                    return Json(result, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult CancelAppointment(int apptID)
        {
            try
            {
                if (apptID <= 0) return Json(new { success = false, message = "Invalid appointment ID." });

                using (var db = new RGDCContext())
                {
                    var appt = db.tbl_appointment.FirstOrDefault(a => a.apptID == apptID);
                    if (appt == null) return Json(new { success = false, message = "Appointment not found." });

                    // Prevent cancellation within 2 days of appointment date (inclusive)
                    var today = DateTime.Today;
                    var cutoff = today.AddDays(2);
                    if (appt.dateTime.Date <= cutoff.Date)
                    {
                        return Json(new { success = false, message = "Cannot cancel appointment within 2 days of scheduled date." });
                    }

                    // prefix reason with Cancelled - if not already
                    var orig = appt.reason ?? "";
                    if (!orig.StartsWith("Cancelled - ")) appt.reason = "Cancelled - " + orig;

                    appt.status = "Cancelled";
                    db.SaveChanges();

                    return Json(new { success = true, message = "Appointment cancelled." });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }


        [HttpGet]

        public JsonResult getDentists()
        {
            using (var db = new RGDCContext())
            {
                var result = (
                    from d in db.tbl_dentist
                    join a in db.tbl_account
                        on d.accID equals a.accID
                    select new
                    {
                        dentistID = d.dentistID,
                        accID = d.accID,
                        dentistName = a.firstName + " " + a.lastName,
                        specialization = d.specialization,
                        branchID = d.branchID
                    }
                ).ToList();

                return Json(result, JsonRequestBehavior.AllowGet);
            }
        }
        public JsonResult goToPatient(tblPatientModel patient)
        {
            Session["SelectedPatientID"] = patient.patientID;

            return Json(new
            {
                success = true,
            });
        }

        public JsonResult getSelectedPatientDetails()
        {
            using (var db = new RGDCContext())
            {
                var sessionVal = Session["SelectedPatientID"];
                if (sessionVal == null) return Json(null, JsonRequestBehavior.AllowGet);

                if (!int.TryParse(sessionVal.ToString(), out int pid))
                    return Json(null, JsonRequestBehavior.AllowGet);

                var result = (
                    from p in db.tbl_patient
                    join a in db.tbl_account on p.accID equals a.accID
                    join g in db.tbl_gender on a.genderID equals g.genderID into gj
                    from g in gj.DefaultIfEmpty()
                    where p.patientID == pid
                    select new
                    {
                        patientID = p.patientID,
                        accID = p.accID,
                        currPhy = p.currentPhysician,
                        prevPhy = p.previousPhysician,
                        prevPhyOffice = p.previousPhysicianOffice,
                        prevPhyContact = p.previousPhysicianContact,
                        guar = p.guardian,
                        guarNum = p.guardianNumber,
                        occupation = p.occupation,
                        referral = p.referral,
                        dentalChartLink = p.dentalChartLink,
                        signatureLink = p.signatureLink,
                        patientName = a.firstName + " " + a.lastName,
                        firstName = a.firstName,
                        middleName = a.middleName,
                        lastName = a.lastName,
                        birthDate = a.birthDate,
                        genderID = a.genderID,
                        gender = g != null ? g.description : null,
                        email = a.email,
                        contactNumber = a.contactNumber,
                        address = a.address,
                        civilStatus = a.civilStatus,
                        religion = a.religion,
                        nationality = a.nationality,
                        accCreated = a.accCreatedAt,
                        photoLink = a.photoLink,
                        medHist = p.medicalHistory,
                        medHistUpdate = p.medHistUpdate,
                        lastVisit = p.lastVisit,
                        nextVisit = p.nextVisit
                    }
                ).FirstOrDefault();

                return Json(result, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult getOwnPatientDetails()
        {
            using (var db = new RGDCContext())
            {
                var sessionVal = Session["UserID"];
                if (sessionVal == null) return Json(null, JsonRequestBehavior.AllowGet);

                if (!int.TryParse(sessionVal.ToString(), out int pid))
                    return Json(null, JsonRequestBehavior.AllowGet);

                var result = (
                            from p in db.tbl_patient
                            join a in db.tbl_account on p.accID equals a.accID
                            join g in db.tbl_gender on a.genderID equals g.genderID into gj
                            from g in gj.DefaultIfEmpty()
                            where p.accID == pid
                            select new
                            {
                                patientID = p.patientID,
                                accID = p.accID,
                                currPhy = p.currentPhysician,
                                prevPhy = p.previousPhysician,
                                prevPhyOffice = p.previousPhysicianOffice,
                                prevPhyContact = p.previousPhysicianContact,
                                guar = p.guardian,
                                guarNum = p.guardianNumber,
                                referral = p.referral,
                                dentalChartLink = p.dentalChartLink,
                                signatureLink = p.signatureLink,

                                patientName = a.firstName + " " + a.lastName,
                                firstName = a.firstName,
                                middleName = a.middleName,
                                lastName = a.lastName,
                                birthDate = a.birthDate,
                                genderID = a.genderID,
                                gender = g != null ? g.description : null,
                                email = a.email,
                                contactNumber = a.contactNumber,
                                address = a.address,
                                civilStatus = a.civilStatus,
                                religion = a.religion,
                                nationality = a.nationality,
                                accCreated = a.accCreatedAt,

                                medHist = p.medicalHistory,
                                medHistUpdate = p.medHistUpdate,
                                lastVisit = p.lastVisit,
                                nextVisit = p.nextVisit
                            }
                        ).FirstOrDefault();

                return Json(result, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult UploadSignature()
        {
            try
            {
                if (Request.Files == null || Request.Files.Count == 0)
                    return Json(new { success = false, message = "No file received." });

                HttpPostedFileBase file = Request.Files[0];
                if (file == null || file.ContentLength == 0)
                    return Json(new { success = false, message = "No file provided." });

                // Validate image MIME type
                if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                    return Json(new { success = false, message = "Invalid file type. Image required." });

                string uploadPath = Server.MapPath("~/Content/Uploads/");
                if (!Directory.Exists(uploadPath))
                    Directory.CreateDirectory(uploadPath);

                string fileName = Guid.NewGuid().ToString("N") + Path.GetExtension(file.FileName);
                string filePath = Path.Combine(uploadPath, fileName);
                file.SaveAs(filePath);

                string relativePath = "/Content/Uploads/" + fileName;

                using (var db = new RGDCContext())
                {
                    var imgData = new tblImagesModel()
                    {
                        imageName = fileName,
                        imagePath = "/Content/Uploads/",
                        createdAt = DateTime.Now,
                        updatedAt = DateTime.Now
                    };
                    db.tbl_images.Add(imgData);
                    db.SaveChanges();

                    return Json(new
                    {
                        success = true,
                        message = "Signature uploaded to server.",
                        filePath = relativePath,
                        imageID = imgData.imageID
                    });
                }
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = $"Error uploading signature: {ex.Message}"
                });
            }
        }

        [HttpPost]
        public JsonResult SavePatientSignature(string imagePath)
        {
            if (string.IsNullOrWhiteSpace(imagePath))
                return Json(new { success = false, message = "No image path provided." });

            var sessionVal = Session["SelectedPatientID"];
            if (sessionVal == null) return Json(new { success = false, message = "No patient selected." });

            if (!int.TryParse(sessionVal.ToString(), out int patientID))
                return Json(new { success = false, message = "Invalid patient ID." });

            try
            {
                using (var db = new RGDCContext())
                {
                    var patient = db.tbl_patient.FirstOrDefault(p => p.patientID == patientID);
                    if (patient == null)
                        return Json(new { success = false, message = "Patient not found." });

                    // store signature link on patient record
                    patient.signatureLink = imagePath;
                    db.SaveChanges();

                    return Json(new { success = true, message = "Signature saved to patient record.", filePath = imagePath });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error saving signature to patient: {ex.Message}" });
            }
        }

        [HttpPost]
        public JsonResult UpdatePatient(PatientUpdateData profInfo)
        {
            if (profInfo == null) return Json(new { success = false, message = "No data provided" });

            try
            {
                using (var db = new RGDCContext())
                {
                    // find account
                    var acc = db.tbl_account.FirstOrDefault(a => a.accID == profInfo.accID);
                    if (acc == null) return Json(new { success = false, message = "Account not found" });

                    // update account fields (only update when non-null/empty to avoid overwriting unintentionally)
                    acc.firstName = string.IsNullOrWhiteSpace(profInfo.firstName) ? acc.firstName : profInfo.firstName;
                    acc.middleName = string.IsNullOrWhiteSpace(profInfo.middleName) ? acc.middleName : profInfo.middleName;
                    acc.lastName = string.IsNullOrWhiteSpace(profInfo.lastName) ? acc.lastName : profInfo.lastName;
                    if (profInfo.genderID.HasValue) acc.genderID = profInfo.genderID.Value;
                    if (profInfo.birthDate.HasValue) acc.birthDate = profInfo.birthDate.Value;
                    acc.email = string.IsNullOrWhiteSpace(profInfo.email) ? acc.email : profInfo.email;
                    acc.contactNumber = string.IsNullOrWhiteSpace(profInfo.contactNumber) ? acc.contactNumber : profInfo.contactNumber;
                    acc.address = string.IsNullOrWhiteSpace(profInfo.address) ? acc.address : profInfo.address;
                    acc.civilStatus = string.IsNullOrWhiteSpace(profInfo.civilStatus) ? acc.civilStatus : profInfo.civilStatus;
                    acc.religion = string.IsNullOrWhiteSpace(profInfo.religion) ? acc.religion : profInfo.religion;
                    acc.nationality = string.IsNullOrWhiteSpace(profInfo.nationality) ? acc.nationality : profInfo.nationality;
                    acc.accUpdatedAt = DateTime.Now;

                    // find patient
                    var pat = db.tbl_patient.FirstOrDefault(p => p.patientID == profInfo.patientID);
                    if (pat == null) return Json(new { success = false, message = "Patient record not found" });

                    pat.currentPhysician = string.IsNullOrWhiteSpace(profInfo.currentPhysician) ? pat.currentPhysician : profInfo.currentPhysician;
                    pat.previousPhysician = string.IsNullOrWhiteSpace(profInfo.previousPhysician) ? pat.previousPhysician : profInfo.previousPhysician;
                    pat.occupation = string.IsNullOrWhiteSpace(profInfo.occupation) ? pat.occupation : profInfo.occupation;
                    pat.guardian = string.IsNullOrWhiteSpace(profInfo.guardian) ? pat.guardian : profInfo.guardian;
                    pat.guardianNumber = string.IsNullOrWhiteSpace(profInfo.guardianNumber) ? pat.guardianNumber : profInfo.guardianNumber;
                    pat.referral = string.IsNullOrWhiteSpace(profInfo.referral) ? pat.referral : profInfo.referral;
                    pat.lastUpdated = DateTime.Now;
                    if (profInfo.lastVisit.HasValue) pat.lastVisit = profInfo.lastVisit.Value;
                    if (profInfo.nextVisit.HasValue) pat.nextVisit = profInfo.nextVisit.Value;

                    db.SaveChanges();
                }

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = $"Error updating profile: {ex.Message}"
                }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult Upload()
        {
            try
            {
                if (Request.Files.Count == 0)
                    return Json(new { success = false, message = "No file received." });

                HttpPostedFileBase file = Request.Files[0];

                if (file == null || file.ContentLength == 0)
                    return Json(new { success = false, message = "No file provided." });

                // Get patient ID from session
                var sessionVal = Session["SelectedPatientID"];
                if (sessionVal == null)
                    return Json(new { success = false, message = "No patient selected." });

                if (!int.TryParse(sessionVal.ToString(), out int patientID))
                    return Json(new { success = false, message = "Invalid patient ID." });

                string uploadPath = Server.MapPath("~/Content/Uploads/");
                if (!Directory.Exists(uploadPath))
                    Directory.CreateDirectory(uploadPath);

                string fileName = Guid.NewGuid() + Path.GetExtension(file.FileName);
                string filePath = Path.Combine(uploadPath, fileName);
                file.SaveAs(filePath);

                string relativePath = "/Content/Uploads/" + fileName;

                using (var db = new RGDCContext())
                {
                    // Save to tbl_images
                    var imgData = new tblImagesModel()
                    {
                        imageName = fileName,
                        imagePath = "/Content/Uploads/",
                        createdAt = DateTime.Now,
                        updatedAt = DateTime.Now
                    };
                    db.tbl_images.Add(imgData);

                    // UPDATE THE PATIENT'S DENTAL CHART LINK
                    var patient = db.tbl_patient.FirstOrDefault(p => p.patientID == patientID);
                    if (patient != null)
                    {
                        patient.dentalChartLink = relativePath;
                        patient.lastUpdated = DateTime.Now;
                        db.SaveChanges();

                        return Json(new
                        {
                            success = true,
                            message = "File uploaded successfully!",
                            filePath = relativePath
                        });
                    }
                    else
                    {
                        return Json(new
                        {
                            success = false,
                            message = "Patient not found in database."
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = $"Error: {ex.Message}"
                });
            }
        }

        public JsonResult GetImages()
        {
            try
            {
                using (var db = new RGDCContext())
                {
                    var imgData = db.tbl_images.Select(x => x).ToList();

                    return Json(imgData, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                throw new ArgumentException($"There is an error while processing getServiceFunc {ex.Message} : {ex.StackTrace} : {ex.InnerException}");
            }
        }

        public void logOut()
        {
            Session.Remove("UserID");
            Session.Remove("UserName");
            Session.Remove("UserFullName");
            Session.Remove("UserAuthorization");
            Session.Remove("IsLoggedIn");
            Session.Remove("SelectedPatientID");
            Session.Remove("RESET_OTP");
            Session.Remove("RESET_EMAIL");
        }


        [HttpPost]
        public JsonResult updateMedHist(MedicalHistoryModel medHist)
        {
            if (medHist == null)
                return Json(new { success = false, message = "No data received" }, JsonRequestBehavior.AllowGet);

            string jsonString = JsonConvert.SerializeObject(medHist);

            using (var db = new RGDCContext())
            {
                var sessionVal = Session["SelectedPatientID"];
                if (sessionVal == null)
                    return Json(new { success = false, message = "Session expired" }, JsonRequestBehavior.AllowGet);

                if (!int.TryParse(sessionVal.ToString(), out int pid))
                    return Json(new { success = false, message = "Invalid patient ID" }, JsonRequestBehavior.AllowGet);

                var patient = db.tbl_patient.FirstOrDefault(p => p.patientID == pid);
                if (patient == null)
                    return Json(new { success = false, message = "Patient not found" }, JsonRequestBehavior.AllowGet);

                patient.medicalHistory = jsonString;
                patient.medHistUpdate = DateTime.Now;
                patient.lastUpdated = DateTime.Now;
                db.SaveChanges();

                return Json(new { success = true, jsonstring = jsonString, medHistUpdate = patient.medHistUpdate }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult updateMedHistIni(tblPatientModel prevPhys)
        {
            using (var db = new RGDCContext())
            {
                var sessionVal = Session["SelectedPatientID"];
                if (sessionVal == null)
                    return Json(new { success = false, message = "Session expired" }, JsonRequestBehavior.AllowGet);

                if (!int.TryParse(sessionVal.ToString(), out int pid))
                    return Json(new { success = false, message = "Invalid patient ID" }, JsonRequestBehavior.AllowGet);

                var patient = db.tbl_patient.FirstOrDefault(p => p.patientID == pid);
                if (patient == null)
                    return Json(new { success = false, message = "Patient not found" }, JsonRequestBehavior.AllowGet);

                patient.previousPhysician = prevPhys.previousPhysician;
                patient.previousPhysicianOffice = prevPhys.previousPhysicianOffice;
                patient.previousPhysicianContact = prevPhys.previousPhysicianContact;
                patient.lastUpdated = DateTime.Now;

                db.SaveChanges();

                return Json(new { success = true }, JsonRequestBehavior.AllowGet);
            }
        }
        public JsonResult getPatientTreatment()
        {
            using (var db = new RGDCContext())
            {
                var result = (
            from t in db.tbl_treatmentplan
            join p in db.tbl_patient
                on t.patientID equals p.patientID
            join pa in db.tbl_account   // patient account
                on p.accID equals pa.accID
            join da in db.tbl_account   // dentist account
                on t.accID equals da.accID
            select new
            {
                trtPlanID = t.trtPlanID,
                date = t.date,
                procedures = t.procedures,
                toothNumber = t.toothNumber,
                accID = pa.accID,
                patientName = pa.firstName + " " + pa.lastName,
                dentist = da.firstName + " " + da.lastName, // ✅ correct source
                amount = t.amount,
                paid = t.paid
            }
        ).ToList();

                return Json(result, JsonRequestBehavior.AllowGet);
            }
        }


        public JsonResult GetAdminScheduledAppointments()
        {
            using (var db = new RGDCContext())
            {
                try
                {
                    // Auto-move past scheduled appointments to Done if their datetime has passed
                    try
                    {
                        var now = DateTime.Now;
                        var toMarkDone = db.tbl_appointment.Where(a => a.status == "Scheduled" && a.dateTime < now).ToList();
                        if (toMarkDone.Any())
                        {
                            foreach (var a in toMarkDone) a.status = "Done";
                            db.SaveChanges();
                        }
                    }
                    catch
                    {
                        // ignore any errors here to avoid breaking the listing
                    }

                    // Resolve session user and role
                    var sessionVal = Session["UserID"];
                    var userRoleObj = Session["UserAuthorization"];
                    if (sessionVal == null || userRoleObj == null) return Json(new List<object>(), JsonRequestBehavior.AllowGet);

                    if (!int.TryParse(sessionVal.ToString(), out int userID)) return Json(new List<object>(), JsonRequestBehavior.AllowGet);
                    if (!int.TryParse(userRoleObj.ToString(), out int role)) return Json(new List<object>(), JsonRequestBehavior.AllowGet);

                    // Build base query with joins and include patient/dentist account IDs to compute displayStatus safely
                    var baseQuery = from appt in db.tbl_appointment
                                    join pat in db.tbl_patient on appt.patientID equals pat.patientID into patj
                                    from pat in patj.DefaultIfEmpty()
                                    join patAcc in db.tbl_account on pat.accID equals patAcc.accID into patAccj
                                    from patAcc in patAccj.DefaultIfEmpty()
                                    join dent in db.tbl_dentist on appt.dentistID equals dent.dentistID into dentj
                                    from dent in dentj.DefaultIfEmpty()
                                    join dentAcc in db.tbl_account on dent.accID equals dentAcc.accID into dentAccj
                                    from dentAcc in dentAccj.DefaultIfEmpty()
                                    where appt.status == "Scheduled"
                                    select new
                                    {
                                        apptID = appt.apptID,
                                        dentistID = appt.dentistID,
                                        patientID = appt.patientID,
                                        dateTime = appt.dateTime,
                                        purpose = appt.reason,
                                        dentistAccFirst = dentAcc != null ? dentAcc.firstName : null,
                                        dentistAccLast = dentAcc != null ? dentAcc.lastName : null,
                                        dentistAccID = dentAcc != null ? (int?)dentAcc.accID : null,
                                        patientAccFirst = patAcc != null ? patAcc.firstName : null,
                                        patientAccLast = patAcc != null ? patAcc.lastName : null,
                                        patientAccID = patAcc != null ? (int?)patAcc.accID : null,
                                        dentBranchID = dent != null ? (int?)dent.branchID : null,
                                        status = appt.status,
                                        remarks = appt.remarks,
                                        procedureID = appt.procedureID,
                                        createdBy = appt.createdBy
                                    };

                    IEnumerable<dynamic> filtered;

                    if (role == 0)
                    {
                        // Owner: return all
                        filtered = baseQuery.OrderBy(x => x.dateTime).ToList();
                    }
                    else if (role == 1)
                    {
                        // Dentist: return only appointments for this dentist (match dentist.accID == userID)
                        var dentist = db.tbl_dentist.FirstOrDefault(d => d.accID == userID);
                        if (dentist == null) return Json(new List<object>(), JsonRequestBehavior.AllowGet);

                        filtered = baseQuery.Where(x => x.dentistID == dentist.dentistID).OrderBy(x => x.dateTime).ToList();
                    }
                    else if (role == 2)
                    {
                        // Staff: return appointments for dentists in the same branch as this staff
                        var staff = db.tbl_staff.FirstOrDefault(s => s.accID == userID);
                        if (staff == null) return Json(new List<object>(), JsonRequestBehavior.AllowGet);

                        filtered = baseQuery.Where(x => x.dentBranchID.HasValue && x.dentBranchID.Value == staff.branchID)
                                            .OrderBy(x => x.dateTime).ToList();
                    }
                    else if (role == 3)
                    {
                        // Patient: return only appointments for this patient
                        var patient = db.tbl_patient.FirstOrDefault(p => p.accID == userID);
                        if (patient == null) return Json(new List<object>(), JsonRequestBehavior.AllowGet);

                        filtered = baseQuery.Where(x => x.patientID == patient.patientID).OrderBy(x => x.dateTime).ToList();
                    }
                    else
                    {
                        // Unknown role: return empty
                        return Json(new List<object>(), JsonRequestBehavior.AllowGet);
                    }

                    // Project to expected shape, compute displayStatus safely using the pre-fetched account IDs
                    var result = filtered.Select(a => new
                    {
                        apptID = a.apptID,
                        dentistID = a.dentistID,
                        patientID = a.patientID,
                        dateTime = a.dateTime,
                        date = a.dateTime,
                        time = a.dateTime,
                        purpose = a.purpose,
                        dentistName = (a.dentistAccFirst != null && a.dentistAccLast != null) ? (a.dentistAccFirst + " " + a.dentistAccLast) : null,
                        patientName = (a.patientAccFirst != null && a.patientAccLast != null) ? (a.patientAccFirst + " " + a.patientAccLast) : null,
                        status = a.status,
                        displayStatus = a.status == "Scheduled" ? "Scheduled"
                                        : (a.status == "Done" ? "Completed/Done"
                                        : (a.status == "Requested"
                                            ? ((a.patientAccID.HasValue && a.createdBy == a.patientAccID.Value) ? "Requested by Patient"
                                                                                                         : ((a.dentistAccID.HasValue && a.createdBy == a.dentistAccID.Value) ? "Requested by Dentist" : "Requested"))
                                            : a.status)),
                        remarks = a.remarks,
                        procedureID = a.procedureID
                    }).ToList();

                    return Json(result, JsonRequestBehavior.AllowGet);
                }
                catch (Exception ex)
                {
                    return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
                }
            }
        }
        public JsonResult getPayments()
        {
            try
            {
                var sessionVal = Session["UserID"];
                var userRole = Session["UserAuthorization"];

                if (sessionVal == null || userRole == null)
                    return Json(new List<object>(), JsonRequestBehavior.AllowGet);

                if (!int.TryParse(sessionVal.ToString(), out int userID))
                    return Json(new List<object>(), JsonRequestBehavior.AllowGet);

                if (!int.TryParse(userRole.ToString(), out int role))
                    return Json(new List<object>(), JsonRequestBehavior.AllowGet);

                using (var db = new RGDCContext())
                {
                    // Build base query (entities kept so we can apply role filters)
                    var baseQuery = from pay in db.tbl_payment
                                    join p in db.tbl_patient on pay.patientID equals p.patientID
                                    join pa in db.tbl_account on p.accID equals pa.accID
                                    join d in db.tbl_dentist on pay.dentistID equals d.dentistID
                                    join da in db.tbl_account on d.accID equals da.accID
                                    select new
                                    {
                                        // Patient info
                                        patientID = p.patientID,
                                        accID = p.accID,
                                        patientName = pa.firstName + " " + pa.lastName,
                                        birthDate = pa.birthDate,
                                        photoLink = pa.photoLink,
                                        guardian = p.guardian,
                                        guardianNumber = p.guardianNumber,
                                        nextVisit = p.nextVisit,
                                        lastVisit = p.lastVisit,

                                        // Dentist info
                                        dentistID = d.dentistID,
                                        dentistAccID = da.accID,
                                        dentistName = da.firstName + " " + da.middleName + " " + da.lastName,
                                        dentistSpecialization = d.specialization,
                                        branchID = d.branchID,

                                        // Payment info
                                        paymentID = pay.paymentID,
                                        description = pay.description,
                                        paymentMethod = pay.paymentMethod,
                                        paymentDate = pay.paymentDate,
                                        cost = pay.cost,
                                        discount = pay.discount,
                                        amountPaid = pay.amountPaid,
                                        amountDue = pay.amountDue
                                    };

                    // Apply role-based filtering:
                    // - Owner (role == 0) : see all
                    // - Dentist (role == 1) : see only payments assigned to them
                    // - Staff (role == 2) : see payments for dentists in their branch
                    // - Patient (role == 3) : see only their own payments
                    IEnumerable<object> resultList;

                    if (role == 0)
                    {
                        resultList = baseQuery.OrderBy(x => x.paymentDate).ToList();
                    }
                    else if (role == 1)
                    {
                        var dentist = db.tbl_dentist.FirstOrDefault(d => d.accID == userID);
                        if (dentist == null) return Json(new List<object>(), JsonRequestBehavior.AllowGet);

                        resultList = baseQuery
                            .Where(x => x.dentistID == dentist.dentistID)
                            .OrderBy(x => x.paymentDate)
                            .ToList();
                    }
                    else if (role == 2)
                    {
                        var staff = db.tbl_staff.FirstOrDefault(s => s.accID == userID);
                        if (staff == null) return Json(new List<object>(), JsonRequestBehavior.AllowGet);

                        resultList = baseQuery
                            .Where(x => x.branchID == staff.branchID)
                            .OrderBy(x => x.paymentDate)
                            .ToList();
                    }
                    else if (role == 3)
                    {
                        var patient = db.tbl_patient.FirstOrDefault(p => p.accID == userID);
                        if (patient == null) return Json(new List<object>(), JsonRequestBehavior.AllowGet);

                        resultList = baseQuery
                            .Where(x => x.patientID == patient.patientID)
                            .OrderBy(x => x.paymentDate)
                            .ToList();
                    }
                    else
                    {
                        return Json(new List<object>(), JsonRequestBehavior.AllowGet);
                    }

                    return Json(resultList, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult UpdateAppointment(AppointmentUpdateData appointmentData)
        {
            try
            {
                if (appointmentData == null)
                    return Json(new { success = false, message = "No appointment data provided." });

                if (appointmentData.apptID <= 0)
                    return Json(new { success = false, message = "Invalid appointment ID." });

                if (appointmentData.dateTime == null || appointmentData.dateTime == DateTime.MinValue)
                    return Json(new { success = false, message = "Invalid date/time provided." });

                if (string.IsNullOrWhiteSpace(appointmentData.reason))
                    return Json(new { success = false, message = "Reason/purpose is required." });

                using (var db = new RGDCContext())
                {
                    var appt = db.tbl_appointment.FirstOrDefault(a => a.apptID == appointmentData.apptID);
                    if (appt == null)
                        return Json(new { success = false, message = "Appointment not found." });

                    appt.dateTime = appointmentData.dateTime;
                    appt.reason = appointmentData.reason;
                    db.SaveChanges();

                    return Json(new { success = true, message = "Appointment updated successfully." });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error updating appointment: {ex.Message}" });
            }
        }

        public JsonResult GetDentistList()
        {
            try
            {
                using (var db = new RGDCContext())
                {
                    var result = (
                        from d in db.tbl_dentist
                        join a in db.tbl_account on d.accID equals a.accID
                        select new
                        {
                            dentistID = d.dentistID,
                            accID = a.accID,
                            dentistName = a.firstName + " " + a.lastName,
                            firstName = a.firstName,
                            lastName = a.lastName
                        }
                    ).ToList();

                    return Json(result, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error retrieving dentist list: {ex.Message}" }, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult GetPatientListForAppointment()
        {
            try
            {
                using (var db = new RGDCContext())
                {
                    var result = (
                        from p in db.tbl_patient
                        join a in db.tbl_account on p.accID equals a.accID
                        select new
                        {
                            patientID = p.patientID,
                            accID = a.accID,
                            patientName = a.firstName + " " + a.lastName,
                            firstName = a.firstName,
                            lastName = a.lastName
                        }
                    ).ToList();

                    return Json(result, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error retrieving patient list: {ex.Message}" }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult CreateAppointmentRequest(AppointmentRequestData request)
        {
            try
            {
                if (request == null)
                    return Json(new { success = false, message = "No appointment data provided." });


                if (request.patientID <= 0 || request.dentistID <= 0)
                    return Json(new { success = false, message = "Invalid patient or dentist ID." });

                // Ensure dateTime was provided and is a sensible date (not DateTime.MinValue / zero)
                if (request.dateTime == null || request.dateTime == DateTime.MinValue)
                    return Json(new { success = false, message = "Invalid appointment date/time provided." });

                var dateTime = request.dateTime;

                // Server-side rule: appointment must be at least 2 days from today
                var minAllowed = DateTime.Today.AddDays(2);
                if (dateTime.Date < minAllowed.Date)
                {
                    return Json(new { success = false, message = "Appointment date must be at least 2 days from today." });
                }

                if (string.IsNullOrWhiteSpace(request.reason))
                    return Json(new { success = false, message = "Purpose/reason is required." });

                var sessionVal = Session["UserID"];
                if (sessionVal == null)
                    return Json(new { success = false, message = "User session expired." });

                if (!int.TryParse(sessionVal.ToString(), out int createdByID))
                    return Json(new { success = false, message = "Invalid user ID." });

                using (var db = new RGDCContext())
                {
                    var patient = db.tbl_patient.FirstOrDefault(p => p.patientID == request.patientID);
                    if (patient == null)
                        return Json(new { success = false, message = "Patient not found in database." });

                    var dentist = db.tbl_dentist.FirstOrDefault(d => d.dentistID == request.dentistID);
                    if (dentist == null)
                        return Json(new { success = false, message = "Dentist not found in database." });

                    var requested = new DateTime(dateTime.Year, dateTime.Month, dateTime.Day, dateTime.Hour, dateTime.Minute, 0);
                    var conflictStart = requested;
                    var conflictEnd = requested.AddMinutes(1);

                    // consider both Scheduled and Requested as blocking to prevent overlapping slots
                    var blockingStatuses = new List<string> { "Scheduled", "Requested" };

                    bool conflict = db.tbl_appointment.Any(a =>
                        a.dentistID == request.dentistID
                        && blockingStatuses.Contains(a.status)
                        && a.dateTime >= conflictStart
                        && a.dateTime < conflictEnd);

                    if (conflict)
                    {
                        return Json(new { success = false, message = "Selected date/time is already booked for that dentist." });
                    }


                    var newAppointment = new tblAppointmentModel()
                    {
                        patientID = request.patientID,
                        dentistID = request.dentistID,
                        createdBy = createdByID,
                        dateTime = dateTime,
                        reason = request.reason,
                        status = "Requested",
                        schedCreatedAt = DateTime.Now,
                        schedUpdatedAt = DateTime.Now
                    };

                    db.tbl_appointment.Add(newAppointment);

                    try
                    {
                        db.SaveChanges();
                    }
                    catch (Exception exSave)
                    {
                        var baseEx = exSave.GetBaseException();
                        return Json(new { success = false, message = "Database error: " + (baseEx != null ? baseEx.Message : exSave.Message) });
                    }


                    return Json(new { success = true, message = "Appointment request created successfully.", apptID = newAppointment.apptID });
                }
            }
            catch (Exception ex)
            {
                // Log ex (recommended)
                var baseEx = ex.GetBaseException();
                return Json(new { success = false, message = "Server error: " + (baseEx != null ? baseEx.Message : ex.Message) });
            }
        }

        public JsonResult GetRequestedAppointments()
        {
            try
            {
                var sessionVal = Session["UserID"];
                var userRole = Session["UserAuthorization"];

                // Check if session values are null, empty, or whitespace
                if (sessionVal == null || string.IsNullOrWhiteSpace(sessionVal.ToString()) ||
                    userRole == null || string.IsNullOrWhiteSpace(userRole.ToString()))
                {
                    return Json(new { success = false, message = "User session expired or invalid." }, JsonRequestBehavior.AllowGet);
                }

                if (!int.TryParse(sessionVal.ToString(), out int userID))
                    return Json(new { success = false, message = "Invalid user ID." }, JsonRequestBehavior.AllowGet);

                if (!int.TryParse(userRole.ToString(), out int role))
                    return Json(new { success = false, message = "Invalid user role." }, JsonRequestBehavior.AllowGet);

                using (var db = new RGDCContext())
                {
                    // Dentist role is '1' in this application (owner/admin/staff/patient mapping follows acc.role)
                    if (role == 1)
                    {
                        // Dentist - get appointments where:
                        // - dentistID matches current dentist (recipient)
                        // - createdBy is NOT the current dentist (someone else created it for them)
                        // - status is "Requested"
                        var dentist = db.tbl_dentist.FirstOrDefault(d => d.accID == userID);
                        if (dentist != null)
                        {
                            var result = (
                                from appt in db.tbl_appointment
                                join pat in db.tbl_patient on appt.patientID equals pat.patientID
                                join patAcc in db.tbl_account on pat.accID equals patAcc.accID
                                where appt.dentistID == dentist.dentistID
                                   && appt.status == "Requested"
                                   && appt.createdBy != userID  // Only show if created by someone else (patient or staff)
                                orderby appt.dateTime
                                select new
                                {
                                    apptID = appt.apptID,
                                    dateTime = appt.dateTime,
                                    date = appt.dateTime,
                                    time = appt.dateTime,
                                    purpose = appt.reason,
                                    patientName = patAcc.firstName + " " + patAcc.lastName,
                                    dentistName = "",
                                    status = appt.status,
                                    createdBy = appt.createdBy,
                                    displayStatus = appt.status == "Requested" ? (appt.createdBy == patAcc.accID ? "Requested by Patient" : "Requested by Dentist") : appt.status
                                }
                            ).ToList();

                            return Json(result, JsonRequestBehavior.AllowGet);
                        }
                    }
                    else if (role == 3)
                    {
                        // Patient - get appointments where:
                        // - patientID matches current patient (recipient)
                        // - createdBy is NOT the current patient (dentist or staff created it)
                        // - status is "Requested"
                        var patient = db.tbl_patient.FirstOrDefault(p => p.accID == userID);
                        if (patient != null)
                        {
                            var result = (
                                from appt in db.tbl_appointment
                                join dent in db.tbl_dentist on appt.dentistID equals dent.dentistID
                                join dentAcc in db.tbl_account on dent.accID equals dentAcc.accID
                                where appt.patientID == patient.patientID
                                   && appt.status == "Requested"
                                   && appt.createdBy != userID  // Only show if created by someone else (dentist or staff)
                                orderby appt.dateTime
                                select new
                                {
                                    apptID = appt.apptID,
                                    dateTime = appt.dateTime,
                                    date = appt.dateTime,
                                    time = appt.dateTime,
                                    purpose = appt.reason,
                                    patientName = "",
                                    dentistName = dentAcc.firstName + " " + dentAcc.lastName,
                                    status = appt.status,
                                    createdBy = appt.createdBy,
                                    displayStatus = appt.status == "Requested" ? (appt.createdBy == dentAcc.accID ? "Requested by Dentist" : "Requested by Patient") : appt.status
                                }
                            ).ToList();

                            return Json(result, JsonRequestBehavior.AllowGet);
                        }
                    }

                    // If neither role matches or no appointments found, return empty array
                    return Json(new List<object>(), JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error retrieving requested appointments: {ex.Message}" }, JsonRequestBehavior.AllowGet);
            }
        }
        public JsonResult addPayment(tblPaymentModel model)
        {
            if (model == null)
                return Json(new { success = false, message = "Invalid data" });

            using (var db = new RGDCContext())
            {
                model.payCreatedAt = DateTime.Now;
                model.payUpdatedAt = DateTime.Now;

                db.tbl_payment.Add(model);
                db.SaveChanges();
            }

            return Json(new { success = true });
        }

        [HttpPost]
        public JsonResult getPaymentInfo(tblPaymentModel paymod)
        {
            using (var db = new RGDCContext())
            {
                var result = (
                    from pay in db.tbl_payment
                    join p in db.tbl_patient on pay.patientID equals p.patientID
                    join pa in db.tbl_account on p.accID equals pa.accID

                    join d in db.tbl_dentist on pay.dentistID equals d.dentistID
                    join da in db.tbl_account on d.accID equals da.accID

                    where pay.paymentID == paymod.paymentID

                    select new
                    {
                        paymentID = pay.paymentID,

                        patientID = p.patientID,
                        patientName = pa.firstName + " " + pa.lastName,

                        dentistID = d.dentistID,
                        dentistName = da.firstName + " " + da.lastName,

                        paymentMethod = pay.paymentMethod,
                        cost = pay.cost,
                        discount = pay.discount,
                        amountPaid = pay.amountPaid,
                        amountDue = pay.amountDue,
                        description = pay.description,
                        paymentDate = pay.paymentDate
                    }
                ).FirstOrDefault();

                return Json(result, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult AcceptAppointment(int apptID)
        {
            try
            {
                if (apptID <= 0)
                    return Json(new { success = false, message = "Invalid appointment ID." });

                using (var db = new RGDCContext())
                {
                    var appt = db.tbl_appointment.FirstOrDefault(a => a.apptID == apptID);
                    if (appt == null)
                        return Json(new { success = false, message = "Appointment not found." });

                    if (appt.status != "Requested")
                        return Json(new { success = false, message = "Appointment is not in requested status." });

                    appt.status = "Scheduled";
                    appt.schedUpdatedAt = DateTime.Now;
                    db.SaveChanges();

                    //FOR GOOGLE CALENDAR CODE
                    try
                    {
                        // Create event on dentist calendar if dentist account has google enabled
                        var dentist = db.tbl_dentist.FirstOrDefault(d => d.dentistID == appt.dentistID);
                        if (dentist != null)
                        {
                            var dentistAcc = db.tbl_account.FirstOrDefault(a => a.accID == dentist.accID);
                            if (dentistAcc != null && dentistAcc.googleCalendarEnabled && !string.IsNullOrEmpty(dentistAcc.googleRefreshToken))
                            {
                                // run asynchronously and don't block response
                                Task.Run(async () =>
                                {
                                    try
                                    {
                                        await CreateGoogleEventForAccountAsync(db, appt.apptID, dentistAcc.accID, dentistAcc.googleRefreshToken);
                                    }
                                    catch { /* log */ }
                                });
                            }
                        }

                        // Optionally create event on patient calendar if patient account has google enabled
                        var patient = db.tbl_patient.FirstOrDefault(p => p.patientID == appt.patientID);
                        if (patient != null)
                        {
                            var patientAcc = db.tbl_account.FirstOrDefault(a => a.accID == patient.accID);
                            if (patientAcc != null && patientAcc.googleCalendarEnabled && !string.IsNullOrEmpty(patientAcc.googleRefreshToken))
                            {
                                Task.Run(async () =>
                                {
                                    try
                                    {
                                        await CreateGoogleEventForAccountAsync(db, appt.apptID, patientAcc.accID, patientAcc.googleRefreshToken);
                                    }
                                    catch { /* log */ }
                                });
                            }
                        }
                    }
                    catch
                    {
                        // swallow to avoid breaking accept flow; consider logging
                    }


                    return Json(new { success = true, message = "Appointment accepted successfully." });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error accepting appointment: {ex.Message}" });
            }
        }

        //for google calendar codessssssss
        [HttpGet]
        public ActionResult ConnectGoogle()
        {
            var clientId = ConfigurationManager.AppSettings["GoogleClientId"];
            var redirect = ConfigurationManager.AppSettings["GoogleRedirectUri"];
            var scope = "https://www.googleapis.com/auth/calendar.events";
            var authUrl = $"https://accounts.google.com/o/oauth2/v2/auth?client_id={HttpUtility.UrlEncode(clientId)}&redirect_uri={HttpUtility.UrlEncode(redirect)}&response_type=code&scope={HttpUtility.UrlEncode(scope)}&access_type=offline&prompt=consent";
            return Redirect(authUrl);
        }

        private async Task SyncExistingAppointmentsForAccountAsync(int accId, int role, string refreshToken)
        {
            try
            {
                using (var db2 = new RGDCContext())
                {
                    var apptIds = new List<int>();

                    // If account is a dentist, sync scheduled appts for that dentist
                    if (role == 1)
                    {
                        var dentist = db2.tbl_dentist.FirstOrDefault(d => d.accID == accId);
                        if (dentist != null)
                        {
                            apptIds.AddRange(db2.tbl_appointment
                                .Where(a => a.dentistID == dentist.dentistID
                                            && a.status == "Scheduled"
                                            && (a.remarks == null || !a.remarks.Contains("googleEventId:")))
                                .Select(a => a.apptID)
                                .ToList());
                        }
                    }

                    // If account is a patient, sync scheduled appts for that patient
                    if (role == 3)
                    {
                        var patient = db2.tbl_patient.FirstOrDefault(p => p.accID == accId);
                        if (patient != null)
                        {
                            apptIds.AddRange(db2.tbl_appointment
                                .Where(a => a.patientID == patient.patientID
                                            && a.status == "Scheduled"
                                            && (a.remarks == null || !a.remarks.Contains("googleEventId:")))
                                .Select(a => a.apptID)
                                .ToList());
                        }
                    }

                    apptIds = apptIds.Distinct().ToList();

                    foreach (var apptId in apptIds)
                    {
                        try
                        {
                            // Reuse existing helper to create and persist Google event id
                            await CreateGoogleEventForAccountAsync(null, apptId, accId, refreshToken);
                        }
                        catch (Exception ex)
                        {
                            // log in production - swallow here to continue with other appointments
                            System.Diagnostics.Trace.WriteLine($"SyncExistingAppointmentsForAccountAsync: failed apptId={apptId} error={ex.Message}");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                // log failure of background sync
                System.Diagnostics.Trace.WriteLine("SyncExistingAppointmentsForAccountAsync failed: " + ex.ToString());
            }
        }


        [HttpGet]
        public async Task<ActionResult> GoogleAuthCallback(string code, string state)
        {
            if (string.IsNullOrEmpty(code)) return Content("Authorization failed. No code.");

            var clientId = ConfigurationManager.AppSettings["GoogleClientId"];
            var clientSecret = ConfigurationManager.AppSettings["GoogleClientSecret"];
            var redirect = ConfigurationManager.AppSettings["GoogleRedirectUri"];

            var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
            {
                ClientSecrets = new ClientSecrets { ClientId = clientId, ClientSecret = clientSecret }
            });

            TokenResponse token;
            try
            {
                token = await flow.ExchangeCodeForTokenAsync("user", code, redirect, CancellationToken.None);
            }
            catch (System.Exception ex)
            {
                return Content("Token exchange failed: " + ex.Message);
            }

            // Save refresh token for current logged-in account (encrypt in production)
            var sessionVal = Session["UserID"];
            if (sessionVal != null && int.TryParse(sessionVal.ToString(), out int accID))
            {
                using (var db = new RGDCContext())
                {
                    var acc = db.tbl_account.FirstOrDefault(a => a.accID == accID);
                    if (acc != null)
                    {
                        if (!string.IsNullOrEmpty(token.RefreshToken))
                            acc.googleRefreshToken = token.RefreshToken;
                        acc.googleCalendarEnabled = true;
                        db.SaveChanges();

                        // Background sync: create events for existing scheduled appointments that were created before connect
                        // We only create events where remarks does NOT already contain a googleEventId marker.
                        var refresh = acc.googleRefreshToken;
                        var savedAccId = acc.accID;
                        var savedRole = acc.role;

                        _ = Task.Run(async () =>
                        {
                            try
                            {
                                using (var db2 = new RGDCContext())
                                {
                                    var apptIds = new List<int>();

                                    // If account is a dentist, sync scheduled appts for that dentist
                                    if (savedRole == 1)
                                    {
                                        var dentist = db2.tbl_dentist.FirstOrDefault(d => d.accID == savedAccId);
                                        if (dentist != null)
                                        {
                                            apptIds.AddRange(db2.tbl_appointment
                                                .Where(a => a.dentistID == dentist.dentistID
                                                            && a.status == "Scheduled"
                                                            && (a.remarks == null || !a.remarks.Contains("googleEventId:")))
                                                .Select(a => a.apptID)
                                                .ToList());
                                        }
                                    }

                                    // If account is a patient, sync scheduled appts for that patient
                                    if (savedRole == 3)
                                    {
                                        var patient = db2.tbl_patient.FirstOrDefault(p => p.accID == savedAccId);
                                        if (patient != null)
                                        {
                                            apptIds.AddRange(db2.tbl_appointment
                                                .Where(a => a.patientID == patient.patientID
                                                            && a.status == "Scheduled"
                                                            && (a.remarks == null || !a.remarks.Contains("googleEventId:")))
                                                .Select(a => a.apptID)
                                                .ToList());
                                        }
                                    }

                                    // Optionally: owner/admin could be handled here if desired.
                                    apptIds = apptIds.Distinct().ToList();

                                    foreach (var apptId in apptIds)
                                    {
                                        try
                                        {
                                            // Uses the existing helper that refreshes token and inserts event, it persists event id in remarks
                                            await CreateGoogleEventForAccountAsync(null, apptId, savedAccId, refresh);
                                        }
                                        catch
                                        {
                                            // swallow per-appointment errors; consider logging in production
                                        }
                                    }
                                }
                            }
                            catch
                            {
                                // swallow background sync errors; consider logging
                            }
                        });
                    }
                }
            }

            return Content("<script>try{window.opener.postMessage({ type: 'google-auth-success' }, '*');}catch(e){} window.close();</script>", "text/html");
        }


        [HttpPost]
        public async Task<JsonResult> CreateGoogleEvent(int apptID)
        {
            try
            {
                var sessionVal = Session["UserID"];
                if (sessionVal == null) return Json(new { success = false, message = "Not logged in" });

                using (var db = new RGDCContext())
                {
                    int accID = int.Parse(sessionVal.ToString());
                    var acc = db.tbl_account.FirstOrDefault(a => a.accID == accID);
                    if (acc == null || !acc.googleCalendarEnabled || string.IsNullOrEmpty(acc.googleRefreshToken))
                        return Json(new { success = false, message = "Google not connected" });

                    var appt = db.tbl_appointment.FirstOrDefault(a => a.apptID == apptID);
                    if (appt == null) return Json(new { success = false, message = "Appointment not found" });

                    var clientId = ConfigurationManager.AppSettings["GoogleClientId"];
                    var clientSecret = ConfigurationManager.AppSettings["GoogleClientSecret"];

                    var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
                    {
                        ClientSecrets = new ClientSecrets { ClientId = clientId, ClientSecret = clientSecret },
                        Scopes = new[] { CalendarService.Scope.CalendarEvents }
                    });

                    var token = new TokenResponse { RefreshToken = acc.googleRefreshToken };
                    var cred = new UserCredential(flow, "user-" + accID, token);
                    var refreshed = await cred.RefreshTokenAsync(CancellationToken.None);
                    if (!refreshed) return Json(new { success = false, message = "Failed to refresh token" });

                    var service = new CalendarService(new BaseClientService.Initializer
                    {
                        HttpClientInitializer = cred,
                        ApplicationName = "RGDC Web Application"
                    });

                    var ev = new Event
                    {
                        Summary = appt.reason ?? "Appointment",
                        Description = $"Dentist ID: {appt.dentistID}",
                        Start = new EventDateTime { DateTime = appt.dateTime, TimeZone = "UTC" },
                        End = new EventDateTime { DateTime = appt.dateTime.AddMinutes(30), TimeZone = "UTC" }
                    };

                    var created = await service.Events.Insert(ev, "primary").ExecuteAsync();

                    // Optionally persist Google event id for later deletion/update
                    appt.remarks = (appt.remarks ?? "") + $"|googleEventId:{created.Id}";
                    db.SaveChanges();

                    return Json(new { success = true, eventId = created.Id });
                }
            }
            catch (System.Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public JsonResult ToggleGoogleCalendar(bool enabled)
        {
            var sessionVal = Session["UserID"];
            if (sessionVal == null) return Json(new { success = false, message = "Not logged in" });
            int accID = int.Parse(sessionVal.ToString());

            using (var db = new RGDCContext())
            {
                var acc = db.tbl_account.FirstOrDefault(a => a.accID == accID);
                if (acc == null) return Json(new { success = false, message = "Account not found" });
                acc.googleCalendarEnabled = enabled;
                if (!enabled) acc.googleRefreshToken = null; // optionally revoke
                db.SaveChanges();
            }

            return Json(new { success = true });
        }

        private async Task CreateGoogleEventForAccountAsync(RGDCContext dbContext, int apptID, int accID, string refreshToken)
        {
            // You can create a new DbContext inside this task if you prefer
            using (var db = new RGDCContext())
            {
                var appt = db.tbl_appointment.FirstOrDefault(a => a.apptID == apptID);
                if (appt == null) return;

                var clientId = ConfigurationManager.AppSettings["GoogleClientId"];
                var clientSecret = ConfigurationManager.AppSettings["GoogleClientSecret"];

                var flow = new Google.Apis.Auth.OAuth2.Flows.GoogleAuthorizationCodeFlow(
                    new Google.Apis.Auth.OAuth2.Flows.GoogleAuthorizationCodeFlow.Initializer
                    {
                        ClientSecrets = new Google.Apis.Auth.OAuth2.ClientSecrets { ClientId = clientId, ClientSecret = clientSecret },
                        Scopes = new[] { Google.Apis.Calendar.v3.CalendarService.Scope.CalendarEvents }
                    });

                var token = new Google.Apis.Auth.OAuth2.Responses.TokenResponse { RefreshToken = refreshToken };
                var cred = new Google.Apis.Auth.OAuth2.UserCredential(flow, "user-" + accID, token);

                // refresh to get access token
                var refreshed = await cred.RefreshTokenAsync(CancellationToken.None);
                if (!refreshed) return;

                var service = new Google.Apis.Calendar.v3.CalendarService(new Google.Apis.Services.BaseClientService.Initializer
                {
                    HttpClientInitializer = cred,
                    ApplicationName = "RGDC Web Application"
                });

                var ev = new Google.Apis.Calendar.v3.Data.Event
                {
                    Summary = appt.reason ?? "RGDC Appointment",
                    Description = $"Dentist ID: {appt.dentistID}",
                    Start = new Google.Apis.Calendar.v3.Data.EventDateTime { DateTime = appt.dateTime, TimeZone = "UTC" },
                    End = new Google.Apis.Calendar.v3.Data.EventDateTime { DateTime = appt.dateTime.AddMinutes(30), TimeZone = "UTC" }
                };

                var created = await service.Events.Insert(ev, "primary").ExecuteAsync();

                // Optionally persist created.Id back to appt for future deletion/updates
                if (!string.IsNullOrEmpty(created.Id))
                {
                    // safer to open a new db context for updates
                    using (var updateDb = new RGDCContext())
                    {
                        var a = updateDb.tbl_appointment.FirstOrDefault(x => x.apptID == apptID);
                        if (a != null)
                        {
                            a.remarks = (a.remarks ?? "") + $"|googleEventId:{created.Id}";
                            updateDb.SaveChanges();
                        }
                    }
                }
            }
        }

        public JsonResult updatePayment(tblPaymentModel model)
        {
            using (var db = new RGDCContext())
            {
                var payment = db.tbl_payment
                                .FirstOrDefault(x => x.paymentID == model.paymentID);

                if (payment != null)
                {
                    payment.paymentMethod = model.paymentMethod;
                    payment.cost = model.cost;
                    payment.discount = model.discount;
                    payment.amountPaid = model.amountPaid;
                    payment.amountDue = model.amountDue;
                    payment.description = model.description;
                    payment.payUpdatedAt = DateTime.Now;

                    db.SaveChanges();
                }

                return Json(new { success = true }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult DenyAppointment(int apptID)
        {
            try
            {
                if (apptID <= 0)
                    return Json(new { success = false, message = "Invalid appointment ID." });

                using (var db = new RGDCContext())
                {
                    var appt = db.tbl_appointment.FirstOrDefault(a => a.apptID == apptID);
                    if (appt == null)
                        return Json(new { success = false, message = "Appointment not found." });

                    if (appt.status != "Requested")
                        return Json(new { success = false, message = "Appointment is not in requested status." });

                    appt.status = "Denied";
                    appt.schedUpdatedAt = DateTime.Now;
                    db.SaveChanges();

                    return Json(new { success = true, message = "Appointment denied successfully." });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error denying appointment: {ex.Message}" });
            }
        }
        public JsonResult deletePayment(tblPaymentModel model)
        {
            using (var db = new RGDCContext())
            {
                var payment = db.tbl_payment
                                .FirstOrDefault(x => x.paymentID == model.paymentID);

                if (payment != null)
                {
                    db.tbl_payment.Remove(payment);
                    db.SaveChanges();
                }

                return Json(new { success = true }, JsonRequestBehavior.AllowGet);
            }
        }


        //profile uploaddsasdasdaa
        [HttpPost]
        public JsonResult UploadUserPhoto()
        {
            try
            {
                if (Request.Files == null || Request.Files.Count == 0)
                    return Json(new { success = false, message = "No file received." });

                HttpPostedFileBase file = Request.Files[0];
                if (file == null || file.ContentLength == 0)
                    return Json(new { success = false, message = "No file provided." });

                // Validate image MIME type
                if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                    return Json(new { success = false, message = "Invalid file type. Image required." });

                string uploadPath = Server.MapPath("~/Content/Uploads/");
                if (!Directory.Exists(uploadPath))
                    Directory.CreateDirectory(uploadPath);

                string fileName = Guid.NewGuid().ToString("N") + Path.GetExtension(file.FileName);
                string filePath = Path.Combine(uploadPath, fileName);
                file.SaveAs(filePath);

                string relativePath = "/Content/Uploads/" + fileName;

                using (var db = new RGDCContext())
                {
                    // Save to tbl_images
                    var imgData = new tblImagesModel()
                    {
                        imageName = fileName,
                        imagePath = "/Content/Uploads/",
                        createdAt = DateTime.Now,
                        updatedAt = DateTime.Now
                    };
                    db.tbl_images.Add(imgData);
                    db.SaveChanges();

                    // Update account photoLink. Accept optional accID form value or fallback to session UserID
                    int accID = 0;
                    if (Request.Form["accID"] != null && int.TryParse(Request.Form["accID"], out accID))
                    {
                        // use provided accID
                    }
                    else
                    {
                        var sessionUser = Session["UserID"];
                        if (sessionUser != null && int.TryParse(sessionUser.ToString(), out int sAcc))
                        {
                            accID = sAcc;
                        }
                    }

                    if (accID > 0)
                    {
                        var acc = db.tbl_account.FirstOrDefault(a => a.accID == accID);
                        if (acc != null)
                        {
                            acc.photoLink = relativePath;
                            acc.accUpdatedAt = DateTime.Now;
                            db.SaveChanges();
                        }
                    }

                    return Json(new
                    {
                        success = true,
                        message = "Photo uploaded successfully.",
                        filePath = relativePath,
                        imageID = imgData.imageID,
                        accID = accID
                    });
                }
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = $"Error uploading photo: {ex.Message}"
                });
            }
        }
        public ActionResult getClinicStaff()
        {
            using (var db = new RGDCContext())
            {
                var accounts = db.tbl_account
                    .Select(a => new
                    {
                        a.accID,
                        fullName = a.firstName + " " + a.lastName,
                        a.email,
                        a.role
                    })
                    .ToList();

                var owners = (from o in db.tbl_owner
                              join a in db.tbl_account on o.accID equals a.accID
                              select new
                              {
                                  o.ownerID,
                                  o.accID,
                                  fullName = a.firstName + " " + a.lastName,
                                  o.specialization,
                                  o.signature
                              }).ToList();

                var dentists = (from d in db.tbl_dentist
                                join a in db.tbl_account on d.accID equals a.accID
                                join g in db.tbl_branch on d.branchID equals g.branchID
                                select new
                                {
                                    d.dentistID,
                                    d.accID,
                                    fullName = a.firstName + " " + a.lastName,
                                    d.specialization,
                                    d.branchID,
                                    g.description,
                                    d.signature
                                }).ToList();

                var staff = (from s in db.tbl_staff
                             join a in db.tbl_account on s.accID equals a.accID
                             join g in db.tbl_branch on s.branchID equals g.branchID
                             select new
                             {
                                 s.staffID,
                                 s.accID,
                                 fullName = a.firstName + " " + a.lastName,
                                 s.staffRole,
                                 s.branchID,
                                 g.description,
                                 s.signature
                             }).ToList();

                return Json(new
                {
                    accounts = accounts,
                    owners = owners,
                    dentists = dentists,
                    staff = staff
                }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult addAccount(tblAccountModel accmod)
        {
            using (var db = new RGDCContext())
            {
                var newAccount = new tblAccountModel
                {
                    firstName = accmod.firstName,
                    middleName = accmod.middleName,
                    lastName = accmod.lastName,
                    genderID = accmod.genderID,
                    birthDate = accmod.birthDate,
                    email = accmod.email,
                    contactNumber = accmod.contactNumber,
                    address = accmod.address,
                    civilStatus = accmod.civilStatus,
                    password = passwordHash("Default123"),
                    photoLink = string.IsNullOrWhiteSpace(accmod.photoLink) ? null : accmod.photoLink,
                    role = accmod.role,
                    lastLogin = DateTime.Now,
                    accCreatedAt = DateTime.Now,
                    accUpdatedAt = DateTime.Now
                };

                db.tbl_account.Add(newAccount);
                db.SaveChanges();

                // ← accID is now returned so JS can chain InsertOwner after this
                return Json(new
                {
                    success = true,
                    message = "Account inserted successfully.",
                    accID = newAccount.accID
                }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult addOwner(tblOwnerModel ownermod)
        {
            using (var db = new RGDCContext())
            {
                var newOwner = new tblOwnerModel
                {
                    accID = ownermod.accID,
                    specialization = ownermod.specialization,
                    //signature = ownermod.signature
                };

                db.tbl_owner.Add(newOwner);
                db.SaveChanges();

                return Json(new
                {
                    success = true,
                    message = "Owner inserted successfully.",
                }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult addDentist(tblDentistModel dentistmod)
        {
            using (var db = new RGDCContext())
            {
                var newDentist = new tblDentistModel
                {
                    accID = dentistmod.accID,
                    specialization = dentistmod.specialization,
                    branchID = dentistmod.branchID,
                    //signature = ownermod.signature
                };

                db.tbl_dentist.Add(newDentist);
                db.SaveChanges();

                return Json(new
                {
                    success = true,
                    message = "Dentist inserted successfully.",
                }, JsonRequestBehavior.AllowGet);
            }
        }
        [HttpPost]
        public JsonResult addStaff(tblStaffModel staffmod)
        {
            using (var db = new RGDCContext())
            {
                var newStaff = new tblStaffModel
                {
                    accID = staffmod.accID,
                    staffRole = staffmod.staffRole,
                    branchID = staffmod.branchID,
                    //signature = ownermod.signature
                };

                db.tbl_staff.Add(newStaff);
                db.SaveChanges();

                return Json(new
                {
                    success = true,
                    message = "Staff inserted successfully.",
                }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult deleteOwner(tblOwnerModel ownermod)
        {
            using (var db = new RGDCContext())
            {
                var existing = db.tbl_owner.Find(ownermod.ownerID);
                if (existing == null)
                    return Json(new
                    {
                        success = false,
                        message = "Owner not found."
                    }, JsonRequestBehavior.AllowGet);
                db.tbl_owner.Remove(existing);

                var existingAcc = db.tbl_account.Find(ownermod.accID);
                if (existing == null)
                    return Json(new
                    {
                        success = false,
                        message = "Owner not found."
                    }, JsonRequestBehavior.AllowGet);
                db.tbl_account.Remove(existingAcc);
                db.SaveChanges();

                return Json(new { success = true, message = "Owner deleted successfully." },
                            JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult deleteDentist(tblDentistModel dentistmod)
        {
            using (var db = new RGDCContext())
            {
                var existing = db.tbl_dentist.Find(dentistmod.dentistID);
                if (existing == null)
                    return Json(new
                    {
                        success = false,
                        message = "Dentist not found."
                    }, JsonRequestBehavior.AllowGet);
                db.tbl_dentist.Remove(existing);

                var existingAcc = db.tbl_account.Find(dentistmod.accID);
                if (existing == null)
                    return Json(new
                    {
                        success = false,
                        message = "Dentist not found."
                    }, JsonRequestBehavior.AllowGet);
                db.tbl_account.Remove(existingAcc);
                db.SaveChanges();

                return Json(new { success = true, message = "Dentist deleted successfully." },
                            JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult deleteStaff(tblStaffModel staffmod)
        {
            using (var db = new RGDCContext())
            {
                var existing = db.tbl_staff.Find(staffmod.staffID);
                if (existing == null)
                    return Json(new
                    {
                        success = false,
                        message = "Staff not found."
                    }, JsonRequestBehavior.AllowGet);
                db.tbl_staff.Remove(existing);

                var existingAcc = db.tbl_account.Find(staffmod.accID);
                if (existing == null)
                    return Json(new
                    {
                        success = false,
                        message = "Staff not found."
                    }, JsonRequestBehavior.AllowGet);
                db.tbl_account.Remove(existingAcc);
                db.SaveChanges();

                return Json(new { success = true, message = "Staff deleted successfully." },
                            JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult deletePatient(tblPatientModel patMod)
        {
            using (var db = new RGDCContext())
            {
                var existing = db.tbl_patient.Find(patMod.patientID);
                if (existing == null)
                    return Json(new
                    {
                        success = false,
                        message = "Patient not found."
                    }, JsonRequestBehavior.AllowGet);
                db.tbl_patient.Remove(existing);

                var existingAcc = db.tbl_account.Find(patMod.accID);
                if (existing == null)
                    return Json(new
                    {
                        success = false,
                        message = "Patient not found."
                    }, JsonRequestBehavior.AllowGet);
                db.tbl_account.Remove(existingAcc);
                db.SaveChanges();

                return Json(new { success = true, message = "Patient deleted successfully." },
                            JsonRequestBehavior.AllowGet);
            }
        }
        public JsonResult selectOwner(tblOwnerModel ownerAcc)
        {
            using (var db = new RGDCContext())
            {
                var result = (
                    from o in db.tbl_owner
                    join a in db.tbl_account on o.accID equals a.accID
                    where o.ownerID == ownerAcc.ownerID
                    select new
                    {
                        // OWNER
                        ownerID = o.ownerID,
                        accID = o.accID,
                        specialization = o.specialization,
                        signature = o.signature,

                        // ACCOUNT (matches your ng-model)
                        firstName = a.firstName,
                        middleName = a.middleName,
                        lastName = a.lastName,
                        genderID = a.genderID,
                        birthDate = a.birthDate,
                        email = a.email,
                        contactNumber = a.contactNumber,
                        address = a.address,
                        civilStatus = a.civilStatus,
                        photoLink = a.photoLink
                    }
                ).FirstOrDefault();

                return Json(result, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult selectDentist(tblDentistModel dentistAcc)
        {
            using (var db = new RGDCContext())
            {
                var result = (
                    from d in db.tbl_dentist
                    join a in db.tbl_account on d.accID equals a.accID
                    where d.dentistID == dentistAcc.dentistID
                    select new
                    {
                        // OWNER
                        dentistID = d.dentistID,
                        accID = d.accID,
                        specialization = d.specialization,
                        branchID = d.branchID,
                        signature = d.signature,

                        // ACCOUNT (matches your ng-model)
                        firstName = a.firstName,
                        middleName = a.middleName,
                        lastName = a.lastName,
                        genderID = a.genderID,
                        birthDate = a.birthDate,
                        email = a.email,
                        contactNumber = a.contactNumber,
                        address = a.address,
                        civilStatus = a.civilStatus,
                        photoLink = a.photoLink
                    }
                ).FirstOrDefault();

                return Json(result, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult selectStaff(tblStaffModel staffAcc)
        {
            using (var db = new RGDCContext())
            {
                var result = (
                    from s in db.tbl_staff
                    join a in db.tbl_account on s.accID equals a.accID
                    where s.staffID == staffAcc.staffID
                    select new
                    {
                        // OWNER
                        staffID = s.staffID,
                        accID = s.accID,
                        staffRole = s.staffRole,
                        branchID = s.branchID,
                        signature = s.signature,

                        // ACCOUNT (matches your ng-model)
                        firstName = a.firstName,
                        middleName = a.middleName,
                        lastName = a.lastName,
                        genderID = a.genderID,
                        birthDate = a.birthDate,
                        email = a.email,
                        contactNumber = a.contactNumber,
                        address = a.address,
                        civilStatus = a.civilStatus,
                        photoLink = a.photoLink
                    }
                ).FirstOrDefault();

                return Json(result, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult updateAccount(tblAccountModel accmod)
        {
            using (var db = new RGDCContext())
            {
                var existing = db.tbl_account.FirstOrDefault(a => a.accID == accmod.accID);

                if (existing == null)
                {
                    return Json(new
                    {
                        success = false,
                        message = "Account not found."
                    }, JsonRequestBehavior.AllowGet);
                }

                existing.firstName = accmod.firstName;
                existing.middleName = accmod.middleName;
                existing.lastName = accmod.lastName;
                existing.genderID = accmod.genderID;
                existing.birthDate = accmod.birthDate;
                existing.email = accmod.email;
                existing.contactNumber = accmod.contactNumber;
                existing.address = accmod.address;
                existing.civilStatus = accmod.civilStatus;
                existing.accUpdatedAt = DateTime.Now;

                db.SaveChanges();

                return Json(new
                {
                    success = true,
                    message = "Account updated successfully."
                }, JsonRequestBehavior.AllowGet);
            }

        }
        public JsonResult updateOwner(tblOwnerModel ownermod)
        {
            using (var db = new RGDCContext())
            {
                var existing = db.tbl_owner.FirstOrDefault(o => o.ownerID == ownermod.ownerID);

                if (existing == null)
                {
                    return Json(new
                    {
                        success = false,
                        message = "Owner not found."
                    }, JsonRequestBehavior.AllowGet);
                }

                existing.specialization = ownermod.specialization;
                //existing.signature = ownermod.signature;

                db.SaveChanges();

                return Json(new
                {
                    success = true,
                    message = "Owner updated successfully."
                }, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult updateDentist(tblDentistModel dentistmod)
        {
            using (var db = new RGDCContext())
            {
                var existing = db.tbl_dentist.FirstOrDefault(d => d.dentistID == dentistmod.dentistID);

                if (existing == null)
                {
                    return Json(new
                    {
                        success = false,
                        message = "Dentist not found."
                    }, JsonRequestBehavior.AllowGet);
                }

                existing.specialization = dentistmod.specialization;
                existing.branchID = dentistmod.branchID;
                //existing.signature = ownermod.signature;

                db.SaveChanges();

                return Json(new
                {
                    success = true,
                    message = "Dentist updated successfully."
                }, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult updateStaff(tblStaffModel staffmod)
        {
            using (var db = new RGDCContext())
            {
                var existing = db.tbl_staff.FirstOrDefault(s => s.staffID == staffmod.staffID);

                if (existing == null)
                {
                    return Json(new
                    {
                        success = false,
                        message = "Staff not found."
                    }, JsonRequestBehavior.AllowGet);
                }

                existing.staffRole = staffmod.staffRole;
                existing.branchID = staffmod.branchID;
                //existing.signature = ownermod.signature;

                db.SaveChanges();

                return Json(new
                {
                    success = true,
                    message = "Staff updated successfully."
                }, JsonRequestBehavior.AllowGet);
            }
        }
        public JsonResult getDentistOwner()
        {
            using (var db = new RGDCContext())
            {
                var dentists = (
                    from d in db.tbl_dentist
                    join a in db.tbl_account on d.accID equals a.accID
                    select new
                    {
                        accID = d.accID,
                        fullName = a.firstName + " " + a.lastName,
                        type = "Dentist"
                    });

                var owners = (
                    from o in db.tbl_owner
                    join a in db.tbl_account on o.accID equals a.accID
                    select new
                    {
                        accID = o.accID,
                        fullName = a.firstName + " " + a.lastName,
                        type = "Owner"
                    });

                var result = dentists.Concat(owners).ToList();

                return Json(result, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult addProgNotes(tblTreatmentPlanModel model)
        {
            var role = Session["UserAuthorization"] != null ? Session["UserAuthorization"].ToString() : null;
            if (role == "1")
                return Json(new { success = false, message = "Not authorized" }, JsonRequestBehavior.AllowGet);

            if (model == null)
                return Json(new { success = false, message = "Empty payload." }, JsonRequestBehavior.AllowGet);

            if (model == null)
                return Json(new { success = false, message = "Empty payload." }, JsonRequestBehavior.AllowGet);

            if (model.patientID <= 0)
                return Json(new { success = false, message = "Missing or invalid patientID." }, JsonRequestBehavior.AllowGet);

            if (model.accID <= 0)
                return Json(new { success = false, message = "Missing or invalid accID (dentist)." }, JsonRequestBehavior.AllowGet);

            if (string.IsNullOrWhiteSpace(model.procedures))
                return Json(new { success = false, message = "Procedures is required." }, JsonRequestBehavior.AllowGet);

            DateTime noteDate;
            try
            {
                noteDate = (model.date == default(DateTime)) ? DateTime.Now : model.date;
                noteDate = noteDate.Date.Add(DateTime.Now.TimeOfDay);
            }
            catch
            {
                noteDate = DateTime.Now;
            }

            try
            {
                using (var db = new RGDCContext())
                {
                    var patientExists = db.tbl_patient.Any(p => p.patientID == model.patientID);
                    var accExists = db.tbl_account.Any(a => a.accID == model.accID);

                    if (!patientExists)
                        return Json(new { success = false, message = $"Patient not found (patientID={model.patientID})." }, JsonRequestBehavior.AllowGet);

                    if (!accExists)
                        return Json(new { success = false, message = $"Account / Dentist not found (accID={model.accID})." }, JsonRequestBehavior.AllowGet);

                    var note = new tblTreatmentPlanModel
                    {
                        date = noteDate,
                        patientID = model.patientID,
                        accID = model.accID,
                        amount = model.amount,
                        paid = model.paid,
                        procedures = model.procedures,
                        toothNumber = model.toothNumber
                    };

                    db.tbl_treatmentplan.Add(note);
                    var patientLastUpdated = db.tbl_patient.Where(p => p.patientID == model.patientID).Select(p => p.lastUpdated).FirstOrDefault();
                    if (noteDate > patientLastUpdated)
                    {
                        var patient = db.tbl_patient.FirstOrDefault(p => p.patientID == model.patientID);
                        if (patient != null)
                        {
                            patient.lastUpdated = noteDate;
                        }
                    }
                    db.SaveChanges();

                    return Json(new { success = true }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Trace.WriteLine("addProgNotes error: " + ex.ToString());
                return Json(new { success = false, message = "Server error adding progress note." }, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult selectPlan(tblTreatmentPlanModel plan)
        {
            using (var db = new RGDCContext())
            {
                var result = (
                    from t in db.tbl_treatmentplan
                    join a in db.tbl_account on t.accID equals a.accID
                    join p in db.tbl_patient on t.patientID equals p.patientID

                    where t.trtPlanID == plan.trtPlanID

                    select new
                    {
                        // TREATMENT PLAN
                        trtPlanID = t.trtPlanID,
                        date = t.date,
                        toothNumber = t.toothNumber,
                        procedures = t.procedures,
                        amount = t.amount,
                        paid = t.paid,

                        // DENTIST
                        accID = t.accID,
                        patientID = p.patientID
                    }
                ).FirstOrDefault();

                return Json(result, JsonRequestBehavior.AllowGet);
            }
        }
        [HttpPost]
        public JsonResult editProgressNotes(tblTreatmentPlanModel model)
        {
            using (var db = new RGDCContext())
            {
                var existing = db.tbl_treatmentplan
                    .FirstOrDefault(t => t.trtPlanID == model.trtPlanID);

                if (existing == null)
                {
                    return Json(new
                    {
                        success = false,
                        message = "Progress note not found."
                    }, JsonRequestBehavior.AllowGet);
                }

                // UPDATE FIELDS
                existing.accID = model.accID;
                existing.date = model.date;
                existing.toothNumber = model.toothNumber;
                existing.procedures = model.procedures;
                existing.amount = model.amount;
                existing.paid = model.paid;
                var patientLastUpdated = db.tbl_patient.FirstOrDefault(p => p.patientID == model.patientID);
                patientLastUpdated.lastUpdated = model.date > patientLastUpdated.lastUpdated ? model.date : patientLastUpdated.lastUpdated;
                db.SaveChanges();

                return Json(new
                {
                    success = true,
                    message = "Progress note updated successfully."
                }, JsonRequestBehavior.AllowGet);
            }
        }
        [HttpPost]
        public JsonResult deletePlan(tblTreatmentPlanModel trtPlan)
        {
            using (var db = new RGDCContext())
            {
                var existing = db.tbl_treatmentplan
                    .FirstOrDefault(t => t.trtPlanID == trtPlan.trtPlanID);
                if (existing == null)
                {
                    return Json(new
                    {
                        success = false,
                        message = "Progress note not found."
                    }, JsonRequestBehavior.AllowGet);
                }

                db.tbl_treatmentplan.Remove(existing);
                db.SaveChanges();

                return Json(new
                {
                    success = true,
                    message = "Progress note deleted successfully."
                }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult getOverviewData()
        {
            using (var db = new RGDCContext())
            {
                var today = DateTime.Now;
                var startOfMonth = new DateTime(today.Year, today.Month, 1);
                var startOfWeek = today.AddDays(-(int)today.DayOfWeek);

                var totalPatients = db.tbl_patient.Count();

                var newPatientsThisMonth = (from p in db.tbl_patient
                                            join a in db.tbl_account on p.accID equals a.accID
                                            where a.accCreatedAt >= startOfMonth
                                            select p).Count();

                var patientsDoneThisWeek = db.tbl_treatmentplan
                    .Where(t => t.date >= startOfWeek)
                    .Select(t => t.patientID)
                    .Distinct()
                    .Count();

                var unpaidPatients = db.tbl_treatmentplan
                    .Where(t => t.paid != 0)
                    .Select(t => t.patientID)
                    .Distinct()
                    .Count();

                return Json(new
                {
                    totalPatients,
                    newPatientsThisMonth,
                    patientsDoneThisWeek,
                    unpaidPatients
                }, JsonRequestBehavior.AllowGet);
            }
        }
        [HttpGet]
        public JsonResult getAnalyticsData()
        {
            using (var db = new RGDCContext())
            {
                var today = DateTime.Now;
                var startOfWeek = today.AddDays(-(int)today.DayOfWeek);
                var sixMonthsAgo = new DateTime(today.AddMonths(-5).Year, today.AddMonths(-5).Month, 1);

                // Pull raw data into memory first — avoids MySQL GroupBy EF6 bug
                var allAccounts = (from a in db.tbl_account select a).ToList();
                var allTreatments = (from t in db.tbl_treatmentplan select t).ToList();

                // Patients per month (last 6 months)
                var patientsPerMonth = (from a in allAccounts
                                        where a.accCreatedAt >= sixMonthsAgo
                                        group a by new { a.accCreatedAt.Year, a.accCreatedAt.Month } into g
                                        orderby g.Key.Year, g.Key.Month
                                        select new
                                        {
                                            label = g.Key.Month + "/" + g.Key.Year,
                                            count = g.Count()
                                        }).ToList();

                // Procedures this week
                var proceduresThisWeek = (from t in allTreatments
                                          where t.date >= startOfWeek
                                          group t by t.date.DayOfWeek into g
                                          select new
                                          {
                                              day = g.Key.ToString(),
                                              count = g.Count()
                                          }).ToList();

                // Procedures by revenue
                var proceduresByRevenue = (from t in allTreatments
                                           group t by t.procedures into g
                                           orderby g.Sum(x => x.amount) descending
                                           select new
                                           {
                                               procedure = g.Key,
                                               total = g.Sum(x => x.amount)
                                           }).Take(5).ToList();

                // Paid vs Unpaid
                var paid = (from t in allTreatments where t.paid >= t.amount select t).Count();
                var unpaid = (from t in allTreatments where t.paid < t.amount select t).Count();

                return Json(new
                {
                    patientsPerMonth,
                    proceduresThisWeek,
                    proceduresByRevenue,
                    paid,
                    unpaid
                }, JsonRequestBehavior.AllowGet);
            }
        }

        //for adding of forms
        [HttpPost]
        public JsonResult AddForm(tblFormModel model)
        {
            if (model == null)
                return Json(new { success = false, message = "Invalid payload." }, JsonRequestBehavior.AllowGet);

            if (model.patientID <= 0)
            {
                try
                {
                    if (Session["selectedPatientID"] != null)
                        model.patientID = Convert.ToInt32(Session["selectedPatientID"]);
                }
                catch { }
            }

            if (model.patientID <= 0)
                return Json(new { success = false, message = "No patient selected." }, JsonRequestBehavior.AllowGet);

            if (string.IsNullOrWhiteSpace(model.formLink))
                return Json(new { success = false, message = "No file provided." }, JsonRequestBehavior.AllowGet);

            try
            {
                model.formCreatedAt = DateTime.Now;
                model.formUpdatedAt = DateTime.Now;
                try
                {
                    model.createdBy = Session["userID"] != null ? Convert.ToInt32(Session["userID"]) : 0;
                }
                catch { model.createdBy = 0; }

                if (model.formatID == 0) model.formatID = 1;

                using (var db = new Models.Context.RGDCContext())
                {
                    db.tblFormModels.Add(model);
                    db.SaveChanges();
                }

                return Json(new { success = true, message = "Form saved.", formID = model.formID }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Server error: " + ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }


        //displaying of forms in the table
        [HttpGet]
        public JsonResult GetPatientForms()
        {
            try
            {
                using (var db = new RGDCContext())
                {
                    var sessionVal = Session["SelectedPatientID"];
                    if (sessionVal == null) return Json(new List<object>(), JsonRequestBehavior.AllowGet);
                    if (!int.TryParse(sessionVal.ToString(), out int pid)) return Json(new List<object>(), JsonRequestBehavior.AllowGet);

                    var result = (
                        from f in db.tblFormModels
                        join d in db.tbl_dentist on f.dentistID equals d.dentistID into dj
                        from d in dj.DefaultIfEmpty()
                        join da in db.tbl_account on (d != null ? d.accID : 0) equals da.accID into daj
                        from da in daj.DefaultIfEmpty()
                        where f.patientID == pid
                        orderby f.formCreatedAt descending
                        select new
                        {
                            formID = f.formID,
                            formLink = f.formLink,
                            date = f.formCreatedAt,
                            dentistName = da != null ? (da.firstName + " " + da.lastName) : null,
                            createdBy = f.createdBy,
                            formatID = f.formatID
                        }
                    ).ToList();

                    return Json(result, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult SaveForm(tblFormModel model)
        {
            if (model == null || model.formID <= 0)
                return Json(new { success = false, message = "Invalid payload." }, JsonRequestBehavior.AllowGet);

            try
            {
                using (var db = new RGDCContext())
                {
                    var existing = db.tblFormModels.FirstOrDefault(x => x.formID == model.formID);
                    if (existing == null)
                        return Json(new { success = false, message = "Form not found." }, JsonRequestBehavior.AllowGet);

                    existing.dentistID = model.dentistID > 0 ? model.dentistID : existing.dentistID;
                    existing.formLink = string.IsNullOrWhiteSpace(model.formLink) ? existing.formLink : model.formLink;
                    existing.formatID = model.formatID > 0 ? model.formatID : existing.formatID;
                    existing.formUpdatedAt = DateTime.Now;
                    db.SaveChanges();

                    return Json(new { success = true, message = "Form updated.", formID = existing.formID }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult DeleteForm(int formID)
        {
            if (formID <= 0) return Json(new { success = false, message = "Invalid formID" });
            try
            {
                using (var db = new RGDCContext())
                {
                    var existing = db.tblFormModels.FirstOrDefault(f => f.formID == formID);
                    if (existing == null) return Json(new { success = false, message = "Form not found" });
                    db.tblFormModels.Remove(existing);
                    db.SaveChanges();
                    return Json(new { success = true, message = "Form deleted." });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public JsonResult SaveDentistSignature(string imagePath)
        {
            if (string.IsNullOrWhiteSpace(imagePath))
                return Json(new { success = false, message = "No image path provided." });

            try
            {
                using (var db = new RGDCContext())
                {
                    var sessionUser = Session["UserID"];
                    if (sessionUser == null || !int.TryParse(sessionUser.ToString(), out int accID))
                        return Json(new { success = false, message = "User session expired." });

                    // Try dentist record
                    var dentist = db.tbl_dentist.FirstOrDefault(d => d.accID == accID);
                    if (dentist != null)
                    {
                        dentist.signature = imagePath;
                        db.SaveChanges();
                        return Json(new { success = true, message = "Signature saved for dentist.", filePath = imagePath });
                    }

                    // Try owner record
                    var owner = db.tbl_owner.FirstOrDefault(o => o.accID == accID);
                    if (owner != null)
                    {
                        owner.signature = imagePath;
                        db.SaveChanges();
                        return Json(new { success = true, message = "Signature saved for owner.", filePath = imagePath });
                    }

                    // Try staff record
                    var staff = db.tbl_staff.FirstOrDefault(s => s.accID == accID);
                    if (staff != null)
                    {
                        staff.signature = imagePath;
                        db.SaveChanges();
                        return Json(new { success = true, message = "Signature saved for staff.", filePath = imagePath });
                    }

                    // No role-specific record found
                    return Json(new { success = false, message = "User role record not found to save signature." });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error saving signature: {ex.Message}" });
            }
        }
    }
}

