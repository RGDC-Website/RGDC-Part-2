using System;
using System.Collections.Generic;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models.Map
{
    public class tblImagesMap : EntityTypeConfiguration<tblImagesModel>
    {
        public tblImagesMap()
        {
            HasKey(t => t.imageID);
            ToTable("tbl_images");
        }
    }
}