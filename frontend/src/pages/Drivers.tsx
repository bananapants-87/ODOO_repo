import { useFleet } from "@/lib/fleet-store";
import { isLicenseExpired, isLicenseExpiringSoon } from "@/lib/fleet-data";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Calendar, Award } from "lucide-react";

export default function Drivers() {
  const { drivers, updateDriver } = useFleet();

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Driver Profiles</h1>
        <p className="text-sm text-muted-foreground">Performance, compliance, and safety management</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {drivers.map(driver => {
          const expired = isLicenseExpired(driver.licenseExpiry);
          const expiringSoon = isLicenseExpiringSoon(driver.licenseExpiry);
          return (
            <div key={driver.id} className="rounded-lg border border-border bg-card p-5 space-y-4 hover:border-muted-foreground/30 transition-colors">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                    {driver.avatar}
                  </div>
                  <div>
                    <p className="font-semibold">{driver.name}</p>
                    <p className="text-xs text-muted-foreground">{driver.email}</p>
                  </div>
                </div>
                <StatusBadge status={driver.status} />
              </div>

              {/* License */}
              <div className={`rounded-md px-3 py-2 text-xs ${
                expired ? "bg-destructive/10 border border-destructive/30 text-destructive" :
                expiringSoon ? "bg-warning/10 border border-warning/30 text-warning" :
                "bg-muted text-muted-foreground"
              }`}>
                <div className="flex items-center gap-1.5">
                  {expired ? <AlertTriangle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                  <span className="font-medium">
                    License {driver.licenseNumber} — {expired ? "EXPIRED" : expiringSoon ? "Expiring Soon" : `Valid until ${driver.licenseExpiry}`}
                  </span>
                </div>
                <p className="mt-1">Categories: {driver.licenseCategories.join(", ")}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-muted p-2">
                  <p className="text-lg font-bold">{driver.safetyScore}</p>
                  <p className="text-xs text-muted-foreground">Safety</p>
                </div>
                <div className="rounded-md bg-muted p-2">
                  <p className="text-lg font-bold">{driver.tripsCompleted}</p>
                  <p className="text-xs text-muted-foreground">Trips</p>
                </div>
                <div className="rounded-md bg-muted p-2">
                  <div className="flex items-center justify-center gap-1">
                    <Award className={`h-4 w-4 ${driver.safetyScore >= 90 ? "text-primary" : driver.safetyScore >= 75 ? "text-accent" : "text-destructive"}`} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {driver.safetyScore >= 90 ? "Gold" : driver.safetyScore >= 75 ? "Silver" : "At Risk"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {driver.status !== "Suspended" ? (
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => updateDriver(driver.id, { status: "Suspended" })}>
                    Suspend
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => updateDriver(driver.id, { status: "On Duty" })}>
                    Reinstate
                  </Button>
                )}
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => updateDriver(driver.id, { status: driver.status === "On Duty" ? "Off Duty" : "On Duty" })}>
                  Toggle Duty
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
