import { useState } from "react";
import { useFleet } from "@/lib/fleet-store";
import { Vehicle, VehicleType, VehicleStatus } from "@/lib/fleet-data";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Truck, Gauge } from "lucide-react";
import { z } from "zod";

const vehicleSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  licensePlate: z.string().trim().min(1, "License plate is required").max(20),
  type: z.enum(["Truck", "Van", "Bike"]),
  maxCapacity: z.number().positive("Must be positive"),
  odometer: z.number().min(0),
  region: z.string().trim().min(1, "Region is required"),
  acquisitionCost: z.number().positive(),
});

export default function Vehicles() {
  const { vehicles, addVehicle, updateVehicle } = useFleet();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", licensePlate: "", type: "Van" as VehicleType, maxCapacity: 0, odometer: 0, region: "", acquisitionCost: 0 });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = vehicles.filter(v => {
    if (filterType !== "all" && v.type !== filterType) return false;
    if (filterStatus !== "all" && v.status !== filterStatus) return false;
    if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.licensePlate.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAdd = () => {
    const result = vehicleSchema.safeParse(form);
    if (!result.success) {
      const fe: Record<string, string> = {};
      result.error.issues.forEach(i => { fe[i.path[0] as string] = i.message; });
      setErrors(fe);
      return;
    }
    // Check unique plate
    if (vehicles.some(v => v.licensePlate === form.licensePlate)) {
      setErrors({ licensePlate: "License plate already exists" });
      return;
    }
    setErrors({});
    addVehicle({ ...form, status: "Available", lastService: new Date().toISOString().split("T")[0] });
    setForm({ name: "", licensePlate: "", type: "Van", maxCapacity: 0, odometer: 0, region: "", acquisitionCost: 0 });
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehicle Registry</h1>
          <p className="text-sm text-muted-foreground">{vehicles.length} assets registered</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Vehicle</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Register New Vehicle</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              {([ 
                { key: "name", label: "Name / Model", placeholder: "Ford Transit" },
                { key: "licensePlate", label: "License Plate", placeholder: "XX-0000" },
                { key: "region", label: "Region", placeholder: "North" },
              ] as const).map(f => (
                <div key={f.key} className="space-y-1">
                  <Label>{f.label}</Label>
                  <Input placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className={errors[f.key] ? "border-destructive" : ""} />
                  {errors[f.key] && <p className="text-xs text-destructive">{errors[f.key]}</p>}
                </div>
              ))}
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v as VehicleType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Truck">Truck</SelectItem>
                    <SelectItem value="Van">Van</SelectItem>
                    <SelectItem value="Bike">Bike</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { key: "maxCapacity", label: "Max Capacity (kg)" },
                  { key: "odometer", label: "Odometer (km)" },
                  { key: "acquisitionCost", label: "Acquisition Cost ($)" },
                ] as const).map(f => (
                  <div key={f.key} className="space-y-1">
                    <Label>{f.label}</Label>
                    <Input type="number" value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: Number(e.target.value) }))} className={errors[f.key] ? "border-destructive" : ""} />
                    {errors[f.key] && <p className="text-xs text-destructive">{errors[f.key]}</p>}
                  </div>
                ))}
              </div>
              <Button onClick={handleAdd} className="w-full">Register Vehicle</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search vehicles..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-64" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Truck">Truck</SelectItem>
            <SelectItem value="Van">Van</SelectItem>
            <SelectItem value="Bike">Bike</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Available">Available</SelectItem>
            <SelectItem value="On Trip">On Trip</SelectItem>
            <SelectItem value="In Shop">In Shop</SelectItem>
            <SelectItem value="Retired">Retired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vehicle</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plate</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Capacity</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Odometer</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Region</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(v => (
              <tr key={v.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium">{v.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{v.licensePlate}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                    {v.type}
                  </span>
                </td>
                <td className="px-4 py-3">{v.maxCapacity.toLocaleString()} kg</td>
                <td className="px-4 py-3 font-mono text-xs">{v.odometer.toLocaleString()} km</td>
                <td className="px-4 py-3">{v.region}</td>
                <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                <td className="px-4 py-3">
                  {v.status !== "Retired" && (
                    <Button variant="ghost" size="sm" onClick={() => updateVehicle(v.id, { status: "Retired" })} className="text-xs text-muted-foreground hover:text-destructive">
                      Retire
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No vehicles match your filters</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
