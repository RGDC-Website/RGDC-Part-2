using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models
{
    public class tblPaymentModel
    {
        public int paymentID { get; set; }
        public int dentistID { get; set; }
        public int patientID { get; set; }
        public int createdBy { get; set; }
        public string procedures { get; set; }
        public string toothNumber { get; set; }
        public string description { get; set; }
        public string reference { get; set; }
        public string paymentMethod { get; set; }
        public DateTime paymentDate { get; set; }
        public float cost { get; set; }
        public float discount { get; set; }
        public float paid { get; set; }
        public float balance { get; set; }
        public DateTime payCreatedAt { get; set; }
        public DateTime payUpdatedAt { get; set; }
    }
}