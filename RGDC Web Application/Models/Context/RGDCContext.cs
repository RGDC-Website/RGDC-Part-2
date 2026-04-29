using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web;
using RGDC_Web_Application.Models.Map;

namespace RGDC_Web_Application.Models.Context
{
    public class RGDCContext : DbContext
    {
        static RGDCContext()
        {
            Database.SetInitializer<RGDCContext>(null);
        }
        public RGDCContext() : base("Name=rgdcdb") { }

        public virtual DbSet<tblAccountModel> tbl_account { get; set; }
        public virtual DbSet<tblAppointmentModel> tbl_appointment { get; set; }
        public virtual DbSet<tblAddAccountModel> tbl_addAccount { get; set; }
        public virtual DbSet<tblBranchModel> tbl_branch { get; set; }
        public virtual DbSet<tblDentistModel> tbl_dentist { get; set; }
        public virtual DbSet<tblFormModel> tbl_form { get; set; }
        public virtual DbSet<tblGenderModel> tbl_gender { get; set; }
        public virtual DbSet<tblOwnerModel> tbl_owner { get; set; }
        public virtual DbSet<tblPatientModel> tbl_patient { get; set; }
        public virtual DbSet<tblPaymentModel> tbl_payment { get; set; }
        public virtual DbSet<tblPostOpModel> tbl_postop { get; set; }
        public virtual DbSet<tblProcedureModel> tbl_procedure { get; set; }
        public virtual DbSet<tblStaffModel> tbl_staff { get; set; }
        public virtual DbSet<tblImagesModel> tbl_images { get; set; }
        public virtual DbSet<tblDentistScheduleModel> tbl_dentist_schedule { get; set; }
        public virtual DbSet<tblPatientImageModel> tbl_patient_images { get; set; }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Configurations.Add(new tblAccountMap());
            modelBuilder.Configurations.Add(new tblAppointmentMap());
            modelBuilder.Configurations.Add(new tblBranchMap());
            modelBuilder.Configurations.Add(new tblDentistMap());
            modelBuilder.Configurations.Add(new tblAddAccountMap());
            modelBuilder.Configurations.Add(new tblFormMap());
            modelBuilder.Configurations.Add(new tblGenderMap());
            modelBuilder.Configurations.Add(new tblOwnerMap());
            modelBuilder.Configurations.Add(new tblPatientMap());
            modelBuilder.Configurations.Add(new tblPaymentMap());
            modelBuilder.Configurations.Add(new tblPostOpMap());
            modelBuilder.Configurations.Add(new tblProcedureMap());
            modelBuilder.Configurations.Add(new tblStaffMap());
            modelBuilder.Configurations.Add(new tblImagesMap());
            modelBuilder.Configurations.Add(new tblDentistScheduleMap());
            modelBuilder.Configurations.Add(new tblPatientImageMap());
        }
    }
}
