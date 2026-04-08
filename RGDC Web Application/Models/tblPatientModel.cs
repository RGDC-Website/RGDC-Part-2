using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Helpers;

namespace RGDC_Web_Application.Models
{
    public class tblPatientModel
    {
        public int patientID { get; set; }
        public int accID { get; set; }
        public string currentPhysician { get; set; }
        public string previousPhysician { get; set; }
        public string previousPhysicianOffice { get; set; }
        public string previousPhysicianContact { get; set; }
        public string occupation { get; set; }
        public string guardian { get; set; }
        public string guardianNumber { get; set; }
        public int postOpID { get; set; }
        public string medicalHistory { get; set; }
        public DateTime medHistUpdate { get; set; }
        public string referral { get; set; }
        public string dentalChartLink { get; set; }
        public string signatureLink { get; set; }
        public DateTime nextVisit { get; set; }
        public DateTime lastVisit { get; set; }
        public DateTime lastUpdated { get; set; }
    }
}