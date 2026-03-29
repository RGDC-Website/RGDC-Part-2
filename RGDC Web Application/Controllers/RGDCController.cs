//for google calendar api
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
using RGDC_Web_Application.Models;
using RGDC_Web_Application.Models.Context;
using RGDC_Web_Application.Models.Map;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.Entity;
using System.IO;
using System.Linq;
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
        public JsonResult CheckEmail(string email)
        {
            try
            {
                using (var db = new RGDCContext())
                {
                    if (db == null)
                    {
                        return Json(new { exists = false, error = "DB context is null" });
                    }
                    bool exist = db.tbl_account.Any(u => u.email == email);

                    return Json(new
                    {
                        exists = exist
                    }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    exists = false,
                    error = ex.Message
                }, JsonRequestBehavior.AllowGet);
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

        [HttpPost]
        public JsonResult signUpAcc(tblAccountModel accDetails)
        {
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
                        photoLink = accDetails.photoLink
                    };
                    addUser.tbl_account.Add(newData);
                    addUser.SaveChanges();
                    return Json(new
                    {
                        accID = newData.accID
                    }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                throw new ArgumentException($"There is an error {ex.Message}");
            }
        }

        [HttpPost]
        public void signUpPatient(tblPatientModel accDetails)
        {
            try
            {
                using (var addUser = new RGDCContext())
                {
                    var newData = new tblPatientModel()
                    {
                        accID = accDetails.accID,
                        currentPhysician = accDetails.currentPhysician,
                        referral = accDetails.referral,
                        lastVisit = accDetails.lastVisit,
                        medicalHistory = accDetails.medicalHistory,
                        medHistUpdate = DateTime.Now
                    };
                    addUser.tbl_patient.Add(newData);
                    addUser.SaveChanges();
                }
            }
            catch (Exception ex)
            {
                throw new ArgumentException($"There is an error {ex.Message}");
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

                using (var db = new RGDCContext())
                {
                    var hashedPassword = passwordHash(password);
                    var user = db.tbl_account.FirstOrDefault(u =>
                        u.email == email && u.password == hashedPassword);

                    if (user != null)
                    {
                        // Set session variables
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
                        return Json(new { success = false, message = "Invalid email or password" }, JsonRequestBehavior.AllowGet);
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

                var content = new FormUrlEncodedContent(values);
                var response = await client.PostAsync("https://oauth2.googleapis.com/token", content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorBody = await response.Content.ReadAsStringAsync();
                    return Content(errorBody);
                }
                var jsonResponse = await response.Content.ReadAsStringAsync();

                var serializer = new Newtonsoft.Json.JsonSerializer();
                var tokenData = JsonConvert.DeserializeObject<Dictionary<string, dynamic>>(jsonResponse);

                if (tokenData.ContainsKey("access_token"))
                {
                    string accessToken = tokenData["access_token"];

                    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                    var userInfoJson = await client.GetStringAsync("https://www.googleapis.com/oauth2/v2/userinfo");
                    var userInfo = JsonConvert.DeserializeObject<Dictionary<string, dynamic>>(userInfoJson);

                    System.Web.Security.FormsAuthentication.SetAuthCookie(userInfo["email"], false);

                    if (Response.Cookies["ASP.NET_SessionId"] != null)
                    {
                        Response.Cookies["ASP.NET_SessionId"].HttpOnly = true;
                        Response.Cookies["ASP.NET_SessionId"].Secure = Request.IsSecureConnection;
                    }


                    Session["UserEmail"] = userInfo["email"];
                    Session["IsLoggedIn"] = true;

                    using (var db = new RGDCContext())
                    {
                        string email = Session["UserEmail"] as string;
                        bool exist = db.tbl_account.Any(u => u.email == email);
                        if (exist)
                        {
                            var user = db.tbl_account.FirstOrDefault(u => u.email == email);

                            if (user != null)
                            {
                                // Set session variables
                                Session["UserID"] = user.accID;
                                Session["UserName"] = user.firstName;
                                Session["UserFullName"] = user.firstName + " " + user.lastName;
                                Session["UserAuthorization"] = user.role;
                                Session["IsLoggedIn"] = true;
                                Session["UserPhoto"] = user.photoLink ?? "";
                                return RedirectToAction("adminDashboard", "RGDC");
                            }
                            else
                            {
                                return RedirectToAction("signUp", "RGDC");
                            }
                        }
                    }

                }
            }

            using (var db = new RGDCContext())
            {
                string email = Session["UserEmail"] as string;
                bool exist = db.tbl_account.Any(u => u.email == email);
                if (exist)
                {
                    var user = db.tbl_account.FirstOrDefault(u => u.email == email);

                    if (user != null)
                    {
                        // Set session variables
                        Session["UserID"] = user.accID;
                        Session["UserName"] = user.firstName;
                        Session["UserFullName"] = user.firstName + " " + user.lastName;
                        Session["UserAuthorization"] = user.role;
                        Session["IsLoggedIn"] = true;
                        return RedirectToAction("adminDashboard", "RGDC");
                    }
                }
                return RedirectToAction("", "RGDC");
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

                try
                {
                    // SEND EMAIL
                    MailMessage mail = new MailMessage();
                    mail.To.Add(email);
                    mail.Subject = "Password Reset OTP";
                    mail.Body = $"Your OTP is: {otp}";
                    mail.From = new MailAddress("jmlzpnt@gmail.com");

                    SmtpClient smtp = new SmtpClient("smtp.gmail.com", 587);
                    smtp.Credentials = new NetworkCredential("jmlzpnt@gmail.com", "jubxxcrsgyleffin");
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
                    mail.From = new MailAddress("jmlzpnt@gmail.com");

                    SmtpClient smtp = new SmtpClient("smtp.gmail.com", 587);
                    smtp.Credentials = new NetworkCredential("jmlzpnt@gmail.com", "jubxxcrsgyleffin");
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
                if (Session["RESET_OTP"]?.ToString() != otp ||
                    Session["RESET_EMAIL"]?.ToString() != email)
                {
                    return Json(new { success = false, message = "Invalid OTP" });
                }

                var user = db.tbl_account.FirstOrDefault(u => u.email == email);
                if (user == null)
                    return Json(new { success = false, message = "Email not found" });

                user.password = passwordHash(password);
                db.SaveChanges();

                Session.Remove("RESET_OTP");
                Session.Remove("RESET_EMAIL");

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
                            // Only include appointments that are completed/cancelled/denied
                        where appt.status == "Done" || appt.status == "Cancelled" || appt.status == "Denied"
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
                        insurance = p.insurance,
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
                                insurance = p.insurance,
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
                    pat.guardian = string.IsNullOrWhiteSpace(profInfo.guardian) ? pat.guardian : profInfo.guardian;
                    pat.guardianNumber = string.IsNullOrWhiteSpace(profInfo.guardianNumber) ? pat.guardianNumber : profInfo.guardianNumber;
                    pat.insurance = string.IsNullOrWhiteSpace(profInfo.insurance) ? pat.insurance : profInfo.insurance;
                    pat.referral = string.IsNullOrWhiteSpace(profInfo.referral) ? pat.referral : profInfo.referral;
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
                db.SaveChanges();

                return Json(new { success = true, jsonstring = jsonString }, JsonRequestBehavior.AllowGet);
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
                    join a in db.tbl_account
                        on p.accID equals a.accID
                    select new
                    {
                        trtPlanID = t.trtPlanID,
                        date = t.date,
                        procedureID = t.procedureID,
                        toothNumber = t.toothNumber,
                        accID = a.accID,
                        dentistName = a.firstName + " " + a.lastName,
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
                // Auto-move past scheduled appointments to Done if their datetime has passed
                try
                {
                    var now = DateTime.Now;
                    var toMarkDone = db.tbl_appointment.Where(a => a.status == "Scheduled" && a.dateTime < now).ToList();
                    if (toMarkDone.Any())
                    {
                        foreach (var a in toMarkDone)
                        {
                            a.status = "Done";
                        }
                        db.SaveChanges();
                    }
                }
                catch
                {
                    // ignore any errors here to avoid breaking the listing
                }
                var result = (
                    from appt in db.tbl_appointment
                        // patient join: appointment.patientID -> tbl_patient.patientID -> tbl_account (patient acc)
                    join pat in db.tbl_patient on appt.patientID equals pat.patientID into patj
                    from pat in patj.DefaultIfEmpty()
                    join patAcc in db.tbl_account on pat.accID equals patAcc.accID into patAccj
                    from patAcc in patAccj.DefaultIfEmpty()

                        // dentist join: appointment.dentistID -> tbl_dentist.dentistID -> tbl_account (dentist acc)
                    join dent in db.tbl_dentist on appt.dentistID equals dent.dentistID into dentj
                    from dent in dentj.DefaultIfEmpty()
                    join dentAcc in db.tbl_account on dent.accID equals dentAcc.accID into dentAccj
                    from dentAcc in dentAccj.DefaultIfEmpty()

                    where appt.status == "Scheduled"
                    orderby appt.dateTime
                    select new
                    {
                        apptID = appt.apptID,
                        dentistID = appt.dentistID,
                        patientID = appt.patientID,
                        dateTime = appt.dateTime,
                        date = appt.dateTime, 
                        time = appt.dateTime, 
                        purpose = appt.reason,
                        dentistName = dentAcc != null ? (dentAcc.firstName + " " + dentAcc.lastName) : null,
                        patientName = patAcc != null ? (patAcc.firstName + " " + patAcc.lastName) : null,
                        status = appt.status,

                        displayStatus = appt.status == "Scheduled" ? "Scheduled" :
                                        (appt.status == "Done" ? "Completed/Done" :
                                        (appt.status == "Requested" ? ((patAcc != null && appt.createdBy == patAcc.accID) ? "Requested by Patient" : ((dentAcc != null && appt.createdBy == dentAcc.accID) ? "Requested by Dentist" : "Requested")) : appt.status)),
                        remarks = appt.remarks,
                        procedureID = appt.procedureID
                    }).ToList();

                return Json(result, JsonRequestBehavior.AllowGet);
            }
        }
        public JsonResult getPayments()
        {
            using (var db = new RGDCContext())
            {
                var result = (
                    from pay in db.tbl_payment
                    join p in db.tbl_patient on pay.patientID equals p.patientID
                    join pa in db.tbl_account on p.accID equals pa.accID
                    join d in db.tbl_dentist on pay.dentistID equals d.dentistID
                    join da in db.tbl_account on d.accID equals da.accID  // dentist account
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
                    }
                ).ToList();

                return Json(result, JsonRequestBehavior.AllowGet);
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

                if (request.dateTime == null || request.dateTime == DateTime.MinValue)
                    return Json(new { success = false, message = "Invalid appointment date/time provided." });

                var dateTime = request.dateTime;

                // Server-side business rule: appointment must be at least 2 days from today
                var minAllowed = DateTime.Today.AddDays(2);
                if (dateTime.Date < minAllowed.Date)
                    return Json(new { success = false, message = "Appointment date must be at least 2 days from today." });

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
                    if (role == 2)
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
                                    status = appt.status, // No change
                                    createdBy = appt.createdBy, // No change
                                    displayStatus = appt.status == "Requested" ? (appt.createdBy == patAcc.accID ? "Requested by Patient" : "Requested by Dentist") : appt.status // No change
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
                // Assign the result to the 'token' variable declared above
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

                var maxBytes = 5 * 1024 * 1024;
                if (file.ContentLength > maxBytes)
                    return Json(new { success = false, message = "File too large. Max 5 MB." });

                var accIdVal = Request.Form["accID"];
                if (string.IsNullOrEmpty(accIdVal) || !int.TryParse(accIdVal, out int accID))
                {
                    return Json(new { success = false, message = "Missing or invalid accID." });
                }

                string uploadPath = Server.MapPath("~/Content/Uploads/");
                if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

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

                    var acc = db.tbl_account.FirstOrDefault(a => a.accID == accID);
                    if (acc != null)
                    {
                        acc.photoLink = relativePath;
                        db.SaveChanges();
                    }
                }

                return Json(new { success = true, message = "Photo uploaded and linked to account.", filePath = relativePath });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error uploading photo: {ex.Message}" });
            }
        }
    }
}
