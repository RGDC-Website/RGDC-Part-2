using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models
{
    public class tblPatientImageModel
    {
        public int patientImageID { get; set; }
        public int patientID { get; set; }
        public string imagePath { get; set; }
        public string imageType { get; set; } 
        public DateTime createdAt { get; set; }
        public DateTime updatedAt { get; set; }
    }
}