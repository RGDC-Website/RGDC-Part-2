using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models
{
    public class tblAddAccountModel
    {
        public int addID { get; set; }
        public string email { get; set; }
        public int permission { get; set; }
        public string code { get; set; }
        public DateTime addCreatedAt { get; set; }
        public DateTime addUpdatedAt { get; set; }


    }
}