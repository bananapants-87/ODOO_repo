import { useFleet } from "@/lib/fleet-store";
import { getVehicleTotalCost } from "@/lib/fleet-data";
import { KPICard } from "@/components/KPICard";
import { DollarSign, Fuel, TrendingUp, Wrench } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function Analytics() {
  const { vehicles, trips, fuelLogs, maintenanceLogs } = useFleet();

  const totalFuel = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const totalMaint = maintenanceLogs.reduce((s, m) => s + m.cost, 0);
  const completedTrips = trips.filter(t => t.status === "Completed");
  const totalKm = completedTrips.reduce((s, t) => s + ((t.endOdometer ?? 0) - (t.startOdometer ?? 0)), 0);
  const totalLiters = fuelLogs.reduce((s, f) => s + f.liters, 0);
  const efficiency = totalLiters > 0 ? (totalKm / totalLiters).toFixed(1) : "N/A";

  const vehicleROI = vehicles.filter(v => v.status !== "Retired").map(v => {
    const cost = getVehicleTotalCost(v.id);
    const roi = v.acquisitionCost > 0 ? ((0 - cost) / v.acquisitionCost * 100).toFixed(1) : "0";
    return { name: v.licensePlate, cost, acquisition: v.acquisitionCost, roi: Number(roi) };
  });

  const costTrend = [
    { month: "Oct", fuel: 980, maintenance: 450 },
    { month: "Nov", fuel: 1120, maintenance: 800 },
    { month: "Dec", fuel: 1050, maintenance: 320 },
    { month: "Jan", fuel: 1300, maintenance: 1100 },
    { month: "Feb", fuel: totalFuel, maintenance: totalMaint },
  ];

  const chartTooltipStyle = {
    contentStyle: { background: "hsl(220, 22%, 11%)", border: "1px solid hsl(220, 16%, 18%)", borderRadius: 8, color: "hsl(210, 20%, 92%)", fontSize: 12 },
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Operational Analytics</h1>
        <p className="text-sm text-muted-foreground">Financial reports and fleet performance metrics</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Fuel Cost" value={`$${totalFuel.toLocaleString()}`} icon={Fuel} variant="primary" />
        <KPICard title="Total Maintenance" value={`$${totalMaint.toLocaleString()}`} icon={Wrench} />
        <KPICard title="Fuel Efficiency" value={`${efficiency} km/L`} icon={TrendingUp} variant="accent" />
        <KPICard title="Total OpCost" value={`$${(totalFuel + totalMaint).toLocaleString()}`} icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold">Cost Trend (Last 5 Months)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={costTrend}>
              <XAxis dataKey="month" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip {...chartTooltipStyle} />
              <Line type="monotone" dataKey="fuel" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 4 }} name="Fuel" />
              <Line type="monotone" dataKey="maintenance" stroke="hsl(174, 62%, 42%)" strokeWidth={2} dot={{ r: 4 }} name="Maintenance" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold">Operational Cost by Vehicle</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={vehicleROI}>
              <XAxis dataKey="name" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="cost" name="OpCost" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vehicle ROI Table */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold">Vehicle Financial Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Vehicle</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Acquisition</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Total OpCost</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Cost Ratio</th>
              </tr>
            </thead>
            <tbody>
              {vehicleROI.map(v => (
                <tr key={v.name} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-xs">{v.name}</td>
                  <td className="px-4 py-2.5 text-right">${v.acquisition.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-medium">${v.cost.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={v.cost / v.acquisition > 0.15 ? "text-destructive" : "text-success"}>
                      {(v.cost / v.acquisition * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
