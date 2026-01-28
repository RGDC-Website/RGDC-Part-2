using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace RGDC_Web_Application.Controllers
{
    public class RGDCController : Controller
    {
        public ActionResult Index()
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

        public ActionResult signUp()
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