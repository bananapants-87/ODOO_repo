import { useState } from "react";
import { useFleet } from "@/lib/fleet-store";
import { getVehicleById, getDriverById, isLicenseExpired, TripStatus } from "@/lib/fleet-data";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, AlertCircle, Route, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function Trips() {
  const { trips, vehicles, drivers, addTrip, updateTrip } = useFleet();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ vehicleId: "", driverId: "", origin: "", destination: "", cargoWeight: 0, cargoDescription: "" });
  const [validationError, setValidationError] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const availableVehicles = vehicles.filter(v => v.status === "Available");
  const availableDrivers = drivers.filter(d => d.status === "On Duty" || d.status === "Off Duty");

  const selectedVehicle = form.vehicleId ? getVehicleById(form.vehicleId) : undefined;
  const selectedDriver = form.driverId ? drivers.find(d => d.id === form.driverId) : undefined;

  const handleCreate = () => {
    if (!form.vehicleId || !form.driverId || !form.origin || !form.destination || form.cargoWeight <= 0) {
      setValidationError("All fields are required and cargo weight must be positive.");
      return;
    }
    if (selectedVehicle && form.cargoWeight > selectedVehicle.maxCapacity) {
      setValidationError(`Cargo weight (${form.cargoWeight}kg) exceeds vehicle capacity (${selectedVehicle.maxCapacity}kg).`);
      return;
    }
    if (selectedDriver && isLicenseExpired(selectedDriver.licenseExpiry)) {
      setValidationError(`Driver ${selectedDriver.name}'s license has expired. Cannot assign.`);
      return;
    }
    if (selectedDriver && selectedVehicle && !selectedDriver.licenseCategories.includes(selectedVehicle.type)) {
      setValidationError(`Driver ${selectedDriver.name} is not licensed for ${selectedVehicle.type} vehicles.`);
      return;
    }

    setValidationError("");
    addTrip({
      ...form,
      status: "Draft",
      createdAt: new Date().toISOString(),
    });
    toast.success("Trip created successfully");
    setForm({ vehicleId: "", driverId: "", origin: "", destination: "", cargoWeight: 0, cargoDescription: "" });
    setDialogOpen(false);
  };

  const handleDispatch = (tripId: string) => {
    updateTrip(tripId, { status: "Dispatched", dispatchedAt: new Date().toISOString() });
    // Also update vehicle/driver to On Trip via store logic
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      toast.success("Trip dispatched!");
    }
  };

  const handleComplete = (tripId: string) => {
    updateTrip(tripId, { status: "Completed", completedAt: new Date().toISOString() });
    toast.success("Trip completed!");
  };

  const filtered = trips.filter(t => filterStatus === "all" || t.status === filterStatus)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trip Dispatcher</h1>
          <p className="text-sm text-muted-foreground">Create and manage delivery trips</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Create Trip</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Create New Trip</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Vehicle</Label>
                  <Select value={form.vehicleId} onValueChange={v => setForm(p => ({ ...p, vehicleId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                    <SelectContent>
                      {availableVehicles.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.licensePlate} — {v.name} ({v.maxCapacity}kg)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Driver</Label>
                  <Select value={form.driverId} onValueChange={v => setForm(p => ({ ...p, driverId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                    <SelectContent>
                      {availableDrivers.map(d => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name} {isLicenseExpired(d.licenseExpiry) ? "⚠️ Expired" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Origin</Label>
                  <Input placeholder="Warehouse A" value={form.origin} onChange={e => setForm(p => ({ ...p, origin: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Destination</Label>
                  <Input placeholder="Distribution Center B" value={form.destination} onChange={e => setForm(p => ({ ...p, destination: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Cargo Weight (kg)</Label>
                  <Input type="number" value={form.cargoWeight || ""} onChange={e => setForm(p => ({ ...p, cargoWeight: Number(e.target.value) }))} />
                  {selectedVehicle && (
                    <p className={`text-xs ${form.cargoWeight > selectedVehicle.maxCapacity ? "text-destructive" : "text-muted-foreground"}`}>
                      Max: {selectedVehicle.maxCapacity.toLocaleString()} kg
                      {form.cargoWeight > 0 && ` (${Math.round(form.cargoWeight / selectedVehicle.maxCapacity * 100)}% loaded)`}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Cargo Description</Label>
                  <Input placeholder="Electronics" value={form.cargoDescription} onChange={e => setForm(p => ({ ...p, cargoDescription: e.target.value }))} />
                </div>
              </div>
              {validationError && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {validationError}
                </div>
              )}
              <Button onClick={handleCreate} className="w-full">Create Trip</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "Draft", "Dispatched", "Completed", "Cancelled"] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filterStatus === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "all" ? "All" : s}
          </button>
        ))}
      </div>

      {/* Trip Cards */}
      <div className="space-y-3">
        {filtered.map(trip => {
          const vehicle = getVehicleById(trip.vehicleId);
          const driver = getDriverById(trip.driverId);
          return (
            <div key={trip.id} className="rounded-lg border border-border bg-card p-4 hover:border-muted-foreground/30 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Route className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{trip.origin} → {trip.destination}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {vehicle?.licensePlate} ({vehicle?.name}) • {driver?.name} • {trip.cargoWeight}kg — {trip.cargoDescription}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Created {new Date(trip.createdAt).toLocaleString()}
                      {trip.dispatchedAt && ` • Dispatched ${new Date(trip.dispatchedAt).toLocaleString()}`}
                      {trip.completedAt && ` • Completed ${new Date(trip.completedAt).toLocaleString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={trip.status} />
                  {trip.status === "Draft" && (
                    <Button size="sm" onClick={() => handleDispatch(trip.id)}>Dispatch</Button>
                  )}
                  {trip.status === "Dispatched" && (
                    <Button size="sm" variant="outline" onClick={() => handleComplete(trip.id)}>
                      <CheckCircle className="mr-1 h-3 w-3" /> Complete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">No trips match your filter</div>
        )}
      </div>
    </div>
  );
}
