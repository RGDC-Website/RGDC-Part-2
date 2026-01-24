using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models
{
    public class tblProcedureModel
    {
        public int procID { get; set; }
        public string description { get; set; }
        public DateTime procCreatedAt { get; set; }
        public DateTime procUpdatedAt { get; set; }


    }
}