using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models
{
    public class tblFormatModel
    {
        public int formatID { get; set; }
        public string format { get; set; }
        public string formatType { get; set; }
        public DateTime formatCreatedAt { get; set; }
        public DateTime formatUpdatedAt { get; set; }


    }
}