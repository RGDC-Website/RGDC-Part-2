using System;

namespace RGDC_Web_Application.Models
{
    public class AppointmentRequestData
    {
        public int patientID { get; set; }
        public int dentistID { get; set; }
        public DateTime dateTime { get; set; }
        public string reason { get; set; }

        //RESCHED
        public int? originalApptID { get; set; }
        public string contactNumber { get; set; }
        public string requesterName { get; set; }

        public string notes { get; set; }
    }
}
