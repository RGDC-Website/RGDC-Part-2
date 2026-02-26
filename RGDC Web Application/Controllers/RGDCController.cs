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
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Mail;
using System.Runtime.ConstrainedExecution;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Helpers;
using System.Web.Mvc;


namespace RGDC_Web_Application.Controllers
{
    public class RGDCController : Controller
    {
        public ActionResult signUp()
        {
            return View();
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
                        accUpdatedAt = DateTime.Now
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

                        return Json(new
                        {
                            success = true,
                            message = "Login successful",
                            firstName = Session["UserName"].ToString(),
                            fullName = Session["UserFullName"].ToString(),
                            authorization = user.role
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
            return Json(new
            {
                userName = Session["UserName"].ToString(),
                fullName = Session["UserFullName"].ToString(),
                userAuthorization = Session["UserAuthorization"].ToString(),
            }, JsonRequestBehavior.AllowGet);
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
                var result = (
                    from p in db.tbl_patient
                    join a in db.tbl_account
                        on p.accID equals a.accID
                    select new
                    {
                        patientID = p.patientID,
                        accID = p.accID,
                        patientName = a.firstName + " " + a.lastName,
                        lastVisit = p.lastVisit
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
            Session["UserID"] = "";
            Session["UserName"] = "";
            Session["UserFullName"] = "";
            Session["UserAuthorization"] = "";
            Session["IsLoggedIn"] = false;
            Session["SelectedPatientID"] = "";
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
    }
}

      
    
