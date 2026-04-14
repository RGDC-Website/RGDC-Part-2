using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models
{
    public class tblAppointmentModel
    {
        public int apptID { get; set; }
        public int patientID { get; set; }
        public int dentistID { get; set; }
        public int createdBy { get; set; }
        public DateTime dateTime { get; set; }
        public string reason { get; set; }
        public int procedures { get; set; }
        public string remarks { get; set; }
        public string status { get; set; }
        public DateTime schedCreatedAt { get; set; }
        public DateTime schedUpdatedAt { get; set; }


    }
}