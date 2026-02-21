// FleetFlow Data Store — Centralized state management with mock data

export type VehicleType = "Truck" | "Van" | "Bike";
export type VehicleStatus = "Available" | "On Trip" | "In Shop" | "Retired";
export type DriverStatus = "On Duty" | "Off Duty" | "On Trip" | "Suspended";
export type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled";
export type UserRole = "Manager" | "Dispatcher" | "Safety Officer" | "Analyst";

export interface Vehicle {
  id: string;
  name: string;
  licensePlate: string;
  type: VehicleType;
  maxCapacity: number;
  odometer: number;
  status: VehicleStatus;
  region: string;
  lastService: string;
  acquisitionCost: number;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseCategories: VehicleType[];
  status: DriverStatus;
  safetyScore: number;
  tripsCompleted: number;
  joinDate: string;
  avatar: string;
}

export interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  origin: string;
  destination: string;
  cargoWeight: number;
  cargoDescription: string;
  status: TripStatus;
  createdAt: string;
  dispatchedAt?: string;
  completedAt?: string;
  startOdometer?: number;
  endOdometer?: number;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  type: string;
  description: string;
  cost: number;
  date: string;
  status: "Scheduled" | "In Progress" | "Completed";
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  tripId?: string;
  liters: number;
  cost: number;
  date: string;
}

// --- Mock Data ---

export const mockVehicles: Vehicle[] = [
  { id: "v1", name: "Freightliner M2", licensePlate: "FL-2847", type: "Truck", maxCapacity: 12000, odometer: 145200, status: "On Trip", region: "North", lastService: "2026-01-15", acquisitionCost: 85000 },
  { id: "v2", name: "Mercedes Sprinter", licensePlate: "SP-1093", type: "Van", maxCapacity: 1800, odometer: 67300, status: "Available", region: "East", lastService: "2026-02-01", acquisitionCost: 42000 },
  { id: "v3", name: "Ford Transit", licensePlate: "FT-5521", type: "Van", maxCapacity: 2200, odometer: 89100, status: "Available", region: "North", lastService: "2026-01-20", acquisitionCost: 38000 },
  { id: "v4", name: "Isuzu NPR", licensePlate: "IS-7764", type: "Truck", maxCapacity: 5500, odometer: 201300, status: "In Shop", region: "West", lastService: "2026-02-10", acquisitionCost: 55000 },
  { id: "v5", name: "Honda PCX 160", licensePlate: "HC-0412", type: "Bike", maxCapacity: 30, odometer: 12400, status: "Available", region: "Central", lastService: "2026-02-05", acquisitionCost: 4500 },
  { id: "v6", name: "Volvo FH16", licensePlate: "VL-9931", type: "Truck", maxCapacity: 25000, odometer: 312000, status: "On Trip", region: "South", lastService: "2025-12-28", acquisitionCost: 120000 },
  { id: "v7", name: "Peugeot Partner", licensePlate: "PG-3385", type: "Van", maxCapacity: 800, odometer: 45600, status: "Retired", region: "East", lastService: "2025-11-10", acquisitionCost: 28000 },
  { id: "v8", name: "Yamaha NMAX", licensePlate: "YM-6678", type: "Bike", maxCapacity: 25, odometer: 8900, status: "On Trip", region: "Central", lastService: "2026-01-30", acquisitionCost: 3800 },
];

export const mockDrivers: Driver[] = [
  { id: "d1", name: "Alex Mercer", email: "alex.m@fleet.io", phone: "+1-555-0101", licenseNumber: "DL-88421", licenseExpiry: "2027-06-15", licenseCategories: ["Truck", "Van"], status: "On Trip", safetyScore: 92, tripsCompleted: 214, joinDate: "2023-03-10", avatar: "AM" },
  { id: "d2", name: "Sarah Chen", email: "sarah.c@fleet.io", phone: "+1-555-0102", licenseNumber: "DL-55739", licenseExpiry: "2026-03-01", licenseCategories: ["Van", "Bike"], status: "On Duty", safetyScore: 97, tripsCompleted: 182, joinDate: "2023-07-22", avatar: "SC" },
  { id: "d3", name: "Marcus Johnson", email: "marcus.j@fleet.io", phone: "+1-555-0103", licenseNumber: "DL-91005", licenseExpiry: "2026-09-20", licenseCategories: ["Truck", "Van"], status: "On Trip", safetyScore: 85, tripsCompleted: 156, joinDate: "2024-01-05", avatar: "MJ" },
  { id: "d4", name: "Priya Patel", email: "priya.p@fleet.io", phone: "+1-555-0104", licenseNumber: "DL-33217", licenseExpiry: "2025-12-01", licenseCategories: ["Van"], status: "Off Duty", safetyScore: 78, tripsCompleted: 93, joinDate: "2024-06-18", avatar: "PP" },
  { id: "d5", name: "Tom Nakamura", email: "tom.n@fleet.io", phone: "+1-555-0105", licenseNumber: "DL-67842", licenseExpiry: "2027-11-30", licenseCategories: ["Bike"], status: "On Trip", safetyScore: 95, tripsCompleted: 310, joinDate: "2022-11-01", avatar: "TN" },
  { id: "d6", name: "Elena Vasquez", email: "elena.v@fleet.io", phone: "+1-555-0106", licenseNumber: "DL-12094", licenseExpiry: "2026-05-14", licenseCategories: ["Truck", "Van", "Bike"], status: "Suspended", safetyScore: 62, tripsCompleted: 45, joinDate: "2025-02-20", avatar: "EV" },
];

