using System;
using System.Collections.Generic;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models.Map
{
    public class tblPatientImageMap : EntityTypeConfiguration<tblPatientImageModel>
    {
        public tblPatientImageMap()
        {
            ToTable("tbl_patient_images");
            HasKey(t => t.patientImageID);
            Property(t => t.patientImageID).HasColumnName("patientImageID");
            Property(t => t.patientID).HasColumnName("patientID").IsRequired();
            Property(t => t.imagePath).HasColumnName("imagePath").IsRequired();
            Property(t => t.imageType).HasColumnName("imageType").IsRequired();
            Property(t => t.createdAt).HasColumnName("createdAt").IsRequired();
            Property(t => t.updatedAt).HasColumnName("updatedAt").IsRequired();
        }
    }
}