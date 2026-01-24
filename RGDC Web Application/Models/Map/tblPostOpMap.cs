using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models.Map
{
    public class tblPostOpMap : EntityTypeConfiguration<tblPostOpModel>
    {
        public tblPostOpMap()
        {
            HasKey(t => t.postOpID);
            ToTable("tbl_postop");
        }
    }
}