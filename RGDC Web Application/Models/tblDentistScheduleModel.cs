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

        // 0 = Sunday, 1 = Monday, ... 6 = Saturday
        public int dayOfWeek { get; set; }

        // Store as time-of-day; EF maps TimeSpan to SQL TIME
        public TimeSpan startTime { get; set; }
        public TimeSpan endTime { get; set; }

        // slot length in minutes (optional; default 30)
        public int slotMinutes { get; set; }
    }
}