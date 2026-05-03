using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models
{
    public class tblFormModel
    {
        public int formID { get; set; }
        public int patientID { get; set; }
        public int dentistID { get; set; }
        public int formatType { get; set; }
        public string formContent { get; set; }
        public int isArchived { get; set; }
        public DateTime formCreatedAt { get; set; }
        public DateTime formUpdatedAt { get; set; }


    }
}