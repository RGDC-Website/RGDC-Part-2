using RGDC_Web_Application.Models.Context;
using System;
using System.Linq;
using System.Threading;
using System.Web.Hosting;

public class InactiveAccountCleaner : IRegisteredObject
{
    private static Timer _timer;
    private static readonly object _lock = new object();
    private const int INACTIVE_YEARS = 10;

    public static void Start()
    {
        HostingEnvironment.RegisterObject(new InactiveAccountCleaner());
        _timer = new Timer(Run, null, TimeSpan.Zero, TimeSpan.FromHours(24));
    }

    private static void Run(object state)
    {
        if (!Monitor.TryEnter(_lock)) return;

        try
        {
            System.Diagnostics.Debug.WriteLine($"[InactiveAccountCleaner] Running at {DateTime.Now}");

            using (var db = new RGDCContext())
            {
                DateTime cutoff = DateTime.Now.AddYears(-INACTIVE_YEARS);
                var inactiveAccounts = db.tbl_patient
                    .Where(p =>
                        p.lastUpdated != null &&
                        p.lastUpdated <= cutoff)
                    .Join(db.tbl_account,
                        patient => patient.accID,
                        account => account.accID,
                        (patient, account) => new { patient, account })
                    .ToList();

                if (!inactiveAccounts.Any())
                {
                    System.Diagnostics.Debug.WriteLine("[InactiveAccountCleaner] No inactive patients found.");
                    return;
                }

                System.Diagnostics.Debug.WriteLine($"[InactiveAccountCleaner] Archiving {inactiveAccounts.Count} inactive patient(s).");

                foreach (var item in inactiveAccounts)
                {
                    System.Diagnostics.Debug.WriteLine(
                        $"[InactiveAccountCleaner] Archiving: ID={item.patient.accID}, LastUpdated={item.patient.lastUpdated}");
                    item.account.isArchived = 1;
                }

                db.SaveChanges();
                System.Diagnostics.Debug.WriteLine("[InactiveAccountCleaner] Done.");
            }
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"[InactiveAccountCleaner] Error: {ex.Message}");
        }
        finally
        {
            Monitor.Exit(_lock);
        }
    }

    public void Stop(bool immediate)
    {
        _timer?.Dispose();
        HostingEnvironment.UnregisterObject(this);
    }
}