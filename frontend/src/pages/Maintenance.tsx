import { useState } from "react";
import { useFleet } from "@/lib/fleet-store";
import { getVehicleById } from "@/lib/fleet-data";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Wrench } from "lucide-react";
import { toast } from "sonner";

export default function Maintenance() {
  const { maintenanceLogs, vehicles, addMaintenanceLog } = useFleet();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ vehicleId: "", type: "", description: "", cost: 0, status: "Scheduled" as "Scheduled" | "In Progress" | "Completed" });

  const handleAdd = () => {
    if (!form.vehicleId || !form.type || !form.description || form.cost <= 0) {
      toast.error("All fields are required");
      return;
    }
    addMaintenanceLog({ ...form, date: new Date().toISOString().split("T")[0] });
    toast.success(form.status === "In Progress" ? "Vehicle moved to In Shop status" : "Maintenance log added");
    setForm({ vehicleId: "", type: "", description: "", cost: 0, status: "Scheduled" });
    setDialogOpen(false);
  };

  const sorted = [...maintenanceLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maintenance & Service</h1>
          <p className="text-sm text-muted-foreground">Preventative and reactive fleet health tracking</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Log Service</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>New Service Log</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label>Vehicle</Label>
                <Select value={form.vehicleId} onValueChange={v => setForm(p => ({ ...p, vehicleId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                  <SelectContent>
                    {vehicles.filter(v => v.status !== "Retired").map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.licensePlate} — {v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Service Type</Label>
                <Input placeholder="Oil Change, Tire Rotation..." value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Input placeholder="Details of the service" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Estimated Cost ($)</Label>
                  <Input type="number" value={form.cost || ""} onChange={e => setForm(p => ({ ...p, cost: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as typeof form.status }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.status === "In Progress" && (
                <p className="text-xs text-warning">⚠ Setting status to "In Progress" will move the vehicle to "In Shop" and remove it from dispatch availability.</p>
              )}
              <Button onClick={handleAdd} className="w-full">Add Service Log</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Logs */}
      <div className="space-y-3">
        {sorted.map(log => {
          const vehicle = getVehicleById(log.vehicleId);
          return (
            <div key={log.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4 hover:border-muted-foreground/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Wrench className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">{log.type}</p>
                  <p className="text-xs text-muted-foreground">{vehicle?.licensePlate} ({vehicle?.name}) • {log.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-mono font-medium">${log.cost.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">{log.date}</span>
                <StatusBadge status={log.status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
