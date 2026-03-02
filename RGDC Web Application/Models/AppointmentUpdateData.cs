using System;

namespace RGDC_Web_Application.Models
{
    public class AppointmentUpdateData
    {
        public int apptID { get; set; }
        public DateTime dateTime { get; set; }
        public string reason { get; set; }
    }
}
