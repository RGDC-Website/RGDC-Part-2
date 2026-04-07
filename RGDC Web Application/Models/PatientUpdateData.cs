using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models
{
    public class PatientUpdateData
    {
        public int patientID { get; set; }
        public int accID { get; set; }
        public string firstName { get; set; }
        public string middleName { get; set; }
        public string lastName { get; set; }
        public int? genderID { get; set; }
        public DateTime? birthDate { get; set; }
        public string email { get; set; }
        public string contactNumber { get; set; }
        public string address { get; set; }
        public string civilStatus { get; set; }
        public string occupation { get; set; }
        public string religion { get; set; }
        public string nationality { get; set; }

        public string currentPhysician { get; set; }
        public string previousPhysician { get; set; }
        public string guardian { get; set; }
        public string guardianNumber { get; set; }
        public string insurance { get; set; }
        public string referral { get; set; }

        public DateTime? lastVisit { get; set; }
        public DateTime? nextVisit { get; set; }
    }
}