using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Services;
using Microsoft.Ajax.Utilities;
using MySql.Data.MySqlClient;
using MySqlX.XDevAPI.Common;
using Newtonsoft.Json;
using Org.BouncyCastle.Asn1.Cms;
using Org.BouncyCastle.Asn1.Ocsp;
using Org.BouncyCastle.Ocsp;
using Org.BouncyCastle.Pqc.Crypto.Lms;
using RGDC_Web_Application.Models;
using RGDC_Web_Application.Models.Context;
using RGDC_Web_Application.Models.Map;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.Entity;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Management.Instrumentation;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Mail;
using System.Reflection.Emit;
using System.Runtime.ConstrainedExecution;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Security.Principal;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Web.Helpers;
using System.Web.Management;
using System.Web.Mvc;
using System.Web.UI.WebControls;
using System.Xml.Linq;
using static System.Net.Mime.MediaTypeNames;
using static System.Net.WebRequestMethods;


namespace RGDC_Web_Application.Controllers
{
    public class RGDCController : Controller
    {
        public ActionResult signUp()
        {
            return View();
        }

        public ActionResult signUpStaff()
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
        public JsonResult DeleteAppointment(int apptID, string reason = null)
        {
            try
            {
                if (apptID < 0)
                    return Json(new { success = false, message = "Invalid appointment ID." });

                using (var db = new RGDCContext())
                {
                    var appt = db.tbl_appointment.FirstOrDefault(a => a.apptID == apptID);
                    if (appt == null)
                        return Json(new { success = false, message = "Appointment not found." });


                    appt.status = "Cancelled";
                    var r = (reason ?? "").Trim();
                    appt.remarks = !string.IsNullOrEmpty(r) ? $"Deleted by admin: {r}" : "Deleted by admin.";

                    db.SaveChanges();

                    return Json(new { success = true, message = "Appointment marked as deleted and moved to Past Appointments." });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error deleting appointment: {ex.Message}" });
            }
        }

        public ActionResult adminDashboard()
        {
            if (Session["isLoggedIn"] == null || !(bool)Session["isLoggedIn"])
            {
                return RedirectToAction("logIn", "RGDC"); 
            }

            return View();
        }

        public ActionResult logIn()
        {

            return View();
        }


        public ActionResult adminPatientsTab()
        {
            if (Session["isLoggedIn"] == null || !(bool)Session["isLoggedIn"])
            {
                return RedirectToAction("logIn", "RGDC");
            }
            return View();
        }


        public ActionResult adminFinance()
        {
            if (Session["isLoggedIn"] == null || !(bool)Session["isLoggedIn"])
            {
                return RedirectToAction("logIn", "RGDC");
            }
            return View();
        }

        public ActionResult adminAppointment()
        {
            if (Session["isLoggedIn"] == null || !(bool)Session["isLoggedIn"])
            {
                return RedirectToAction("logIn", "RGDC");
            }
            return View();
        }

        public ActionResult adminClinicStaffTab()
        {
            if (Session["isLoggedIn"] == null || !(bool)Session["isLoggedIn"])
            {
                return RedirectToAction("logIn", "RGDC");
            }
            return View();
        }

        public ActionResult contactUsPage()
        {
            if (Session["isLoggedIn"] == null || !(bool)Session["isLoggedIn"])
            {
                return RedirectToAction("logIn", "RGDC");
            }
            return View();
        }

        public ActionResult faqPage()
        {
            if (Session["isLoggedIn"] == null || !(bool)Session["isLoggedIn"])
            {
                return RedirectToAction("logIn", "RGDC");
            }
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

        [HttpPost]
        public JsonResult checkAddQueue(tblAddAccountModel signUpStaffData)
           
        {
            try
            {
                var email = signUpStaffData.email;
                var code = signUpStaffData.code;
                if (string.IsNullOrWhiteSpace(email))
                    return Json(new { exists = false }, JsonRequestBehavior.AllowGet);

                var normalized = email.Trim().ToLowerInvariant();

                using (var db = new RGDCContext())
                {
                    var addAccountRecord = db.tbl_addAccount.FirstOrDefault(a => a.email != null && a.email.Trim().ToLower() == normalized);

                    if (addAccountRecord == null)
                    {
                        return Json(new
                        {
                            exists = false,
                            message = "Email not found in registration queue."
                        }, JsonRequestBehavior.AllowGet);
                    }
                    if (!string.IsNullOrWhiteSpace(code))
                    {
                        var codeNormalized = code.Trim();

                        if (addAccountRecord.code != codeNormalized)
                        {
                            return Json(new
                            {
                                exists = true,
                                codeValid = false,
                                message = "Invalid OTP code. Please check and try again."
                            }, JsonRequestBehavior.AllowGet);
                        }
                    }
                    return Json(new
                    {
                        exists = true,
                        codeValid = true,
                        message = "Email and OTP code verified successfully.",
                        permission = addAccountRecord.permission
                    }, JsonRequestBehavior.AllowGet);
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

        public JsonResult getCurrentUserPhoto()
        {
            var photoLink = Session["UserPhoto"].ToString();
            return Json(photoLink, JsonRequestBehavior.AllowGet);
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

        public JsonResult getPostOp()
        {
            try
            {
                using (var db = new RGDCContext())
                {
                    var getData = db.tbl_postop.ToList();
                    return Json(getData, JsonRequestBehavior.AllowGet);

                }
            }
            catch (Exception ex)
            {
                throw new ArgumentException($"There is an error {ex.Message}");
            }
        }
        public JsonResult savePostOp(tblPostOpModel postOp)
        {
            try
            {
                using (var db = new RGDCContext())
                {
                    var sessionVal = Session["SelectedPatientID"];
                    if (!int.TryParse(sessionVal.ToString(), out int patientID))
                        return Json(new { success = false, message = "Invalid user ID." });

                    var patient = db.tbl_patient.FirstOrDefault(p => p.patientID == patientID);

                    patient.postOpID = postOp.postOpID;
                    db.SaveChanges();

                    return Json(new { message = "success" }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                throw new ArgumentException($"There is an error {ex.Message}");
            }
        }

        public JsonResult deletePostOp(tblPostOpModel postOp)
        {
            try
            {
                using (var db = new RGDCContext())
                {
                    var sessionVal = Session["SelectedPatientID"];
                    if (!int.TryParse(sessionVal.ToString(), out int patientID))
                        return Json(new { success = false, message = "Invalid user ID." });

                    var patient = db.tbl_patient.FirstOrDefault(p => p.patientID == patientID);

                    patient.postOpID = 0;
                    db.SaveChanges();

                    return Json(new { message = "success" }, JsonRequestBehavior.AllowGet);
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
                        religion = accDetails.religion,
                        nationality = accDetails.nationality,
                        state = accDetails.state,
                        city = accDetails.city,
                        line1 = accDetails.line1,
                        line2 = accDetails.line2,
                        country = accDetails.country,
                        postal = accDetails.postal,
                        civilStatus = accDetails.civilStatus,
                        password = passwordHash(accDetails.password),
                        lastLogin = DateTime.Now,
                        accCreatedAt = DateTime.Now,
                        accUpdatedAt = DateTime.Now,
                        photoLink = accDetails.photoLink,
                        role = accDetails.role,
                        permission = accDetails.permission
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
                        // <-- store permission so server methods can filter by dentist/staff/patient
                        Session["UserPermission"] = user.permission;
                        Session["IsLoggedIn"] = true;
                        Session["UserPhoto"] = string.IsNullOrEmpty(user.photoLink) ? "" : user.photoLink;
                        if (user.permission == 3)
                        {
                            var patient = db.tbl_patient.FirstOrDefault(u => u.accID == user.accID);
                            Session["SelectedPatientID"] = patient.patientID;
                        }
                        return Json(new
                        {
                            success = true,
                            message = "Login successful",
                            firstName = Session["UserName"].ToString(),
                            fullName = Session["UserFullName"].ToString(),
                            authorization = user.role,
                            permission = user.permission,
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
                    Session["UserPermission"] = user.permission;
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
                if (Session["IsLoggedIn"] == null || !(bool)Session["IsLoggedIn"])
                {
                    RedirectToAction("login", "RGDC");
                }
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
                    userPermission = Session["UserPermission"].ToString(),
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
            if (Session["isLoggedIn"] == null || !(bool)Session["isLoggedIn"])
            {
                return RedirectToAction("logIn", "RGDC");
            }
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
                    mail.Subject = "[RGDC Clinic] Your One-Time Password (OTP) for Password Reset";
                    string htmlBody = $@"
<!DOCTYPE html>
<html lang='en'>
<head>
<meta charset='UTF-8' />
<meta name='viewport' content='width=device-width, initial-scale=1.0' />
<title>Document</title>
</head>

<body style='font-family: Roboto, sans-serif; margin:0; padding:0;'>

<div style='margin: 0 15%;'>
  
  <div style='margin-bottom: 1rem;'>
    <h4 style='margin:0;'>Hi there!</h4>
  </div>

  <div style='margin-bottom: 1rem;'>
    <p>
      This is your one-time password to connect your Google Account to
      your RGDC account. Please do not share this to anyone.
    </p>
  </div>

  <div style='text-align: center; margin-bottom: 1rem;'>
    <div style='background-color:#6d4c41; color:white; padding:20px; border-radius:5px; display:inline-block;'>
      <h3 style='margin:0; font-size:2.5rem;'>{otp}</h3>
    </div>
  </div>

  <div style='margin-bottom: 1rem;'>
    <p>
      If you did not request this OTP, or received this email by accident,
      you may safely ignore this email.
    </p>
  </div>

</div>

<div style='border-top:1px solid rgba(0,0,0,0.14); padding-top:1rem; margin: 0 15%;'>
  <p style='color:#9e9e9e;'>
    This is a system-generated message. Please do not reply to this email.
  </p>
</div>

</body>
</html>";
                    mail.IsBodyHtml = true;
                    mail.Body = htmlBody;
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
                    mail.Subject = "Welcome to RGDC Dental Clinic - Your New Account Credentials";
                    mail.IsBodyHtml = true;

                    mail.Body = $@"
Hello,

Welcome to the RGDC Dental Clinic Management System. Your account has been successfully created.

--------------------------------------------------
LOGIN DETAILS:
Default Password: Default123
--------------------------------------------------

IMPORTANT SECURITY NOTICE:
For your protection, you are required to change this password immediately upon your first login.

If you did not request this account, please contact the clinic administrator.

Thank you,
RGDC Dental Clinic Team";
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
        [HttpPost]
        public JsonResult verifyOTP(string otpCode)
        {
            // 1. Check if session exists
            if (Session["RESET_OTP"] == null || Session["RESET_OTP_EXPIRY"] == null)
            {
                return Json(new { success = false, message = "No active reset request found. Please resend OTP." });
            }

            // 2. Check Expiry
            DateTime expiry = (DateTime)Session["RESET_OTP_EXPIRY"];
            if (DateTime.Now > expiry)
            {
                // Clear session if expired
                Session["RESET_OTP"] = null;
                return Json(new { success = false, message = "OTP has expired. Please request a new one." });
            }

            // 3. Compare OTP
            string storedOtp = Session["RESET_OTP"].ToString();
            if (storedOtp == otpCode)
            {
                // Optional: Set a flag that the user is verified to proceed to the actual reset
                Session["IS_OTP_VERIFIED"] = true;

                return Json(new { success = true, message = "OTP verified successfully." });
            }
            else
            {
                return Json(new { success = false, message = "Invalid OTP code. Please try again." });
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
                        join dentAcc in db.tbl_account on (dent != null ? dent.accID : 0) equals dentAcc.accID into dentAccj
                        from dentAcc in dentAccj.DefaultIfEmpty()
                        where appt.status == "Done" || appt.status == "Completed" || appt.status == "Rescheduled" || appt.status == "Cancelled"
                        orderby appt.dateTime descending
                        select new
                        {
                            apptID = appt.apptID,
                            dateTime = appt.dateTime,
                            purpose = appt.reason,
                            dentistName = dentAcc != null ? (dentAcc.firstName + " " + dentAcc.lastName) : null,
                            patientName = patAcc != null ? (patAcc.firstName + " " + patAcc.lastName) : null,
                            status = appt.status,
                            remarks = appt.remarks
                        }
                    ).ToList();

                    // Normalize remarks: if legacy token present, replace with friendly note
                    var mapped = result.Select(r =>
                    {
                        string remarks = r.remarks ?? "";
                        remarks = CleanRemarksForUi(r.remarks ?? r.purpose ?? "");
                        try
                        {
                            if (!string.IsNullOrWhiteSpace(remarks))
                            {
                                // If contains raw tokens like ReplacedByAppt or ReplacedOn or RescheduleOf, try to extract requester/contact or create Rescheduled on entry
                                if (remarks.Contains("ReplacedByAppt") || remarks.Contains("ReplacedOn") || remarks.StartsWith("RescheduleOf:", StringComparison.OrdinalIgnoreCase))
                                {
                                    string requester = null;
                                    // attempt to read "Requester:Name" token
                                    var parts = remarks.Split(new[] { ';' }, StringSplitOptions.RemoveEmptyEntries);
                                    foreach (var p in parts)
                                    {
                                        var colon = p.IndexOf(':');
                                        if (colon < 0) continue;
                                        var key = p.Substring(0, colon).Trim();
                                        var val = p.Substring(colon + 1).Trim();
                                        if (string.Equals(key, "Requester", StringComparison.OrdinalIgnoreCase)) requester = val;
                                    }

                                    var sb = new System.Text.StringBuilder();
                                    if (!string.IsNullOrWhiteSpace(requester))
                                    {
                                        sb.Append("Requested by: ").Append(requester).Append(".\n");
                                    }
                                    // Use the stored updated time if present (ReplacedOn) - try to extract ISO timestamp
                                    var replacedOnMatch = System.Text.RegularExpressions.Regex.Match(remarks, @"ReplacedOn:([0-9T:\-\.Z]+)");
                                    if (replacedOnMatch.Success)
                                    {
                                        if (DateTime.TryParse(replacedOnMatch.Groups[1].Value, out DateTime ro))
                                        {
                                            sb.Append("Rescheduled on: ").Append(ro.ToString("MMMM d, yyyy h:mm tt"));
                                        }
                                        else
                                        {
                                            sb.Append("Rescheduled on: ").Append(DateTime.Now.ToString("MMMM d, yyyy h:mm tt"));
                                        }
                                    }
                                    else
                                    {
                                        // fallback to now
                                        sb.Append("Rescheduled on: ").Append(DateTime.Now.ToString("MMMM d, yyyy h:mm tt"));
                                    }

                                    remarks = sb.ToString();
                                }
                            }
                        }
                        catch { /* swallow */ }

                        return new
                        {
                            apptID = r.apptID,
                            dateTime = r.dateTime,
                            date = r.dateTime.ToString("MMMM d, yyyy"),
                            time = r.dateTime.ToString("h:mm tt"),
                            purpose = r.purpose,
                            dentistName = r.dentistName,
                            patientName = r.patientName,
                            status = r.status,
                            displayStatus = (r.status == "Rescheduled") ? "Rescheduled" : ((r.status == "Done" || r.status == "Completed") ? "Completed/Done" : r.status),
                            remarks = r.remarks ?? r.purpose ?? ""
                        };
                    }).ToList();

                    return Json(mapped, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }


        [HttpPost]
        public JsonResult CancelAppointment(int apptID, string reason = null)
        {
            try
            {
                if (apptID < 0) return Json(new { success = false, message = "Invalid appointment ID." });

                using (var db = new RGDCContext())
                {
                    var appt = db.tbl_appointment.FirstOrDefault(a => a.apptID == apptID);
                    if (appt == null) return Json(new { success = false, message = "Appointment not found." });

                    var today = DateTime.Today;
                    var cutoff = today.AddDays(2);
                    if (appt.dateTime.Date <= cutoff.Date)
                    {
                        return Json(new { success = false, message = "Cannot cancel appointment within 2 days of scheduled date." });
                    }

                    var r = (reason ?? "").Trim();
                    appt.remarks = !string.IsNullOrEmpty(r) ? $"Cancelled by patient: {r}" : "Cancelled by patient.";
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
                    return Json(pid, JsonRequestBehavior.AllowGet);

                var result = (
                    from p in db.tbl_patient
                    join a in db.tbl_account on p.accID equals a.accID
                    join g in db.tbl_gender on a.genderID equals g.genderID into gj
                    join o in db.tbl_postop on p.postOpID equals o.postOpID
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
                        postOpID = p.postOpID,
                        postOpInstructions = o.content,
                        patientName = a.firstName + " " + a.lastName,
                        firstName = a.firstName,
                        middleName = a.middleName,
                        lastName = a.lastName,
                        birthDate = a.birthDate,
                        genderID = a.genderID,
                        gender = g != null ? g.description : null,
                        email = a.email,
                        contactNumber = a.contactNumber,
                        state = a.state,
                        city = a.city,
                        line1 = a.line1,
                        line2 = a.line2,
                        country = a.country,
                        postal = a.postal,
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
                                state = a.state,
                                city = a.city,
                                line1 = a.line1,
                                line2 = a.line2,
                                country = a.country,
                                postal = a.postal,
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

            // Try SelectedPatientID first, otherwise use logged-in user's account to find patient
            object sessionSelected = Session["SelectedPatientID"];
            int patientID = 0;
            using (var db = new RGDCContext())
            {
                if (sessionSelected != null && int.TryParse(sessionSelected.ToString(), out int spid))
                {
                    patientID = spid;
                }
                else
                {
                    // Fallback for patient users updating their own record
                    var sessionUser = Session["UserID"];
                    if (sessionUser == null)
                    {
                        return Json(new { success = false, message = "No patient selected." });
                    }
                    if (!int.TryParse(sessionUser.ToString(), out int accId))
                    {
                        return Json(new { success = false, message = "Invalid session user." });
                    }

                    var patientByAcc = db.tbl_patient.FirstOrDefault(p => p.accID == accId);
                    if (patientByAcc == null)
                        return Json(new { success = false, message = "Patient record not found for current user." });

                    patientID = patientByAcc.patientID;
                }

                var patient = db.tbl_patient.FirstOrDefault(p => p.patientID == patientID);
                if (patient == null)
                    return Json(new { success = false, message = "Patient not found." });

                try
                {
                    // store signature link on patient record
                    patient.signatureLink = imagePath;
                    patient.lastUpdated = DateTime.Now;
                    db.SaveChanges();

                    return Json(new { success = true, message = "Signature saved to patient record.", filePath = imagePath });
                }
                catch (Exception ex)
                {
                    return Json(new { success = false, message = $"Error saving signature to patient: {ex.Message}" });
                }
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
                    acc.line1 = string.IsNullOrWhiteSpace(profInfo.line1) ? acc.line1 : profInfo.line1;
                    acc.line2 = string.IsNullOrWhiteSpace(profInfo.line2) ? acc.line2 : profInfo.line2;
                    acc.city = string.IsNullOrWhiteSpace(profInfo.city) ? acc.city : profInfo.city;
                    acc.state = string.IsNullOrWhiteSpace(profInfo.state) ? acc.state : profInfo.state;
                    acc.postal = string.IsNullOrWhiteSpace(profInfo.postal) ? acc.postal : profInfo.postal;
                    acc.country = string.IsNullOrWhiteSpace(profInfo.country) ? acc.country : profInfo.country;
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
            Session.Remove("UserPermission");
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
                // Resolve patientID: prefer SelectedPatientID (admin view), fallback to logged-in user's patient record
                object sessionVal = Session["SelectedPatientID"];
                int pid = 0;
                if (sessionVal != null && int.TryParse(sessionVal.ToString(), out int spid))
                {
                    pid = spid;
                }
                else
                {
                    // fallback for patient user updating their own record
                    var sessionUser = Session["UserID"];
                    if (sessionUser == null)
                        return Json(new { success = false, message = "Session expired" }, JsonRequestBehavior.AllowGet);

                    if (!int.TryParse(sessionUser.ToString(), out int accId))
                        return Json(new { success = false, message = "Invalid session user" }, JsonRequestBehavior.AllowGet);

                    var patientByAcc = db.tbl_patient.FirstOrDefault(p => p.accID == accId);
                    if (patientByAcc == null)
                        return Json(new { success = false, message = "Patient record not found for current user" }, JsonRequestBehavior.AllowGet);

                    pid = patientByAcc.patientID;
                }

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
                // Resolve patientID: prefer SelectedPatientID (admin view), fallback to logged-in user's patient record
                object sessionVal = Session["SelectedPatientID"];
                int pid = 0;
                if (sessionVal != null && int.TryParse(sessionVal.ToString(), out int spid))
                {
                    pid = spid;
                }
                else
                {
                    var sessionUser = Session["UserID"];
                    if (sessionUser == null)
                        return Json(new { success = false, message = "Session expired" }, JsonRequestBehavior.AllowGet);

                    if (!int.TryParse(sessionUser.ToString(), out int accId))
                        return Json(new { success = false, message = "Invalid session user" }, JsonRequestBehavior.AllowGet);

                    var patientByAcc = db.tbl_patient.FirstOrDefault(p => p.accID == accId);
                    if (patientByAcc == null)
                        return Json(new { success = false, message = "Patient record not found for current user" }, JsonRequestBehavior.AllowGet);

                    pid = patientByAcc.patientID;
                }

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


        [HttpGet]
        public JsonResult getPatientTreatment()
        {
            using (var db = new RGDCContext())
            {
                try
                {
                    // Resolve current session user and role
                    var sessionVal = Session["UserID"];
                    var userRoleObj = Session["UserAuthorization"];
                    int? userID = null;
                    int role = -1;
                    if (sessionVal != null && int.TryParse(sessionVal.ToString(), out int uid)) userID = uid;
                    if (userRoleObj != null && int.TryParse(userRoleObj.ToString(), out int r)) role = r;

                    // Base query with joins (keep shape)
                    var baseQuery = from t in db.tbl_payment
                                    join p in db.tbl_patient on t.patientID equals p.patientID
                                    join pa in db.tbl_account on p.accID equals pa.accID
                                    join d in db.tbl_dentist on t.dentistID equals d.dentistID
                                    join da in db.tbl_account on d.accID equals da.accID
                                    select new
                                    {
                                        trtPlanID = t.paymentID,
                                        date = t.paymentDate,
                                        procedures = t.procedures,
                                        toothNumber = t.toothNumber,
                                        accID = pa.accID,
                                        patientName = pa.firstName + " " + pa.lastName,
                                        dentist = da.firstName + " " + da.middleName + " " + da.lastName,
                                        balance = t.balance,
                                        paid = t.paid,
                                        patientAccID = pa.accID,
                                        dentistAccID = da.accID,
                                        patientID = p.patientID
                                    };

                    // If current user is a patient, restrict to their records only
                    if (role == 3 && userID.HasValue)
                    {
                        baseQuery = baseQuery.Where(x => x.patientAccID == userID.Value);
                    }

                    // Owner and other roles keep full view; additional role-based filters can be added here

                    var result = baseQuery.ToList()
                        .Select(x => new
                        {
                            trtPlanID = x.trtPlanID,
                            date = x.date,
                            procedures = x.procedures,
                            toothNumber = x.toothNumber,
                            accID = x.accID,
                            patientName = x.patientName,
                            dentist = x.dentist,
                            balance = x.balance,
                            paid = x.paid
                        }).ToList();

                    return Json(result, JsonRequestBehavior.AllowGet);
                }
                catch (Exception ex)
                {
                    return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
                }
            }
        }


        public JsonResult GetAdminScheduledAppointments()
        {
            using (var db = new RGDCContext())
            {
                try
                {
                    var sessionVal = Session["UserID"];
                    var userAuthObj = Session["UserAuthorization"];
                    var userPermObj = Session["UserPermission"];
                    if (sessionVal == null || userAuthObj == null) return Json(new List<object>(), JsonRequestBehavior.AllowGet);

                    if (!int.TryParse(sessionVal.ToString(), out int userID)) return Json(new List<object>(), JsonRequestBehavior.AllowGet);
                    if (!int.TryParse(userAuthObj.ToString(), out int userAuth)) return Json(new List<object>(), JsonRequestBehavior.AllowGet);
                    int userPerm = -1;
                    if (userPermObj != null) int.TryParse(userPermObj.ToString(), out userPerm);

                    // Build base query: exclude Rescheduled here so rescheduled appointments do not appear in scheduled list
                    var baseQuery = from appt in db.tbl_appointment
                                    join pat in db.tbl_patient on appt.patientID equals pat.patientID into patj
                                    from pat in patj.DefaultIfEmpty()
                                    join patAcc in db.tbl_account on pat.accID equals patAcc.accID into patAccj
                                    from patAcc in patAccj.DefaultIfEmpty()
                                    join dent in db.tbl_dentist on appt.dentistID equals dent.dentistID into dentj
                                    from dent in dentj.DefaultIfEmpty()
                                    join dentAcc in db.tbl_account on (dent != null ? dent.accID : 0) equals dentAcc.accID into dentAccj
                                    from dentAcc in dentAccj.DefaultIfEmpty()
                                        // Note: DO NOT include "Rescheduled" here
                                    where appt.status == "Scheduled"
                                          || appt.status == "Checked-in"
                                          || appt.status == "Ongoing"
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
                                        procedureID = (int?)null,
                                        createdBy = appt.createdBy
                                    };

                    IEnumerable<dynamic> filtered;

                    if (userAuth == 0 || userAuth == 1)
                    {
                        filtered = baseQuery.OrderBy(x => x.dateTime).ToList();
                    }
                    else if (userAuth == 2)
                    {
                        if (userPerm == 1)
                        {
                            var dentist = db.tbl_dentist.FirstOrDefault(d => d.accID == userID);
                            if (dentist == null) return Json(new List<object>(), JsonRequestBehavior.AllowGet);
                            filtered = baseQuery.Where(x => x.dentistID == dentist.dentistID).OrderBy(x => x.dateTime).ToList();
                        }
                        else if (userPerm == 2)
                        {
                            var staff = db.tbl_staff.FirstOrDefault(s => s.accID == userID);
                            if (staff == null) return Json(new List<object>(), JsonRequestBehavior.AllowGet);
                            filtered = baseQuery.Where(x => x.dentBranchID.HasValue && x.dentBranchID.Value == staff.branchID)
                                                .OrderBy(x => x.dateTime).ToList();
                        }
                        else if (userPerm == 3)
                        {
                            var patient = db.tbl_patient.FirstOrDefault(p => p.accID == userID);
                            if (patient == null) return Json(new List<object>(), JsonRequestBehavior.AllowGet);
                            filtered = baseQuery.Where(x => x.patientID == patient.patientID).OrderBy(x => x.dateTime).ToList();
                        }
                        else
                        {
                            return Json(new List<object>(), JsonRequestBehavior.AllowGet);
                        }
                    }
                    else
                    {
                        return Json(new List<object>(), JsonRequestBehavior.AllowGet);
                    }

                    // Map projection and format friendly remarks for display (if remarks follow reschedule token format, replace tokens)
                    var result = filtered.Select(a =>
                    {
                        string friendlyRemarks = a.remarks;

                        try
                        {
                            if (!string.IsNullOrWhiteSpace(a.remarks))
                            {
                                // If remarks come from a reschedule token, build friendly text
                                if (a.remarks.StartsWith("RescheduleOf:", StringComparison.OrdinalIgnoreCase) ||
                                    a.remarks.Contains("Requester:") || a.remarks.Contains("Contact:"))
                                {
                                    string requester = null;
                                    string contact = null;
                                    var parts = a.remarks.Split(new[] { ';' }, StringSplitOptions.RemoveEmptyEntries);
                                    foreach (var p in parts)
                                    {
                                        var colon = p.IndexOf(':');
                                        if (colon < 0) continue;
                                        var key = p.Substring(0, colon).Trim();
                                        var val = p.Substring(colon + 1).Trim();
                                        if (string.Equals(key, "Requester", StringComparison.OrdinalIgnoreCase)) requester = val;
                                        if (string.Equals(key, "Contact", StringComparison.OrdinalIgnoreCase)) contact = val;
                                    }

                                    var sb = new System.Text.StringBuilder();
                                    if (!string.IsNullOrWhiteSpace(requester))
                                    {
                                        sb.Append("Requested by: ").Append(requester).Append(".\n");
                                    }
                                    if (!string.IsNullOrWhiteSpace(contact))
                                    {
                                        sb.Append("In case of further questions kindly contact this number: ").Append(contact).Append(".");
                                    }
                                    if (sb.Length > 0) friendlyRemarks = sb.ToString();
                                }
                            }
                        }
                        catch { /* ignore formatting errors */ }

                        return new
                        {
                            apptID = a.apptID,
                            dentistID = a.dentistID,
                            patientID = a.patientID,
                            dateTime = a.dateTime,
                            date = a.dateTime.ToString("MMMM d, yyyy"),
                            time = a.dateTime.ToString("h:mm tt"),
                            purpose = a.purpose,
                            dentistName = (a.dentistAccFirst != null && a.dentistAccLast != null) ? (a.dentistAccFirst + " " + a.dentistAccLast) : null,
                            patientName = (a.patientAccFirst != null && a.patientAccLast != null) ? (a.patientAccFirst + " " + a.patientAccLast) : null,
                            status = a.status,
                            displayStatus = a.status == "Scheduled" ? "Scheduled" : a.status,
                            remarks = CleanRemarksForUi(friendlyRemarks),
                            procedureID = a.procedureID
                        };
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
                                        dentistName = da.firstName + " " + da.lastName,
                                        dentistSpecialization = d.specialization,
                                        branchID = d.branchID,

                                        // Payment info
                                        paymentID = pay.paymentID,
                                        description = pay.description,
                                        paymentMethod = pay.paymentMethod,
                                        paymentDate = pay.paymentDate,
                                        reference = pay.reference,
                                        cost = pay.cost,
                                        discount = pay.discount,
                                        toothNumber = pay.toothNumber,
                                        procedures = pay.procedures,
                                        paid = pay.paid,
                                        balance = pay.balance
                                    };

      
                    
                    var resultList = baseQuery.OrderBy(x => x.paymentDate).ToList();
                    
                  
                    return Json(resultList, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult getOwnPayments()
        {
            try
            {
                var sessionVal = Session["SelectedPatientID"];
                if (!int.TryParse(sessionVal.ToString(), out int accID))
                    return Json(new { success = false, message = "Invalid user ID." });

                using (var db = new RGDCContext())
                {
                    // Build base query (entities kept so we can apply role filters)
                    var baseQuery = from pay in db.tbl_payment
                                    join p in db.tbl_patient on pay.patientID equals p.patientID
                                    join pa in db.tbl_account on p.accID equals pa.accID
                                    join d in db.tbl_dentist on pay.dentistID equals d.dentistID
                                    join da in db.tbl_account on d.accID equals da.accID
                                    where p.patientID == accID
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
                                        dentistName = da.firstName + " " + da.lastName,
                                        dentistSpecialization = d.specialization,
                                        branchID = d.branchID,

                                        // Payment info
                                        paymentID = pay.paymentID,
                                        description = pay.description,
                                        paymentMethod = pay.paymentMethod,
                                        paymentDate = pay.paymentDate,
                                        reference = pay.reference,
                                        cost = pay.cost,
                                        discount = pay.discount,
                                        toothNumber = pay.toothNumber,
                                        procedures = pay.procedures,
                                        paid = pay.paid,
                                        balance = pay.balance
                                    };



                    var resultList = baseQuery.OrderBy(x => x.paymentDate).ToList();


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

                // Accept apptID == 0; only reject negative values
                if (appointmentData.apptID < 0)
                    return Json(new { success = false, message = "Invalid appointment ID." });

                if (appointmentData.dateTime == null || appointmentData.dateTime == DateTime.MinValue)
                    return Json(new { success = false, message = "Invalid date/time provided." });

                if (string.IsNullOrWhiteSpace(appointmentData.reason))
                    return Json(new { success = false, message = "Reason/purpose is required." });

                // Resolve session user & role/permission
                var sessionVal = Session["UserID"];
                var userAuthObj = Session["UserAuthorization"];
                var userPermObj = Session["UserPermission"];

                if (sessionVal == null || userAuthObj == null)
                    return Json(new { success = false, message = "User session expired." });

                if (!int.TryParse(sessionVal.ToString(), out int userID))
                    return Json(new { success = false, message = "Invalid user session ID." });

                if (!int.TryParse(userAuthObj.ToString(), out int userAuth))
                    return Json(new { success = false, message = "Invalid user authorization." });

                int userPerm = -1;
                if (userPermObj != null) int.TryParse(userPermObj.ToString(), out userPerm);

                using (var db = new RGDCContext())
                {
                    var appt = db.tbl_appointment.FirstOrDefault(a => a.apptID == appointmentData.apptID);
                    if (appt == null)
                        return Json(new { success = false, message = "Appointment not found." });

                    // Update date/time and reason
                    appt.dateTime = appointmentData.dateTime;
                    appt.reason = appointmentData.reason;

                    // Decide whether to persist requested status change
                    bool persistStatus = false;
                    if (!string.IsNullOrWhiteSpace(appointmentData.status))
                    {
                        // Allow owners (0) and admin (1)
                        if (userAuth == 0 || userAuth == 1)
                        {
                            persistStatus = true;
                        }
                        else if (userAuth == 2)
                        {
                            // Clinic accounts: check permission (1=dentist,2=staff,3=patient)
                            if (userPerm == 1)
                            {
                                // Dentist: only allow if this dentist owns the appointment
                                var dentist = db.tbl_dentist.FirstOrDefault(d => d.accID == userID);
                                if (dentist != null && dentist.dentistID == appt.dentistID)
                                {
                                    persistStatus = true;
                                }
                            }
                            else if (userPerm == 2)
                            {
                                // Staff: allow
                                persistStatus = true;
                            }
                            // userPerm == 3 (patient) => persistStatus remains false
                        }
                    }

                    if (persistStatus)
                    {
                        appt.status = appointmentData.status.Trim();
                    }

                    // Decide whether to persist remarks (notes)
                    bool persistRemarks = false;
                    if (!string.IsNullOrWhiteSpace(appointmentData.remarks))
                    {
                        // Owners/admins can update remarks
                        if (userAuth == 0 || userAuth == 1)
                        {
                            persistRemarks = true;
                        }
                        else if (userAuth == 2)
                        {
                            if (userPerm == 1)
                            {
                                // Dentist may add/edit remarks only for their own appointments
                                var dentist = db.tbl_dentist.FirstOrDefault(d => d.accID == userID);
                                if (dentist != null && dentist.dentistID == appt.dentistID) persistRemarks = true;
                            }
                            else if (userPerm == 2)
                            {
                                // Staff may edit remarks
                                persistRemarks = true;
                            }
                            // patients (userPerm == 3) cannot edit remarks
                        }
                    }

                    if (persistRemarks)
                    {
                        appt.remarks = appointmentData.remarks.Trim();
                    }

                    appt.schedUpdatedAt = DateTime.Now;
                    db.SaveChanges();

                    return Json(new
                    {
                        success = true,
                        message = "Appointment updated successfully.",
                        apptID = appt.apptID,
                        status = appt.status,
                        remarks = appt.remarks
                    });
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

                if (request.patientID < 0 || request.dentistID < 0)
                    return Json(new { success = false, message = "Invalid patient or dentist ID." });

                if (request.dateTime == null || request.dateTime == DateTime.MinValue)
                    return Json(new { success = false, message = "Invalid appointment date/time provided." });

                if (string.IsNullOrWhiteSpace(request.reason))
                    return Json(new { success = false, message = "Purpose/reason is required." });

                var minAllowed = DateTime.Today.AddDays(2);
                var dateTime = request.dateTime;
                if (dateTime.Date < minAllowed.Date)
                    return Json(new { success = false, message = "Appointment date must be at least 2 days from today." });

                var sessionVal = Session["UserID"];
                if (sessionVal == null) return Json(new { success = false, message = "User session expired." });
                if (!int.TryParse(sessionVal.ToString(), out int createdByID))
                    return Json(new { success = false, message = "Invalid user ID." });

                using (var db = new RGDCContext())
                {
                    // find patient (by patientID or accID)
                    var patient = db.tbl_patient.FirstOrDefault(p => p.patientID == request.patientID)
                                  ?? db.tbl_patient.FirstOrDefault(p => p.accID == request.patientID);

                    if (patient == null)
                        return Json(new { success = false, message = "Patient not found in database." });

                    // find dentist
                    var dentist = db.tbl_dentist.FirstOrDefault(d => d.dentistID == request.dentistID)
                                 ?? db.tbl_dentist.FirstOrDefault(d => d.accID == request.dentistID);

                    if (dentist == null)
                        return Json(new { success = false, message = "Dentist not found in database." });

                    var requested = new DateTime(dateTime.Year, dateTime.Month, dateTime.Day, dateTime.Hour, dateTime.Minute, 0);
                    var requestedStart = requested;
                    var requestedEnd = requested.AddMinutes(1);
                    var blockingStatuses = new List<string> { "Scheduled", "Requested" };

                    bool conflict = db.tbl_appointment.Any(a =>
                        a.dentistID == dentist.dentistID
                        && blockingStatuses.Contains(a.status)
                        && a.dateTime >= requestedStart
                        && a.dateTime < requestedEnd);

                    if (conflict)
                    {
                        return Json(new { success = false, message = "Selected date/time is already booked for that dentist." });
                    }

                    var newAppointment = new tblAppointmentModel()
                    {
                        patientID = patient.patientID,
                        dentistID = dentist.dentistID,
                        createdBy = createdByID,
                        dateTime = requested,
                        reason = request.reason,
                        status = "Requested",
                        schedCreatedAt = DateTime.Now,
                        schedUpdatedAt = DateTime.Now
                    };

                    // If this request is a reschedule request, persist metadata in remarks so Accept logic can act on it
                    if (request.originalApptID.HasValue)
                    {
                        var sb = new StringBuilder();
                        sb.Append("RescheduleOf:").Append(request.originalApptID.Value);
                        if (!string.IsNullOrWhiteSpace(request.requesterName))
                        {
                            sb.Append(";Requester:").Append(request.requesterName.Trim());
                        }
                        if (!string.IsNullOrWhiteSpace(request.contactNumber))
                        {
                            sb.Append(";Contact:").Append(request.contactNumber.Trim());
                        }
                        // keep optional notes as extra token so server can still show friendly notes when accepted
                        if (!string.IsNullOrWhiteSpace(request.notes))
                        {
                            sb.Append(";Notes:").Append(request.notes.Trim().Replace(";", " "));
                        }
                        newAppointment.remarks = sb.ToString();
                    }
                    else
                    {
                        // Not a reschedule: ensure remarks is not null (DB requires not-null)
                        // Build friendly remarks if provided; otherwise set empty string.
                        var sb2 = new StringBuilder();
                        if (!string.IsNullOrWhiteSpace(request.requesterName))
                        {
                            sb2.Append("Requested by: ").Append(request.requesterName.Trim()).Append(". ");
                        }
                        if (!string.IsNullOrWhiteSpace(request.contactNumber))
                        {
                            sb2.Append("In case of further questions kindly contact this number: ").Append(request.contactNumber.Trim()).Append(".");
                        }
                        if (!string.IsNullOrWhiteSpace(request.notes))
                        {
                            if (sb2.Length > 0) sb2.Append(" ");
                            sb2.Append(request.notes.Trim());
                        }
                        newAppointment.remarks = sb2.Length > 0 ? sb2.ToString() : string.Empty;
                    }

                    db.tbl_appointment.Add(newAppointment);

                    try { db.SaveChanges(); }
                    catch (Exception exSave) { return Json(new { success = false, message = "Database error: " + exSave.GetBaseException().Message }); }

                    return Json(new { success = true, message = "Appointment request created successfully.", apptID = newAppointment.apptID });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Server error: " + ex.GetBaseException().Message });
            }
        }


        [HttpGet]
        public JsonResult GetRequestedAppointments()
        {
            try
            {
                var sessionVal = Session["UserID"];
                var userRoleObj = Session["UserAuthorization"];
                var userPermObj = Session["UserPermission"];

                if (sessionVal == null || string.IsNullOrWhiteSpace(sessionVal.ToString()) ||
                    userRoleObj == null || string.IsNullOrWhiteSpace(userRoleObj.ToString()))
                {
                    return Json(new { success = false, message = "User session expired or invalid." }, JsonRequestBehavior.AllowGet);
                }

                if (!int.TryParse(sessionVal.ToString(), out int userID))
                    return Json(new { success = false, message = "Invalid user ID." }, JsonRequestBehavior.AllowGet);

                if (!int.TryParse(userRoleObj.ToString(), out int role))
                    return Json(new { success = false, message = "Invalid user role." }, JsonRequestBehavior.AllowGet);

                int permission = -1;
                if (userPermObj != null) int.TryParse(userPermObj.ToString(), out permission);

                using (var db = new RGDCContext())
                {
                    var isDentist = (role == 1) || (role == 2 && permission == 1);
                    var isPatient = (role == 3) || (role == 2 && permission == 3);

                    if (isDentist)
                    {
                        var dentist = db.tbl_dentist.FirstOrDefault(d => d.accID == userID);
                        if (dentist == null) return Json(new List<object>(), JsonRequestBehavior.AllowGet);

                        var raw = (
                            from appt in db.tbl_appointment
                            join pat in db.tbl_patient on appt.patientID equals pat.patientID
                            join patAcc in db.tbl_account on pat.accID equals patAcc.accID
                            where appt.status == "Requested"
                               && (appt.dentistID == dentist.dentistID || appt.createdBy == userID)
                            orderby appt.dateTime
                            select new
                            {
                                appt.apptID,
                                appt.dateTime,
                                date = appt.dateTime,
                                time = appt.dateTime,
                                purpose = appt.reason,
                                patientID = appt.patientID,
                                dentistID = appt.dentistID,
                                patientName = patAcc.firstName + " " + patAcc.lastName,
                                dentistName = "",
                                status = appt.status,
                                createdBy = appt.createdBy,
                                remarks = appt.remarks
                            }
                        ).ToList();

                        var result = raw.Select(a =>
                        {
                            string requester = null;
                            string contact = null;
                            bool isReschedule = false;

                            if (!string.IsNullOrWhiteSpace(a.remarks) && a.remarks.StartsWith("RescheduleOf:", StringComparison.OrdinalIgnoreCase))
                            {
                                isReschedule = true;
                                var parts = a.remarks.Split(new[] { ';' }, StringSplitOptions.RemoveEmptyEntries);
                                foreach (var p in parts)
                                {
                                    var colon = p.IndexOf(':');
                                    if (colon < 0) continue;
                                    var key = p.Substring(0, colon).Trim();
                                    var val = p.Substring(colon + 1).Trim();
                                    if (string.Equals(key, "Requester", StringComparison.OrdinalIgnoreCase)) requester = val;
                                    if (string.Equals(key, "Contact", StringComparison.OrdinalIgnoreCase)) contact = val;
                                }
                            }

                            var notesSb = new System.Text.StringBuilder();
                            if (!string.IsNullOrWhiteSpace(requester))
                            {
                                notesSb.Append("Requested by: ").Append(requester).Append(".\n");
                            }
                            if (!string.IsNullOrWhiteSpace(contact))
                            {
                                notesSb.Append("In case of further questions kindly contact this number: ").Append(contact).Append(".");
                            }

                            var computedNotes = notesSb.Length > 0 ? notesSb.ToString() : a.remarks;
                            return new
                            {
                                apptID = a.apptID,
                                dateTime = a.dateTime,
                                date = a.date,
                                time = a.time,
                                purpose = a.purpose,
                                patientID = a.patientID,
                                dentistID = a.dentistID,
                                patientName = a.patientName,
                                dentistName = a.dentistName,
                                contactNumber = contact,
                                requesterName = requester,
                                notes = CleanRemarksForUi(computedNotes),
                                status = isReschedule ? "Rescheduled" : a.status,
                                displayStatus = isReschedule ? "Rescheduled" : (a.status == "Requested" ? "Requested" : a.status),
                                createdBy = a.createdBy,
                                remarks = CleanRemarksForUi(a.remarks)
                            };
                        }).ToList();

                        return Json(result, JsonRequestBehavior.AllowGet);
                    }
                    else if (isPatient)
                    {
                        var patient = db.tbl_patient.FirstOrDefault(p => p.accID == userID);
                        if (patient == null) return Json(new List<object>(), JsonRequestBehavior.AllowGet);

                        var raw = (
                            from appt in db.tbl_appointment
                            join dent in db.tbl_dentist on appt.dentistID equals dent.dentistID
                            join dentAcc in db.tbl_account on dent.accID equals dentAcc.accID
                            where appt.status == "Requested"
                               && (appt.patientID == patient.patientID || appt.createdBy == userID)
                            orderby appt.dateTime
                            select new
                            {
                                appt.apptID,
                                appt.dateTime,
                                date = appt.dateTime,
                                time = appt.dateTime,
                                purpose = appt.reason,
                                patientID = appt.patientID,
                                dentistID = appt.dentistID,
                                patientName = "",
                                dentistName = dentAcc.firstName + " " + dentAcc.lastName,
                                status = appt.status,
                                createdBy = appt.createdBy,
                                remarks = appt.remarks
                            }
                        ).ToList();

                        var result = raw.Select(a =>
                        {
                            string requester = null;
                            string contact = null;
                            bool isReschedule = false;

                            if (!string.IsNullOrWhiteSpace(a.remarks) && a.remarks.StartsWith("RescheduleOf:", StringComparison.OrdinalIgnoreCase))
                            {
                                isReschedule = true;
                                var parts = a.remarks.Split(new[] { ';' }, StringSplitOptions.RemoveEmptyEntries);
                                foreach (var p in parts)
                                {
                                    var colon = p.IndexOf(':');
                                    if (colon < 0) continue;
                                    var key = p.Substring(0, colon).Trim();
                                    var val = p.Substring(colon + 1).Trim();
                                    if (string.Equals(key, "Requester", StringComparison.OrdinalIgnoreCase)) requester = val;
                                    if (string.Equals(key, "Contact", StringComparison.OrdinalIgnoreCase)) contact = val;
                                }
                            }

                            var notesSb = new System.Text.StringBuilder();
                            if (!string.IsNullOrWhiteSpace(requester))
                            {
                                notesSb.Append("Requested by: ").Append(requester).Append(".\n");
                            }
                            if (!string.IsNullOrWhiteSpace(contact))
                            {
                                notesSb.Append("In case of further questions kindly contact this number: ").Append(contact).Append(".");
                            }

                            return new
                            {
                                apptID = a.apptID,
                                dateTime = a.dateTime,
                                date = a.date,
                                time = a.time,
                                purpose = a.purpose,
                                patientID = a.patientID,
                                dentistID = a.dentistID,
                                patientName = a.patientName,
                                dentistName = a.dentistName,
                                contactNumber = contact,
                                requesterName = requester,
                                notes = notesSb.Length > 0 ? notesSb.ToString() : a.remarks,
                                status = isReschedule ? "Rescheduled" : a.status,
                                displayStatus = isReschedule ? "Rescheduled" : (a.status == "Requested" ? "Requested" : a.status),
                                createdBy = a.createdBy,
                                remarks = a.remarks
                            };
                        }).ToList();

                        return Json(result, JsonRequestBehavior.AllowGet);
                    }

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
                        toothNumber = pay.toothNumber,
                        procedures = pay.procedures,
                        discount = pay.discount,
                        balance = pay.balance,
                        paid = pay.paid,
                        reference = pay.reference,
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
                if (apptID < 0)
                    return Json(new { success = false, message = "Invalid appointment ID." });

                using (var db = new RGDCContext())
                {
                    var appt = db.tbl_appointment.FirstOrDefault(a => a.apptID == apptID);
                    if (appt == null)
                        return Json(new { success = false, message = "Appointment not found." });

                    var sessionUserObj = Session["UserID"];
                    var sessionAuthObj = Session["UserAuthorization"];
                    if (sessionUserObj == null || sessionAuthObj == null)
                        return Json(new { success = false, message = "User session expired." });

                    if (!int.TryParse(sessionUserObj.ToString(), out int accId))
                        return Json(new { success = false, message = "Invalid session user." });

                    int userAuth = -1;
                    int.TryParse(sessionAuthObj.ToString(), out userAuth);

                    // If creator (sender), deny
                    if (appt.createdBy == accId)
                    {
                        return Json(new { success = false, message = "Sender cannot accept/deny their own appointment request." });
                    }

                    // Owner/admin can act
                    if (userAuth == 0 || userAuth == 1)
                    {
                        // allowed
                    }
                    else
                    {
                        // Allow recipient: either the dentist's account OR the patient's account matches current user
                        bool isRecipient = false;

                        // check dentist
                        var apptDentist = db.tbl_dentist.FirstOrDefault(d => d.dentistID == appt.dentistID);
                        if (apptDentist != null && apptDentist.accID == accId) isRecipient = true;

                        // check patient (patient.accID)
                        var apptPatient = db.tbl_patient.FirstOrDefault(p => p.patientID == appt.patientID);
                        if (apptPatient != null && apptPatient.accID == accId) isRecipient = true;

                        if (!isRecipient)
                        {
                            return Json(new { success = false, message = "Not authorized to accept/deny this appointment." });
                        }
                    }
                    if (appt.status != "Requested")
                        return Json(new { success = false, message = "Appointment is not in requested status." });

                    // mark the requested appointment as Scheduled
                    appt.status = "Scheduled";
                    appt.schedUpdatedAt = DateTime.Now;
                    db.SaveChanges();

                    // Handle reschedule metadata (if present)
                    try
                    {
                        if (!string.IsNullOrWhiteSpace(appt.remarks) && appt.remarks.StartsWith("RescheduleOf:", StringComparison.OrdinalIgnoreCase))
                        {
                            string requester = null;
                            string contact = null;
                            int origId = -1;

                            var parts = appt.remarks.Split(new[] { ';' }, StringSplitOptions.RemoveEmptyEntries);
                            foreach (var p in parts)
                            {
                                var colon = p.IndexOf(':');
                                if (colon < 0) continue;
                                var key = p.Substring(0, colon).Trim();
                                var val = p.Substring(colon + 1).Trim();
                                if (string.Equals(key, "RescheduleOf", StringComparison.OrdinalIgnoreCase))
                                {
                                    int.TryParse(val, out origId);
                                }
                                else if (string.Equals(key, "Requester", StringComparison.OrdinalIgnoreCase))
                                {
                                    requester = val;
                                }
                                else if (string.Equals(key, "Contact", StringComparison.OrdinalIgnoreCase))
                                {
                                    contact = val;
                                }
                            }

                            if (origId > 0)
                            {
                                var origAppt = db.tbl_appointment.FirstOrDefault(a => a.apptID == origId);
                                if (origAppt != null)
                                {
                                    // mark original as Rescheduled so it will appear in Past
                                    origAppt.status = "Rescheduled";

                                    // build friendly remarks for the original appointment: requester + rescheduled date
                                    var origSb = new System.Text.StringBuilder();
                                    if (!string.IsNullOrWhiteSpace(requester))
                                    {
                                        origSb.Append("Requested by: ").Append(requester).Append(".\n");
                                    }
                                    origSb.Append("Rescheduled on: ").Append(DateTime.Now.ToString("MMMM d, yyyy h:mm tt"));

                                    origAppt.remarks = origSb.ToString();
                                    origAppt.schedUpdatedAt = DateTime.Now;
                                    db.SaveChanges();
                                }
                            }

                            // For the newly accepted appointment, replace raw tokens with friendly notes
                            try
                            {
                                var sb = new System.Text.StringBuilder();
                                if (!string.IsNullOrWhiteSpace(requester))
                                {
                                    sb.Append("Requested by: ").Append(requester).Append(".\n");
                                }
                                if (!string.IsNullOrWhiteSpace(contact))
                                {
                                    sb.Append("In case of further questions kindly contact this number: ").Append(contact).Append(".");
                                }
                                if (sb.Length > 0)
                                {
                                    appt.remarks = sb.ToString();
                                    appt.schedUpdatedAt = DateTime.Now;
                                    db.SaveChanges();
                                }
                            }
                            catch { /* swallow formatting errors */ }
                        }
                    }
                    catch { /* swallow */ }

                    // Preserve your existing Google Calendar logic if any (keep below if present in original method)
                    try
                    {
                        var dentist = db.tbl_dentist.FirstOrDefault(d => d.dentistID == appt.dentistID);
                        if (dentist != null)
                        {
                            var dentistAcc = db.tbl_account.FirstOrDefault(a => a.accID == dentist.accID);
                            if (dentistAcc != null && dentistAcc.googleCalendarEnabled && !string.IsNullOrEmpty(dentistAcc.googleRefreshToken))
                            {
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
                    catch { /* swallow */ }

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

                    // Detect dentist by accId
                    var dentist = db2.tbl_dentist.FirstOrDefault(d => d.accID == accId);
                    if (dentist != null)
                    {
                        apptIds.AddRange(db2.tbl_appointment
                            .Where(a => a.dentistID == dentist.dentistID && a.status == "Scheduled")
                            .Select(a => a.apptID)
                            .ToList());
                    }

                    // Detect patient by accId
                    var patient = db2.tbl_patient.FirstOrDefault(p => p.accID == accId);
                    if (patient != null)
                    {
                        apptIds.AddRange(db2.tbl_appointment
                            .Where(a => a.patientID == patient.patientID && a.status == "Scheduled")
                            .Select(a => a.apptID)
                            .ToList());
                    }

                    apptIds = apptIds.Distinct().ToList();

                    foreach (var apptId in apptIds)
                    {
                        try
                        {
                            await CreateGoogleEventForAccountAsync(null, apptId, accId, refreshToken);
                        }
                        catch (Exception ex)
                        {
                            System.Diagnostics.Trace.WriteLine($"SyncExistingAppointmentsForAccountAsync: failed apptId={apptId} error={ex.Message}");
                        }

                        await Task.Delay(150); // small pause between calls
                    }
                }
            }
            catch (Exception ex)
            {
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

                                    // get dentist record (if any) for this acc
                                    var dentist = db2.tbl_dentist.FirstOrDefault(d => d.accID == savedAccId);
                                    if (dentist != null)
                                    {
                                        apptIds.AddRange(db2.tbl_appointment
                                            .Where(a => a.dentistID == dentist.dentistID && a.status == "Scheduled")
                                            .Select(a => a.apptID)
                                            .ToList());
                                    }

                                    // get patient record (if any)
                                    var patient = db2.tbl_patient.FirstOrDefault(p => p.accID == savedAccId);
                                    if (patient != null)
                                    {
                                        apptIds.AddRange(db2.tbl_appointment
                                            .Where(a => a.patientID == patient.patientID && a.status == "Scheduled")
                                            .Select(a => a.apptID)
                                            .ToList());
                                    }

                                    apptIds = apptIds.Distinct().ToList();

                                    foreach (var apptId in apptIds)
                                    {
                                        try
                                        {
                                            // Create or update event for each scheduled appointment.
                                            await CreateGoogleEventForAccountAsync(null, apptId, savedAccId, refresh);
                                        }
                                        catch (Exception ex)
                                        {
                                            System.Diagnostics.Trace.WriteLine($"CreateGoogleEvent for apptId={apptId} failed: {ex.Message}");
                                        }

                                        // small delay to avoid hitting API quotas when many appts exist
                                        await Task.Delay(150);
                                    }
                                }
                            }
                            catch (Exception ex)
                            {
                                System.Diagnostics.Trace.WriteLine("Background Google sync failed: " + ex.ToString());
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

                int accID = int.Parse(sessionVal.ToString());

                // Quick server-side checks before delegating to the helper
                using (var db = new RGDCContext())
                {
                    var acc = db.tbl_account.FirstOrDefault(a => a.accID == accID);
                    if (acc == null || !acc.googleCalendarEnabled || string.IsNullOrEmpty(acc.googleRefreshToken))
                        return Json(new { success = false, message = "Google not connected" });

                    var appt = db.tbl_appointment.FirstOrDefault(a => a.apptID == apptID);
                    if (appt == null) return Json(new { success = false, message = "Appointment not found" });
                }

                // Delegate create-or-update to the central helper (handles refresh, update-or-insert, persistence)
                // Use the saved refresh token from DB
                string refreshToken;
                using (var db = new RGDCContext())
                {
                    refreshToken = db.tbl_account.Where(a => a.accID == accID).Select(a => a.googleRefreshToken).FirstOrDefault();
                }

                if (string.IsNullOrEmpty(refreshToken))
                    return Json(new { success = false, message = "Google refresh token missing" });

                await CreateGoogleEventForAccountAsync(null, apptID, accID, refreshToken);

                // Read persisted googleEventId (if any) and return it
                string persistedEventId = null;
                using (var db = new RGDCContext())
                {
                    var apptAfter = db.tbl_appointment.FirstOrDefault(a => a.apptID == apptID);
                    if (apptAfter != null && !string.IsNullOrWhiteSpace(apptAfter.remarks))
                    {
                        var m = System.Text.RegularExpressions.Regex.Match(apptAfter.remarks, @"googleEventId:([^\|\;\s]+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                        if (m.Success) persistedEventId = m.Groups[1].Value;
                    }
                }

                return Json(new { success = true, eventId = persistedEventId });
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
            // Creates or updates a Google Calendar event for the appointment.
            // Ensures a single googleEventId token is stored in remarks and replaces any previous token.
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

                // Build event payload
                var ev = new Google.Apis.Calendar.v3.Data.Event
                {
                    Summary = appt.reason ?? "RGDC Appointment",
                    Description = $"Dentist ID: {appt.dentistID}",
                    Start = new Google.Apis.Calendar.v3.Data.EventDateTime { DateTime = appt.dateTime, TimeZone = "UTC" },
                    End = new Google.Apis.Calendar.v3.Data.EventDateTime { DateTime = appt.dateTime.AddMinutes(30), TimeZone = "UTC" }
                };

                // Try to extract existing googleEventId from remarks
                string existingEventId = null;
                try
                {
                    if (!string.IsNullOrWhiteSpace(appt.remarks))
                    {
                        var m = System.Text.RegularExpressions.Regex.Match(appt.remarks, @"googleEventId:([^\|\;\s]+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                        if (m.Success) existingEventId = m.Groups[1].Value;
                    }
                }
                catch
                {
                    existingEventId = null;
                }

                string finalEventId = null;

                // If there is an existing id try to GET it (to verify) and UPDATE it if found.
                if (!string.IsNullOrEmpty(existingEventId))
                {
                    try
                    {
                        // verify event exists
                        var existing = await service.Events.Get("primary", existingEventId).ExecuteAsync();
                        if (existing != null)
                        {
                            // update event fields and push update
                            existing.Summary = ev.Summary;
                            existing.Description = ev.Description;
                            existing.Start = ev.Start;
                            existing.End = ev.End;

                            var updated = await service.Events.Update(existing, "primary", existing.Id).ExecuteAsync();
                            finalEventId = updated?.Id ?? existingEventId;
                        }
                    }
                    catch (Google.GoogleApiException gae) when (gae.HttpStatusCode == System.Net.HttpStatusCode.NotFound)
                    {
                        // event no longer exists: fallthrough to create new event below
                        finalEventId = null;
                    }
                    catch
                    {
                        // any other error — attempt to create new event instead of failing sync
                        finalEventId = null;
                    }
                }

                // If no finalEventId obtained, create a new event
                if (string.IsNullOrEmpty(finalEventId))
                {
                    try
                    {
                        var created = await service.Events.Insert(ev, "primary").ExecuteAsync();
                        finalEventId = created?.Id;
                    }
                    catch
                    {
                        // swallow per-appointment failures (sync should continue)
                        return;
                    }
                }

                // Persist finalEventId in remarks (single token). Remove any previous googleEventId tokens first.
                if (!string.IsNullOrEmpty(finalEventId))
                {
                    try
                    {
                        using (var updateDb = new RGDCContext())
                        {
                            var a = updateDb.tbl_appointment.FirstOrDefault(x => x.apptID == apptID);
                            if (a != null)
                            {
                                var old = a.remarks ?? string.Empty;
                                // remove any existing googleEventId tokens
                                var cleaned = System.Text.RegularExpressions.Regex.Replace(old, @"\|?googleEventId:[^;\|\s]+", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                                // normalize separators and trim
                                cleaned = cleaned.Replace("||", "|").Trim().Trim(';', '|', ' ', '\r', '\n');

                                // append single token
                                var appended = string.IsNullOrEmpty(cleaned) ? $"|googleEventId:{finalEventId}" : (cleaned + $"|googleEventId:{finalEventId}");
                                a.remarks = appended;
                                a.schedUpdatedAt = DateTime.Now;
                                updateDb.SaveChanges();
                            }
                        }
                    }
                    catch
                    {
                        // swallow persistence errors
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
                    payment.toothNumber= model.toothNumber;
                    payment.procedures = model.procedures;
                    payment.reference = model.reference;
                    payment.paid = model.paid;
                    payment.balance = model.balance;
                    payment.description = model.description;
                    payment.payUpdatedAt = DateTime.Now;

                    db.SaveChanges();
                }

                return Json(new { success = true }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult DenyAppointment(int apptID, string reason = null)
        {
            try
            {
                // Accept apptID == 0; only reject negative values
                if (apptID < 0)
                    return Json(new { success = false, message = "Invalid appointment ID." });

                using (var db = new RGDCContext())
                {
                    var appt = db.tbl_appointment.FirstOrDefault(a => a.apptID == apptID);
                    if (appt == null)
                        return Json(new { success = false, message = "Appointment not found." });

                    if (appt.status != "Requested")
                        return Json(new { success = false, message = "Appointment is not in requested status." });

                    // Session / authorization parsing
                    var sessionUserObj = Session["UserID"];
                    var sessionAuthObj = Session["UserAuthorization"];
                    if (sessionUserObj == null || sessionAuthObj == null)
                        return Json(new { success = false, message = "User session expired." });

                    if (!int.TryParse(sessionUserObj.ToString(), out int accId))
                        return Json(new { success = false, message = "Invalid session user." });

                    int userAuth = -1;
                    int.TryParse(sessionAuthObj.ToString(), out userAuth);

                    // Disallow sender from denying their own request
                    if (appt.createdBy == accId)
                    {
                        return Json(new { success = false, message = "Sender cannot accept/deny their own appointment request." });
                    }

                    // Owner/admin allowed; otherwise recipient (dentist or patient) only
                    if (userAuth != 0 && userAuth != 1)
                    {
                        bool isRecipient = false;
                        var apptDentist = db.tbl_dentist.FirstOrDefault(d => d.dentistID == appt.dentistID);
                        if (apptDentist != null && apptDentist.accID == accId) isRecipient = true;

                        var apptPatient = db.tbl_patient.FirstOrDefault(p => p.patientID == appt.patientID);
                        if (apptPatient != null && apptPatient.accID == accId) isRecipient = true;

                        if (!isRecipient)
                        {
                            return Json(new { success = false, message = "Not authorized to accept/deny this appointment." });
                        }
                    }

                    // mark as Denied and set updated timestamp
                    appt.status = "Denied";
                    appt.schedUpdatedAt = DateTime.Now;

                    // Build and append denial remarks (preserve existing remarks)
                    try
                    {
                        string deniedByName = null;
                        var acc = db.tbl_account.FirstOrDefault(a => a.accID == accId);
                        if (acc != null) deniedByName = (acc.firstName + " " + acc.lastName).Trim();

                        var sb = new System.Text.StringBuilder();
                        if (!string.IsNullOrWhiteSpace(appt.remarks))
                        {
                            sb.Append(appt.remarks.Trim());
                            if (!appt.remarks.Trim().EndsWith(".")) sb.Append(". ");
                            else sb.Append(" ");
                        }
                        sb.Append("Denied by: ").Append(deniedByName ?? "Clinic").Append(".");
                        if (!string.IsNullOrWhiteSpace(reason))
                        {
                            sb.Append(" Reason: ").Append(reason.Trim());
                        }
                        appt.remarks = sb.ToString();
                    }
                    catch { /* swallow formatting errors */ }

                    db.SaveChanges();

                    // Notify the sender (creator) by email (best-effort)
                    try
                    {
                        if (appt.createdBy > 0)
                        {
                            var senderAcc = db.tbl_account.FirstOrDefault(a => a.accID == appt.createdBy);
                            if (senderAcc != null && !string.IsNullOrWhiteSpace(senderAcc.email))
                            {
                                var mail = new MailMessage();
                                mail.To.Add(senderAcc.email);
                                mail.Subject = "[RGDC Clinic] Your appointment request was denied";
                                var bodySb = new StringBuilder();
                                bodySb.AppendLine("Hello " + (senderAcc.firstName + " " + senderAcc.lastName).Trim() + ",");
                                bodySb.AppendLine();
                                bodySb.AppendLine("Your appointment request scheduled on " + appt.dateTime.ToString("MMMM d, yyyy h:mm tt") + " has been denied.");
                                if (!string.IsNullOrWhiteSpace(reason))
                                {
                                    bodySb.AppendLine();
                                    bodySb.AppendLine("Reason provided by recipient:");
                                    bodySb.AppendLine(reason);
                                }
                                bodySb.AppendLine();
                                bodySb.AppendLine("If you need to reschedule or have questions, please contact the clinic.");
                                bodySb.AppendLine();
                                bodySb.AppendLine("Regards,");
                                bodySb.AppendLine("RGDC Dental Clinic");

                                mail.Body = bodySb.ToString();
                                mail.From = new MailAddress("reyesguansingdc.noreply@gmail.com");

                                using (var smtp = new SmtpClient("smtp.gmail.com", 587))
                                {
                                    smtp.Credentials = new NetworkCredential("reyesguansingdc.noreply@gmail.com", "nniircdehqoxkkqa");
                                    smtp.EnableSsl = true;
                                    smtp.Send(mail);
                                }
                            }
                        }
                    }
                    catch
                    {
                        // best-effort notify — swallow exceptions so the primary action still succeeds
                    }

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

                if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                    return Json(new { success = false, message = "Invalid file type. Image required." });

                string uploadPath = Server.MapPath("~/Content/Uploads/");
                if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

                string fileName = Guid.NewGuid().ToString("N") + Path.GetExtension(file.FileName);
                string filePath = Path.Combine(uploadPath, fileName);
                file.SaveAs(filePath);

                string relativePath = "/Content/Uploads/" + fileName;

                // optionally the client may include accID in formData
                int accID = 0;
                if (!string.IsNullOrEmpty(Request.Form["accID"]))
                {
                    int.TryParse(Request.Form["accID"], out accID);
                }

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

                    if (accID > 0)
                    {
                        var acc = db.tbl_account.FirstOrDefault(a => a.accID == accID);
                        if (acc != null)
                        {
                            acc.photoLink = relativePath;
                            acc.accUpdatedAt = DateTime.Now;
                        }
                    }

                    db.SaveChanges();

                    return Json(new
                    {
                        success = true,
                        message = "Photo uploaded successfully.",
                        filePath = relativePath,
                        imageID = imgData.imageID
                    });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error uploading photo: {ex.Message}" });
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
                              where a.isArchived == 0
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
                                where a.isArchived == 0
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
                             where a.isArchived == 0
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
                    line1 = accmod.line1,
                    line2 = accmod.line2,
                    city = accmod.city,
                    state = accmod.state,
                    postal = accmod.postal,
                    country = accmod.country,
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
        public JsonResult addOwner(tblAddAccountModel ownerEmail)
        {
            var otp = new Random().Next(100000, 999999).ToString();

            using (var db = new RGDCContext())
            {
                var existingAccount = db.tbl_addAccount.FirstOrDefault(a => a.email == ownerEmail.email);

                if (existingAccount != null)
                {
                    return Json(new
                    {
                        success = false,
                        message = "Email is already processing. Please use a different email.",
                    }, JsonRequestBehavior.AllowGet);
                }
                var ownerAdd = new tblAddAccountModel
                {
                    email = ownerEmail.email,
                    permission = 0,
                    code = otp,
                    addCreatedAt = DateTime.Now,
                    addUpdatedAt = DateTime.Now,
                };
                db.tbl_addAccount.Add(ownerAdd);
                db.SaveChanges();
                // SEND EMAIL
                MailMessage mail = new MailMessage();
                mail.To.Add(ownerEmail.email);
                mail.Subject = "[RGDC Clinic] Your Code (OTP) for Account Signup!";
                mail.Body = $"Hello,\r\n\r\nYou may now signup as an Owner for RGDC Clinic. Use the code below to access the signup.\r\n{otp}\r\n\r\n\r\n\r\nThank you,\r\nRGDC Dental Clinic Team";
                mail.From = new MailAddress("reyesguansingdc.noreply@gmail.com");

                SmtpClient smtp = new SmtpClient("smtp.gmail.com", 587);
                smtp.Credentials = new NetworkCredential("reyesguansingdc.noreply@gmail.com", "nniircdehqoxkkqa");
                smtp.EnableSsl = true;
                smtp.Send(mail);
                return Json(new
                {
                    success = true,
                    message = "Owner registration initiated successfully.",
                }, JsonRequestBehavior.AllowGet);
            }

        }

            [HttpPost]
        public JsonResult signUpOwner(tblOwnerModel ownermod)
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
        public JsonResult addDentist(tblAddAccountModel dentistEmail)
        {
            var otp = new Random().Next(100000, 999999).ToString();

            using (var db = new RGDCContext())
            {
                var existingAccount = db.tbl_addAccount.FirstOrDefault(a => a.email == dentistEmail.email);

                if (existingAccount != null)
                {
                    return Json(new
                    {
                        success = false,
                        message = "Email is already processing. Please use a different email.",
                    }, JsonRequestBehavior.AllowGet);
                }

                var dentistAdd = new tblAddAccountModel
                {
                    email = dentistEmail.email,
                    permission = 1,
                    code = otp,
                    addCreatedAt = DateTime.Now,
                    addUpdatedAt = DateTime.Now,
                };
                db.tbl_addAccount.Add(dentistAdd);
                db.SaveChanges();
                // SEND EMAIL
                MailMessage mail = new MailMessage();
                mail.To.Add(dentistEmail.email);
                mail.Subject = "[RGDC Clinic] Your Code (OTP) for Account Signup!";
                mail.Body = $"Hello,\r\n\r\nYou may now signup as a Dentist for RGDC Clinic. Use the code below to access the signup.\r\n{otp}\r\n\r\n\r\n\r\nThank you,\r\nRGDC Dental Clinic Team";
                mail.From = new MailAddress("reyesguansingdc.noreply@gmail.com");

                SmtpClient smtp = new SmtpClient("smtp.gmail.com", 587);
                smtp.Credentials = new NetworkCredential("reyesguansingdc.noreply@gmail.com", "nniircdehqoxkkqa");
                smtp.EnableSsl = true;
                smtp.Send(mail);
                return Json(new
                {
                    success = true,
                    message = "Dentist registration initiated successfully.",
                }, JsonRequestBehavior.AllowGet);
            }

        }

        [HttpPost]
        public JsonResult signUpDentist(tblDentistModel dentistmod)
        {
            using (var db = new RGDCContext())
            {
                var newDentist = new tblDentistModel
                {
                    accID = dentistmod.accID,
                    specialization = dentistmod.specialization,
                    branchID = dentistmod.branchID,
                    //signature = dentistmod.signature
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

        public JsonResult removeFromQueue(string email)
        {
            using (var db = new RGDCContext())
            {
                var emailQueue = db.tbl_addAccount.FirstOrDefault(x => x.email == email);

                if (emailQueue != null)
                {
                    db.tbl_addAccount.Remove(emailQueue);
                    db.SaveChanges();
                }

                return Json(new { success = true }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult addStaff(tblAddAccountModel staffEmail)
        {
            var otp = new Random().Next(100000, 999999).ToString();

            using (var db = new RGDCContext())
            {
                var existingAccount = db.tbl_addAccount.FirstOrDefault(a => a.email == staffEmail.email);

                if (existingAccount != null)
                {
                    return Json(new
                    {
                        success = false,
                        message = "Email is already processing. Please use a different email.",
                    }, JsonRequestBehavior.AllowGet);
                }

                var ownerAdd = new tblAddAccountModel
                {
                    email = staffEmail.email,
                    permission = 2,
                    code = otp,
                    addCreatedAt = DateTime.Now,
                    addUpdatedAt = DateTime.Now,
                };
                db.tbl_addAccount.Add(ownerAdd);
                db.SaveChanges();
                // SEND EMAIL
                MailMessage mail = new MailMessage();
                mail.To.Add(staffEmail.email);
                mail.Subject = "[RGDC Clinic] Your Code (OTP) for Account Signup!";
                mail.Body = $"Hello,\r\n\r\nYou may now signup as an Dental Staff for RGDC Clinic. Use the code below to access the signup.\r\n{otp}\r\n\r\n\r\n\r\nThank you,\r\nRGDC Dental Clinic Team";
                mail.From = new MailAddress("reyesguansingdc.noreply@gmail.com");

                SmtpClient smtp = new SmtpClient("smtp.gmail.com", 587);
                smtp.Credentials = new NetworkCredential("reyesguansingdc.noreply@gmail.com", "nniircdehqoxkkqa");
                smtp.EnableSsl = true;
                smtp.Send(mail);
                return Json(new
                {
                    success = true,
                    message = "Staff registration initiated successfully.",
                }, JsonRequestBehavior.AllowGet);
            }

        }

        [HttpPost]
        public JsonResult signUpStaff(tblStaffModel staffmod)
        {
            using (var db = new RGDCContext())
            {
                var newStaff = new tblStaffModel
                {
                    accID = staffmod.accID,
                    staffRole = staffmod.staffRole,
                    branchID = staffmod.branchID,
                    //signature = staffmod.signature
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
                var existingAcc = db.tbl_account.Find(ownermod.accID);
                if (existingAcc == null)
                {
                    return Json(new
                    {
                        success = false,
                        message = "Account not found."
                    }, JsonRequestBehavior.AllowGet);
                }

                existingAcc.isArchived = 1;

                db.SaveChanges();

                return Json(new
                {
                    success = true,
                    message = "Owner account archived successfully."
                }, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult deleteDentist(tblDentistModel dentistmod)
        {
            using (var db = new RGDCContext())
            {
                var existingAcc = db.tbl_account.Find(dentistmod.accID);
                if (existingAcc == null)
                {
                    return Json(new
                    {
                        success = false,
                        message = "Account not found."
                    }, JsonRequestBehavior.AllowGet);
                }

                existingAcc.isArchived = 1;

                db.SaveChanges();

                return Json(new
                {
                    success = true,
                    message = "Owner account archived successfully."
                }, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult deleteStaff(tblStaffModel staffmod)
        {
            using (var db = new RGDCContext())
            {
                var existingAcc = db.tbl_account.Find(staffmod.accID);
                if (existingAcc == null)
                {
                    return Json(new
                    {
                        success = false,
                        message = "Account not found."
                    }, JsonRequestBehavior.AllowGet);
                }

                existingAcc.isArchived = 1;

                db.SaveChanges();

                return Json(new
                {
                    success = true,
                    message = "Owner account archived successfully."
                }, JsonRequestBehavior.AllowGet);
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
                        line1 = a.line1,
                        line2 = a.line2,
                        city = a.city,
                        state = a.state,
                        postal = a.postal,
                        country = a.country,
                        nationality = a.nationality,
                        religion = a.religion,
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
                        line1 = a.line1,
                        line2 = a.line2,
                        city = a.city,
                        state = a.state,
                        postal = a.postal,
                        country = a.country,
                        civilStatus = a.civilStatus,
                        photoLink = a.photoLink,
                        nationality = a.nationality,
                        religion = a.religion,
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
                        nationality = a.nationality,
                        religion = a.religion,
                        line1 = a.line1,
                        line2 = a.line2,
                        city = a.city,
                        state = a.state,
                        postal = a.postal,
                        country = a.country,
                        civilStatus = a.civilStatus,
                        photoLink = a.photoLink
                    }
                ).FirstOrDefault();

                return Json(result, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult getStaffData()
        {

            var sessionUserID = Session["userID"];

            if (sessionUserID == null)
            {
                // Return null or an error if the user isn't logged in
                return Json(null, JsonRequestBehavior.AllowGet);
            }

            int accID = Convert.ToInt32(sessionUserID);

            using (var db = new RGDCContext())
            {
                var result = (
                   from a in db.tbl_account
                   join s in db.tbl_staff on a.accID equals s.accID
                   where a.accID == accID
                   select new
                    {
                        // staff    
                        staffID = s.staffID,
                        accID = s.accID,
                        staffRole = s.staffRole,
                        branchID = s.branchID,
                        signature = s.signature,
                        nationality = a.nationality,
                        religion = a.religion,
                        // ACCOUNT (matches your ng-model)
                        firstName = a.firstName,
                        middleName = a.middleName,
                        lastName = a.lastName,
                        genderID = a.genderID,
                        birthDate = a.birthDate,
                        email = a.email,
                        contactNumber = a.contactNumber,
                        line1 = a.line1,
                        line2 = a.line2,
                        city = a.city,
                        state = a.state,
                        postal = a.postal,
                        country = a.country,
                        civilStatus = a.civilStatus,
                        photoLink = a.photoLink
                    }
                ).FirstOrDefault();
                return Json(result, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult getOwnerData()
        {
            var sessionUserID = Session["userID"];

            if (sessionUserID == null)
            {
                return Json(null, JsonRequestBehavior.AllowGet);
            }

            int accID = Convert.ToInt32(sessionUserID);

            using (var db = new RGDCContext())
            {
                var result = (from a in db.tbl_account
                              join o in db.tbl_owner on a.accID equals o.accID
                              where a.accID == accID
                              select new
                              {
                                  accID = a.accID,
                                  firstName = a.firstName,
                                  middleName = a.middleName,
                                  lastName = a.lastName,
                                  email = a.email,
                                  genderID = a.genderID,
                                  birthDate = a.birthDate,
                                  contactNumber = a.contactNumber,
                                  line1 = a.line1,
                                  line2 = a.line2,
                                  city = a.city,
                                  state = a.state,
                                  postal = a.postal,
                                  country = a.country,
                                  civilStatus = a.civilStatus,
                                  photoLink = a.photoLink,
                                  religion = a.religion,
                                  nationality = a.nationality,

                                  ownerID = o.ownerID,
                                  specialization = o.specialization,
                              }).FirstOrDefault();

                return Json(result, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult getDentistData()
        {
            var sessionUserID = Session["userID"];
            if (sessionUserID == null)
            {
                return Json(new
                {
                    message = "not working"
                }, JsonRequestBehavior.AllowGet);
            }

            int accID = Convert.ToInt32(sessionUserID);

            using (var db = new RGDCContext())
            {
                var result = (from a in db.tbl_account
                              join d in db.tbl_dentist on a.accID equals d.accID
                              where a.accID == accID
                              select new
                              {
                                  // Account Table Fields
                                  accID = a.accID,
                                  firstName = a.firstName,
                                  middleName = a.middleName,
                                  lastName = a.lastName,
                                  email = a.email,
                                  genderID = a.genderID,
                                  birthDate = a.birthDate,
                                  contactNumber = a.contactNumber,
                                  line1 = a.line1,
                                  line2 = a.line2,
                                  city = a.city,
                                  state = a.state,
                                  postal = a.postal,
                                  country = a.country,
                                  civilStatus = a.civilStatus,
                                  photoLink = a.photoLink,
                                  religion = a.religion,
                                  nationality = a.nationality,

                                  // Dentist Table Fields
                                  dentistID = d.dentistID,
                                  specialization = d.specialization,
                                  branchID = d.branchID
                                    // Example field for professional tax receipt
                              }).FirstOrDefault();

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
                existing.line1 = accmod.line1;
                existing.line2 = accmod.line2;
                existing.city = accmod.city;
                existing.state = accmod.state;
                existing.postal = accmod.postal;
                existing.country = accmod.country;
                existing.nationality = accmod.nationality;
                existing.religion = accmod.religion;
                existing.photoLink = accmod.photoLink;
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
        //public JsonResult addProgNotes(tblTreatmentPlanModel model)
        //{
        //    var role = Session["UserAuthorization"] != null ? Session["UserAuthorization"].ToString() : null;
        //    if (role == "1")
        //        return Json(new { success = false, message = "Not authorized" }, JsonRequestBehavior.AllowGet);

        //    if (model == null)
        //        return Json(new { success = false, message = "Empty payload." }, JsonRequestBehavior.AllowGet);

        //    if (model == null)
        //        return Json(new { success = false, message = "Empty payload." }, JsonRequestBehavior.AllowGet);

        //    if (model.patientID <= 0)
        //        return Json(new { success = false, message = "Missing or invalid patientID." }, JsonRequestBehavior.AllowGet);

        //    if (model.accID <= 0)
        //        return Json(new { success = false, message = "Missing or invalid accID (dentist)." }, JsonRequestBehavior.AllowGet);

        //    if (string.IsNullOrWhiteSpace(model.procedures))
        //        return Json(new { success = false, message = "Procedures is required." }, JsonRequestBehavior.AllowGet);

        //    DateTime noteDate;
        //    try
        //    {
        //        noteDate = (model.date == default(DateTime)) ? DateTime.Now : model.date;
        //        noteDate = noteDate.Date.Add(DateTime.Now.TimeOfDay);
        //    }
        //    catch
        //    {
        //        noteDate = DateTime.Now;
        //    }

        //    try
        //    {
        //        using (var db = new RGDCContext())
        //        {
        //            var patientExists = db.tbl_patient.Any(p => p.patientID == model.patientID);
        //            var accExists = db.tbl_account.Any(a => a.accID == model.accID);

        //            if (!patientExists)
        //                return Json(new { success = false, message = $"Patient not found (patientID={model.patientID})." }, JsonRequestBehavior.AllowGet);

        //            if (!accExists)
        //                return Json(new { success = false, message = $"Account / Dentist not found (accID={model.accID})." }, JsonRequestBehavior.AllowGet);

        //            var note = new tblTreatmentPlanModel
        //            {
        //                date = noteDate,
        //                patientID = model.patientID,
        //                accID = model.accID,
        //                amount = model.amount,
        //                paid = model.paid,
        //                procedures = model.procedures,
        //                toothNumber = model.toothNumber
        //            };

        //            db.tbl_treatmentplan.Add(note);
        //            var patientLastUpdated = db.tbl_patient.Where(p => p.patientID == model.patientID).Select(p => p.lastUpdated).FirstOrDefault();
        //            if (noteDate > patientLastUpdated)
        //            {
        //                var patient = db.tbl_patient.FirstOrDefault(p => p.patientID == model.patientID);
        //                if (patient != null)
        //                {
        //                    patient.lastUpdated = noteDate;
        //                }
        //            }
        //            db.SaveChanges();

        //            return Json(new { success = true }, JsonRequestBehavior.AllowGet);
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        System.Diagnostics.Trace.WriteLine("addProgNotes error: " + ex.ToString());
        //        return Json(new { success = false, message = "Server error adding progress note." }, JsonRequestBehavior.AllowGet);
        //    }
        //}

        //public JsonResult selectPlan(tblTreatmentPlanModel plan)
        //{
        //    using (var db = new RGDCContext())
        //    {
        //        var result = (
        //            from t in db.tbl_treatmentplan
        //            join a in db.tbl_account on t.accID equals a.accID
        //            join p in db.tbl_patient on t.patientID equals p.patientID

        //            where t.trtPlanID == plan.trtPlanID

        //            select new
        //            {
        //                // TREATMENT PLAN
        //                trtPlanID = t.trtPlanID,
        //                date = t.date,
        //                toothNumber = t.toothNumber,
        //                procedures = t.procedures,
        //                amount = t.amount,
        //                paid = t.paid,

        //                // DENTIST
        //                accID = t.accID,
        //                patientID = p.patientID
        //            }
        //        ).FirstOrDefault();

        //        return Json(result, JsonRequestBehavior.AllowGet);
        //    }
        //}
        //[HttpPost]
        //public JsonResult editProgressNotes(tblTreatmentPlanModel model)
        //{
        //    using (var db = new RGDCContext())
        //    {
        //        var existing = db.tbl_treatmentplan
        //            .FirstOrDefault(t => t.trtPlanID == model.trtPlanID);

        //        if (existing == null)
        //        {
        //            return Json(new
        //            {
        //                success = false,
        //                message = "Progress note not found."
        //            }, JsonRequestBehavior.AllowGet);
        //        }

        //        // UPDATE FIELDS
        //        existing.accID = model.accID;
        //        existing.date = model.date;
        //        existing.toothNumber = model.toothNumber;
        //        existing.procedures = model.procedures;
        //        existing.amount = model.amount;
        //        existing.paid = model.paid;
        //        var patientLastUpdated = db.tbl_patient.FirstOrDefault(p => p.patientID == model.patientID);
        //        patientLastUpdated.lastUpdated = model.date > patientLastUpdated.lastUpdated ? model.date : patientLastUpdated.lastUpdated;
        //        db.SaveChanges();

        //        return Json(new
        //        {
        //            success = true,
        //            message = "Progress note updated successfully."
        //        }, JsonRequestBehavior.AllowGet);
        //    }
        //}
        //[HttpPost]
        //public JsonResult deletePlan(tblTreatmentPlanModel trtPlan)
        //{
        //    using (var db = new RGDCContext())
        //    {
        //        var existing = db.tbl_treatmentplan
        //            .FirstOrDefault(t => t.trtPlanID == trtPlan.trtPlanID);
        //        if (existing == null)
        //        {
        //            return Json(new
        //            {
        //                success = false,
        //                message = "Progress note not found."
        //            }, JsonRequestBehavior.AllowGet);
        //        }

        //        db.tbl_treatmentplan.Remove(existing);
        //        db.SaveChanges();

        //        return Json(new
        //        {
        //            success = true,
        //            message = "Progress note deleted successfully."
        //        }, JsonRequestBehavior.AllowGet);
        //    }
        //}

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

                var patientsDoneThisWeek = db.tbl_payment
                    .Where(t => t.paymentDate >= startOfWeek)
                    .Select(t => t.patientID)
                    .Distinct()
                    .Count();

                var unpaidPatients = db.tbl_payment
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
                var allTreatments = (from t in db.tbl_payment select t).ToList();

                // Patients per month (last 6 months)
                var patientsPerMonth = (from a in allAccounts
                                        where a.accCreatedAt >= sixMonthsAgo && a.role == 3
                                        group a by new { a.accCreatedAt.Year, a.accCreatedAt.Month } into g
                                        orderby g.Key.Year, g.Key.Month
                                        select new
                                        {
                                            label = g.Key.Month + "/" + g.Key.Year,
                                            count = g.Count()
                                        }).ToList();

                // Procedures this week
                var proceduresThisWeek = (from t in allTreatments
                                          where t.paymentDate >= startOfWeek
                                          group t by t.paymentDate.DayOfWeek into g
                                          select new
                                          {
                                              day = g.Key.ToString(),
                                              count = g.Count()
                                          }).ToList();

                // Procedures by revenue
                var proceduresByRevenue = (from t in allTreatments
                                           group t by t.procedures into g
                                           orderby g.Sum(x => x.balance) descending
                                           select new
                                           {
                                               procedure = g.Key,
                                               total = g.Sum(x => x.balance)
                                           }).Take(5).ToList();

                // Paid vs Unpaid
                var paid = (from t in allTreatments where t.paid >= t.balance select t).Count();
                var unpaid = (from t in allTreatments where t.paid < t.balance select t).Count();

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

        private string CleanRemarksForUi(string remarks)
        {
            if (string.IsNullOrWhiteSpace(remarks)) return string.Empty;

            try
            {
                // Remove any googleEventId token and any leading separators/punctuation that may be adjacent
                // This covers patterns like "|googleEventId:abc", ".|googleEventId:abc", ";googleEventId:abc" etc.
                var cleaned = System.Text.RegularExpressions.Regex.Replace(
                    remarks,
                    @"[;,\.\|\s]*googleEventId:[^;\|\s]+",
                    "",
                    System.Text.RegularExpressions.RegexOptions.IgnoreCase);

                // Remove duplicate separators left behind, normalize
                cleaned = System.Text.RegularExpressions.Regex.Replace(cleaned, @"[\|\;]{2,}", "|");

                // Trim common leftover punctuation/whitespace
                cleaned = cleaned.Trim();
                cleaned = cleaned.Trim(';', '|', ' ', '\r', '\n', '.', ',');

                return string.IsNullOrEmpty(cleaned) ? string.Empty : cleaned;
            }
            catch
            {
                // fallback: return original if cleaner fails
                return remarks ?? string.Empty;
            }
        }


        [HttpGet]
        public JsonResult GetDentistSchedule(int dentistID)
        {
            try
            {
                using (var db = new RGDCContext())
                {
                    var list = db.tbl_dentist_schedule
                                 .Where(s => s.dentistID == dentistID)
                                 .OrderBy(s => s.dayOfWeek).ThenBy(s => s.startTime)
                                 .Select(s => new
                                 {
                                     s.scheduleID,
                                     s.dentistID,
                                     s.dayOfWeek,
                                     startTime = s.startTime, // will be serialized as timespan string
                                     endTime = s.endTime,
                                     s.slotMinutes
                                 }).ToList();

                    return Json(list, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult SaveDentistSchedule(List<tblDentistScheduleModel> schedule)
        {
            try
            {
                if (schedule == null || schedule.Count == 0) return Json(new { success = false, message = "Empty payload." });

                using (var db = new RGDCContext())
                {
                    var dentistID = schedule.First().dentistID;

                    // remove existing for dentist (simple approach)
                    var existing = db.tbl_dentist_schedule.Where(s => s.dentistID == dentistID).ToList();
                    if (existing.Any())
                    {
                        db.tbl_dentist_schedule.RemoveRange(existing);
                        db.SaveChanges();
                    }

                    foreach (var s in schedule)
                    {
                        // ensure slotMinutes default
                        if (s.slotMinutes <= 0) s.slotMinutes = 30;
                        db.tbl_dentist_schedule.Add(s);
                    }
                    db.SaveChanges();
                    return Json(new { success = true });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }
    }
}

