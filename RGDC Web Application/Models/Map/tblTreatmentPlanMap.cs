using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models.Map
{
    public class tblTreatmentPlanMap : EntityTypeConfiguration<tblTreatmentPlanModel>
    {
        public tblTreatmentPlanMap()
        {
            HasKey(t => t.trtPlanID);
            ToTable("tbl_treatmentplan");
        }
    }
}