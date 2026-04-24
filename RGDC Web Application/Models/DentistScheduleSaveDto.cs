using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models
{
    public class DentistScheduleSaveDto
    {
        public int dentistID { get; set; }
        public int dayOfWeek { get; set; }
        public string startTime { get; set; }
        public string endTime { get; set; }
        public int slotMinutes { get; set; }
    }
}
