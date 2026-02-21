import { useFleet } from "@/lib/fleet-store";
import { KPICard } from "@/components/KPICard";
import { StatusBadge } from "@/components/StatusBadge";
import { getVehicleById, getDriverById } from "@/lib/fleet-data";
import { Truck, AlertTriangle, Gauge, Package, Users, Route, TrendingUp, Fuel } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const CHART_COLORS = ["hsl(38, 92%, 50%)", "hsl(174, 62%, 42%)", "hsl(210, 80%, 55%)", "hsl(0, 72%, 51%)"];

export default function Dashboard() {
  const { vehicles, drivers, trips, fuelLogs, maintenanceLogs } = useFleet();

  const activeFleet = vehicles.filter(v => v.status === "On Trip").length;
  const inShop = vehicles.filter(v => v.status === "In Shop").length;
  const available = vehicles.filter(v => v.status === "Available").length;
  const utilization = Math.round((activeFleet / vehicles.filter(v => v.status !== "Retired").length) * 100);
  const pendingTrips = trips.filter(t => t.status === "Draft").length;

  const typeData = [
    { name: "Truck", value: vehicles.filter(v => v.type === "Truck").length },
    { name: "Van", value: vehicles.filter(v => v.type === "Van").length },
    { name: "Bike", value: vehicles.filter(v => v.type === "Bike").length },
  ];

  const fuelByVehicle = vehicles.slice(0, 5).map(v => ({
    name: v.licensePlate,
    fuel: fuelLogs.filter(f => f.vehicleId === v.id).reduce((s, f) => s + f.cost, 0),
    maintenance: maintenanceLogs.filter(m => m.vehicleId === v.id).reduce((s, m) => s + m.cost, 0),
  }));

  const recentTrips = [...trips].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
        <p className="text-sm text-muted-foreground">Fleet overview for {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Active Fleet" value={activeFleet} subtitle={`${available} available`} icon={Truck} variant="primary" trend={{ value: 12, label: "vs last week" }} />
        <KPICard title="Maintenance Alerts" value={inShop} subtitle="vehicles in shop" icon={AlertTriangle} variant={inShop > 0 ? "default" : "accent"} />
        <KPICard title="Utilization Rate" value={`${utilization}%`} subtitle="assigned vs idle" icon={Gauge} variant="accent" trend={{ value: 5, label: "vs last month" }} />
        <KPICard title="Pending Cargo" value={pendingTrips} subtitle="awaiting dispatch" icon={Package} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Cost Breakdown */}
        <div className="col-span-2 rounded-lg border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold">Operational Costs by Vehicle</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={fuelByVehicle} barGap={2}>
              <XAxis dataKey="name" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{ background: "hsl(220, 22%, 11%)", border: "1px solid hsl(220, 16%, 18%)", borderRadius: 8, color: "hsl(210, 20%, 92%)", fontSize: 12 }}
              />
              <Bar dataKey="fuel" name="Fuel" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="maintenance" name="Maintenance" fill="hsl(174, 62%, 42%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fleet Composition */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold">Fleet Composition</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                {typeData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(220, 22%, 11%)", border: "1px solid hsl(220, 16%, 18%)", borderRadius: 8, color: "hsl(210, 20%, 92%)", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs">
            {typeData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i] }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Trips + Quick Stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="col-span-2 rounded-lg border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold">Recent Trips</h3>
          <div className="space-y-3">
            {recentTrips.map(trip => {
              const vehicle = getVehicleById(trip.vehicleId);
              const driver = getDriverById(trip.driverId);
              return (
                <div key={trip.id} className="flex items-center justify-between rounded-md bg-muted/50 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Route className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{trip.origin} → {trip.destination}</p>
                      <p className="text-xs text-muted-foreground">{vehicle?.licensePlate} • {driver?.name} • {trip.cargoWeight}kg</p>
                    </div>
                  </div>
                  <StatusBadge status={trip.status} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold">Driver Status</h3>
            <div className="space-y-2">
              {drivers.slice(0, 4).map(d => (
                <div key={d.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold">{d.avatar}</div>
                    <span className="text-sm">{d.name}</span>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-primary/20 bg-card p-5 animate-pulse-glow">
            <div className="flex items-center gap-2 text-primary">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-semibold">Fleet Health</span>
            </div>
            <p className="mt-2 text-3xl font-bold">{Math.round(((vehicles.length - inShop) / vehicles.length) * 100)}%</p>
            <p className="text-xs text-muted-foreground">Operational readiness</p>
          </div>
        </div>
      </div>
    </div>
  );
}
