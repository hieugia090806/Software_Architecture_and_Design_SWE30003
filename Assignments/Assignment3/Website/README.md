# Fleet Navigator

"Please build a production-ready, full-stack web application based on my UI prototype ([https://typo-edit-07321687.figma.site/](https://typo-edit-07321687.figma.site/)) and Database Design ([https://dbdiagram.io/d/SmartFM-6a647bf3067336e1def103b2](https://dbdiagram.io/d/SmartFM-6a647bf3067336e1def103b2)).🏗️ 1. ARCHITECTURE & FOLDER STRUCTUREOrganize the React + TypeScript frontend codebase clearly using standard modular architecture:src/pages/login/ (Authentication & Dynamic Role Selection)src/pages/admin/ (Fleet Telemetry, GPS Map, Trip Allocation, Vehicle Registry, Incident Logs)src/pages/staff/ (Driver Execution Workspace, Task Checklist, Emergency Log Incident)src/pages/customer/ (Live Order Tracking, Stepper Timeline, Dynamic Freight Estimator)src/components/ (Shared UI components like Map, Sidebar, Navbar, Charts)src/services/ or supabase/ (Backend queries, mock data & SQL integration)🔐 2. AUTHENTICATION & MULTI-ROLE ROUTINGImplement role-based authentication with pre-configured mock credentials:Admin: admin@smartfm.com / admin123 $\rightarrow$ Redirects to /adminStaff: staff@smartfm.com / staff123 $\rightarrow$ Redirects to /staffCustomer: customer@smartfm.com / customer123 $\rightarrow$ Redirects to /customerCreate a Role Switcher / Quick Login Helper on the Login screen for easy testing.📊 3. FULL FUNCTIONALITY & REAL-TIME FEATURESInteractive Buttons & Forms: Make sure ALL buttons (e.g., Dispatch & Assign Trip, Log Incident, Register New Vehicle, Filter Alerts, Download Invoice) open working modals or trigger real state updates.Real-Time Visuals:Render active vehicle markers on the dark GPS map.Implement functional telemetry charts (Recharts) for Speed Distribution and Fleet Status Breakdown.Include functional live alerts stream (Overspeed, Geofence breach) that can be dismissed or reviewed.Database & Mock Data: Populate rich mock data matching the SmartFM schema from dbdiagram (Vehicles, Drivers, Orders, Telemetry Logs, Incidents).Ensure running npm run dev starts the entire unified application with seamless switching between all 3 role views."

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://smartdrive-logistics.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ca6eeee1-9d81-4f93-8800-f0a5eae90828).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
