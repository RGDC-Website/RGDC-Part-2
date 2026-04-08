using RGDC_Web_Application.Models.Context;
using System;
using System.Linq;
using System.Threading;
using System.Web.Hosting;

public class InactiveAccountCleaner : IRegisteredObject
{
    private static Timer _timer;
    private static readonly object _lock = new object();
    private const int PATIENT_ROLE = 3; // "3" = Patient based on your auth code
    private const int INACTIVE_YEARS = 10;

    public static void Start()
    {
        HostingEnvironment.RegisterObject(new InactiveAccountCleaner());

        // Run once on startup, then every 24 hours
        _timer = new Timer(Run, null, TimeSpan.Zero, TimeSpan.FromHours(24));
    }

    private static void Run(object state)
    {
        // Prevent overlapping runs
        if (!Monitor.TryEnter(_lock)) return;

        try
        {
            System.Diagnostics.Debug.WriteLine($"[InactiveAccountCleaner] Running at {DateTime.Now}");

            using (var db = new RGDCContext())
            {
                DateTime cutoff = DateTime.Now.AddYears(-INACTIVE_YEARS);

                var inactivePatients = db.tbl_patient
                    .Where(u =>
                        u.lastUpdated != null &&
                        u.lastUpdated <= cutoff)
                    .ToList();

                if (!inactivePatients.Any())
                {
                    System.Diagnostics.Debug.WriteLine("[InactiveAccountCleaner] No inactive patients found.");
                    return;
                }

                System.Diagnostics.Debug.WriteLine($"[InactiveAccountCleaner] Deleting {inactivePatients.Count} inactive patient(s).");

                foreach (var patient in inactivePatients)
                {
                    System.Diagnostics.Debug.WriteLine(
                        $"[InactiveAccountCleaner] Deleting: ID={patient.accID}, LastUpdated={patient.lastUpdated}");
                }

                db.tbl_patient.RemoveRange(inactivePatients);
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