export const mockTrips: Trip[] = [
  { id: "t1", vehicleId: "v1", driverId: "d1", origin: "Warehouse A — Chicago", destination: "Distribution Center — Detroit", cargoWeight: 8500, cargoDescription: "Electronics Shipment", status: "Dispatched", createdAt: "2026-02-20T08:00:00", dispatchedAt: "2026-02-20T09:30:00", startOdometer: 145000 },
  { id: "t2", vehicleId: "v6", driverId: "d3", origin: "Port Terminal — Houston", destination: "Mega Depot — Dallas", cargoWeight: 22000, cargoDescription: "Steel Components", status: "Dispatched", createdAt: "2026-02-19T14:00:00", dispatchedAt: "2026-02-19T16:00:00", startOdometer: 311500 },
  { id: "t3", vehicleId: "v8", driverId: "d5", origin: "Local Hub — Central", destination: "Customer — 42 Elm St", cargoWeight: 12, cargoDescription: "Express Package", status: "Dispatched", createdAt: "2026-02-21T07:00:00", dispatchedAt: "2026-02-21T07:15:00", startOdometer: 8850 },
  { id: "t4", vehicleId: "v2", driverId: "d2", origin: "Fulfillment Center", destination: "Retail Store — Midtown", cargoWeight: 1200, cargoDescription: "Apparel Boxes", status: "Completed", createdAt: "2026-02-18T10:00:00", dispatchedAt: "2026-02-18T11:00:00", completedAt: "2026-02-18T15:30:00", startOdometer: 67000, endOdometer: 67280 },
  { id: "t5", vehicleId: "v3", driverId: "d1", origin: "Supplier Dock B", destination: "Assembly Plant", cargoWeight: 1900, cargoDescription: "Auto Parts", status: "Completed", createdAt: "2026-02-17T06:00:00", dispatchedAt: "2026-02-17T07:00:00", completedAt: "2026-02-17T12:00:00", startOdometer: 88700, endOdometer: 89050 },
  { id: "t6", vehicleId: "v5", driverId: "d5", origin: "Pharmacy Central", destination: "Clinic — Oak Ave", cargoWeight: 5, cargoDescription: "Medical Supplies", status: "Draft", createdAt: "2026-02-21T06:30:00" },
];

export const mockMaintenanceLogs: MaintenanceLog[] = [
  { id: "m1", vehicleId: "v4", type: "Engine Repair", description: "Replace timing belt and water pump", cost: 2800, date: "2026-02-10", status: "In Progress" },
  { id: "m2", vehicleId: "v1", type: "Oil Change", description: "Routine oil and filter change at 145k", cost: 320, date: "2026-01-15", status: "Completed" },
  { id: "m3", vehicleId: "v6", type: "Tire Rotation", description: "Rotate all 18 tires, replace 2 worn", cost: 4500, date: "2025-12-28", status: "Completed" },
  { id: "m4", vehicleId: "v2", type: "Brake Inspection", description: "Inspect pads and rotors, replace front pads", cost: 650, date: "2026-02-01", status: "Completed" },
  { id: "m5", vehicleId: "v3", type: "Scheduled Service", description: "90k km full service — filters, fluids, belt check", cost: 1100, date: "2026-02-22", status: "Scheduled" },
];

export const mockFuelLogs: FuelLog[] = [
  { id: "f1", vehicleId: "v1", tripId: "t1", liters: 180, cost: 324, date: "2026-02-20" },
  { id: "f2", vehicleId: "v6", tripId: "t2", liters: 420, cost: 756, date: "2026-02-19" },
  { id: "f3", vehicleId: "v2", tripId: "t4", liters: 35, cost: 63, date: "2026-02-18" },
  { id: "f4", vehicleId: "v3", tripId: "t5", liters: 42, cost: 75.6, date: "2026-02-17" },
  { id: "f5", vehicleId: "v8", tripId: "t3", liters: 4, cost: 7.2, date: "2026-02-21" },
  { id: "f6", vehicleId: "v5", liters: 3.5, cost: 6.3, date: "2026-02-15" },
  { id: "f7", vehicleId: "v1", liters: 190, cost: 342, date: "2026-02-12" },
  { id: "f8", vehicleId: "v6", liters: 400, cost: 720, date: "2026-02-08" },
];

// Helper functions
export function getVehicleById(id: string): Vehicle | undefined {
  return mockVehicles.find(v => v.id === id);
}

export function getDriverById(id: string): Driver | undefined {
  return mockDrivers.find(d => d.id === id);
}

export function isLicenseExpired(expiry: string): boolean {
  return new Date(expiry) < new Date();
}

export function isLicenseExpiringSoon(expiry: string, daysThreshold = 30): boolean {
  const expiryDate = new Date(expiry);
  const now = new Date();
  const diff = expiryDate.getTime() - now.getTime();
  return diff > 0 && diff < daysThreshold * 86400000;
}

export function getVehicleTotalCost(vehicleId: string): number {
  const fuel = mockFuelLogs.filter(f => f.vehicleId === vehicleId).reduce((s, f) => s + f.cost, 0);
  const maint = mockMaintenanceLogs.filter(m => m.vehicleId === vehicleId).reduce((s, m) => s + m.cost, 0);
  return fuel + maint;
}
