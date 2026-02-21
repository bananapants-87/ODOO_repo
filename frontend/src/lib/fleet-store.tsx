import React, { createContext, useContext, useState, useCallback } from "react";
import {
  Vehicle, Driver, Trip, MaintenanceLog, FuelLog, UserRole,
  mockVehicles, mockDrivers, mockTrips, mockMaintenanceLogs, mockFuelLogs,
} from "./fleet-data";

interface FleetState {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenanceLogs: MaintenanceLog[];
  fuelLogs: FuelLog[];
  currentUser: { name: string; role: UserRole; email: string } | null;
  login: (email: string, password: string, role: UserRole) => boolean;
  logout: () => void;
  addVehicle: (v: Omit<Vehicle, "id">) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  addDriver: (d: Omit<Driver, "id">) => void;
  updateDriver: (id: string, updates: Partial<Driver>) => void;
  addTrip: (t: Omit<Trip, "id">) => void;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  addMaintenanceLog: (m: Omit<MaintenanceLog, "id">) => void;
  addFuelLog: (f: Omit<FuelLog, "id">) => void;
}

const FleetContext = createContext<FleetState | null>(null);

export function FleetProvider({ children }: { children: React.ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [drivers, setDrivers] = useState<Driver[]>(mockDrivers);
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>(mockMaintenanceLogs);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(mockFuelLogs);
  const [currentUser, setCurrentUser] = useState<FleetState["currentUser"]>(null);

  const login = useCallback((email: string, _password: string, role: UserRole) => {
    setCurrentUser({ name: email.split("@")[0], role, email });
    return true;
  }, []);

  const logout = useCallback(() => setCurrentUser(null), []);

  const addVehicle = useCallback((v: Omit<Vehicle, "id">) => {
    setVehicles(prev => [...prev, { ...v, id: `v${Date.now()}` }]);
  }, []);

  const updateVehicle = useCallback((id: string, updates: Partial<Vehicle>) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  }, []);

  const addDriver = useCallback((d: Omit<Driver, "id">) => {
    setDrivers(prev => [...prev, { ...d, id: `d${Date.now()}` }]);
  }, []);

  const updateDriver = useCallback((id: string, updates: Partial<Driver>) => {
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  }, []);

  const addTrip = useCallback((t: Omit<Trip, "id">) => {
    const trip = { ...t, id: `t${Date.now()}` };
    setTrips(prev => [...prev, trip]);
    // Update vehicle and driver status
    if (t.status === "Dispatched") {
      setVehicles(prev => prev.map(v => v.id === t.vehicleId ? { ...v, status: "On Trip" as const } : v));
      setDrivers(prev => prev.map(d => d.id === t.driverId ? { ...d, status: "On Trip" as const } : d));
    }
  }, []);

  const updateTrip = useCallback((id: string, updates: Partial<Trip>) => {
    setTrips(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      const trip = updated.find(t => t.id === id);
      if (trip && updates.status === "Completed") {
        setVehicles(vPrev => vPrev.map(v => v.id === trip.vehicleId ? { ...v, status: "Available" as const, odometer: updates.endOdometer ?? v.odometer } : v));
        setDrivers(dPrev => dPrev.map(d => d.id === trip.driverId ? { ...d, status: "On Duty" as const, tripsCompleted: d.tripsCompleted + 1 } : d));
      }
      if (trip && updates.status === "Cancelled") {
        setVehicles(vPrev => vPrev.map(v => v.id === trip.vehicleId ? { ...v, status: "Available" as const } : v));
        setDrivers(dPrev => dPrev.map(d => d.id === trip.driverId ? { ...d, status: "On Duty" as const } : d));
      }
      return updated;
    });
  }, []);

  const addMaintenanceLog = useCallback((m: Omit<MaintenanceLog, "id">) => {
    setMaintenanceLogs(prev => [...prev, { ...m, id: `m${Date.now()}` }]);
    if (m.status === "In Progress") {
      setVehicles(prev => prev.map(v => v.id === m.vehicleId ? { ...v, status: "In Shop" as const } : v));
    }
  }, []);

  const addFuelLog = useCallback((f: Omit<FuelLog, "id">) => {
    setFuelLogs(prev => [...prev, { ...f, id: `f${Date.now()}` }]);
  }, []);

  return (
    <FleetContext.Provider value={{
      vehicles, drivers, trips, maintenanceLogs, fuelLogs, currentUser,
      login, logout, addVehicle, updateVehicle, addDriver, updateDriver,
      addTrip, updateTrip, addMaintenanceLog, addFuelLog,
    }}>
      {children}
    </FleetContext.Provider>
  );
}

export function useFleet() {
  const ctx = useContext(FleetContext);
  if (!ctx) throw new Error("useFleet must be used within FleetProvider");
  return ctx;
}
