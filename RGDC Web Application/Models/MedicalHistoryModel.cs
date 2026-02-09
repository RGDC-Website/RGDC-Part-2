using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models
{
    public class MedicalHistoryModel
    {
        public Dictionary<string, object> history { get; set; }
        public Dictionary<string, object> conditions { get; set; }
    }
}