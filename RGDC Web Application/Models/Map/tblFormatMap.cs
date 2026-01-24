using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models.Map
{
    public class tblFormMap : EntityTypeConfiguration<tblFormModel>
    {
        public tblFormMap()
        {
            HasKey(t => t.formID);
            ToTable("tbl_form");
        }
    }
}