using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models
{
    public class tblTreatmentPlanModel
    {
        public int trtPlanID { get; set; }
        public int dentistID { get; set; }
        public int patientID { get; set; }
        public string toothNumber { get; set; }
        public int procedureID { get; set; }
        public int paymentID { get; set; }

    }
}