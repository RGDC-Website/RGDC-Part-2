using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models
{
    public class tblBranchModel
    {
        public int branchID { get; set; }
        public string description { get; set; }
        public DateTime branchCreatedAt { get; set; }
        public DateTime branchUpdatedAt { get; set; }


    }
}