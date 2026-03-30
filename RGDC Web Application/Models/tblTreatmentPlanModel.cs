using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models
{
    public class tblTreatmentPlanModel
    {
        public int trtPlanID { get; set; }
        public int accID { get; set; }
        public int patientID { get; set; }
        public DateTime date { get; set; }
        public string toothNumber { get; set; }
        public string procedures { get; set; }
        public float amount { get; set; }
        public float paid { get; set; }

    }
}