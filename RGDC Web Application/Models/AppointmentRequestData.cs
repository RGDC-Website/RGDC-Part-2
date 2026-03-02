using System;

namespace RGDC_Web_Application.Models
{
    public class AppointmentRequestData
    {
        public int patientID { get; set; }
        public int dentistID { get; set; }
        public DateTime dateTime { get; set; }
        public string reason { get; set; }
    }
}
