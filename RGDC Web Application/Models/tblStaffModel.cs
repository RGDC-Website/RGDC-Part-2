using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models
{
    public class tblStaffModel
    {
        public int staffID { get; set; }
        public int accID { get; set; }
        public string staffRole { get; set; }
        public int branchID { get; set; }
        public string signature { get; set; }

    }
}