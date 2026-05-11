using System;
using System.Collections.Generic;
using System.Data.Entity.ModelConfiguration;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models.Map
{
    public class tblDentistScheduleMap : EntityTypeConfiguration<tblDentistScheduleModel>
    {
        public tblDentistScheduleMap()
        {
            ToTable("tbl_dentist_schedule");
            HasKey(t => t.scheduleID);

            Property(t => t.scheduleID)
                .HasColumnName("scheduleID")
                .HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(t => t.dentistID).HasColumnName("dentistID").IsRequired();
            Property(t => t.dayOfWeek).HasColumnName("dayOfWeek").IsRequired();
            Property(t => t.startTime).HasColumnName("startTime").IsRequired();
            Property(t => t.endTime).HasColumnName("endTime").IsRequired();
            Property(t => t.slotMinutes).HasColumnName("slotMinutes").IsRequired();
            Property(t => t.createdAt).HasColumnName("createdAt").IsRequired();
        }
    }
}