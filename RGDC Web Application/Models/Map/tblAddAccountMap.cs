using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace RGDC_Web_Application.Models.Map
{
    public class tblAddAccountMap : EntityTypeConfiguration<tblAddAccountModel>
    {
        public tblAddAccountMap()
        {
            HasKey(t => t.addID);
            ToTable("tbl_addAccount");
            ToTable("tbl_addAccount");
        }
    }
}