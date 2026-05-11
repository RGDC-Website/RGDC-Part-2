using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models
{
    public class tblDentistScheduleModel
    {
        public int scheduleID { get; set; }
        public int dentistID { get; set; }

        public int dayOfWeek { get; set; }
        public TimeSpan startTime { get; set; }
        public TimeSpan endTime { get; set; }
        public int slotMinutes { get; set; }
        public DateTime createdAt { get; set; }
    }
}