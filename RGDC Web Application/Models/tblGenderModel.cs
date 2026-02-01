using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models
{
    public class tblGenderModel
    {
        public int genderID { get; set; }
        public string description { get; set; }
        public DateTime genderCreatedAt { get; set; }
        public DateTime genderUpdatedAt { get; set; }


    }
}