using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models
{
    public class tblDentistModel
    {
        public int dentistID { get; set; }
        public int accID { get; set; }
        public string specialization { get; set; }
        public int branchID { get; set; }
        public string signature { get; set; }

    }
}