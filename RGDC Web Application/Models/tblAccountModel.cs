using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models
{
    public class tblAccountModel
    {
        public int accID { get; set; }
        public string firstName { get; set; }
        public string middleName { get; set; }
        public string lastName { get; set; }
        public int genderID { get; set; }
        public DateTime birthDate { get; set; }
        public string email { get; set; }
        public string contactNumber { get; set; }
        public string address { get; set; } 
        public string civilStatus { get; set; }
        public string religion { get; set; }
        public string nationality { get; set; }
        public string password { get; set; }
        public string photoLink { get; set; }
        public int role { get; set; }
        public int permission { get; set; }
        public int isArchived { get; set; }
        public DateTime lastLogin { get; set; }
        public DateTime accCreatedAt { get; set; }
        public DateTime accUpdatedAt { get; set; }
        public string googleRefreshToken { get; set; }
        public bool googleCalendarEnabled { get; set; }


    }
}