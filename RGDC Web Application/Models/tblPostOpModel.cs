using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models
{
    public class tblPostOpModel
    {
        public int postOpID { get; set; }
        public string title { get; set; }
        public string content { get; set; }
        public DateTime instCreatedAt { get; set; }
        public DateTime instUpdatedAt { get; set; }


    }
}