using Microsoft.Ajax.Utilities;
using MySql.Data.MySqlClient;
using Newtonsoft.Json;
using RGDC_Web_Application.Models;
using RGDC_Web_Application.Models.Context;
using RGDC_Web_Application.Models.Map;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using System.Web;
using System.Web.Helpers;
using System.Web.Mvc;
using System.Security.Cryptography;
using System.Text;


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

        public ActionResult staffDashboard()
        {
            return View();
        }

        public ActionResult staffPatientsTab()
        {
            return View();
        }
        [HttpPost]
        public JsonResult CheckEmail(string email)
        {
            try {
                using (var db = new RGDCContext()) {
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
            catch (Exception ex) {
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
        public void signUpAcc(tblAccountModel accDetails)
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
                        Session["UserAuthorization"] = user.role;
                        Session["IsLoggedIn"] = true;

                        return Json(new
                        {
                            success = true,
                            message = "Login successful",
                            userName = Session["UserName"].ToString(),
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
                                Session["UserAuthorization"] = user.role;
                                Session["IsLoggedIn"] = true;
                                if (Session["UserAuthorization"].ToString() == "3")
                                {
                                    return RedirectToAction("patientDashboard", "RGDC");
                                }
                                else
                                {
                                    return RedirectToAction("adminDashboard", "RGDC");
                                }
                            } else
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
                        Session["UserAuthorization"] = user.role;
                        Session["IsLoggedIn"] = true;
                        if (Session["UserAuthorization"].ToString() == "3")
                        {
                            return RedirectToAction("patientDashboard", "RGDC");
                        }
                        else
                        {
                            return RedirectToAction("adminDashboard", "RGDC");
                        }
                    }
                }
                return RedirectToAction("", "RGDC");
            }
        }

        public JsonResult getSessionVariable() {
            return Json(new
            {
                userID = 1,
                userName = Session["UserName"].ToString(),
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
    }
}

      
    
