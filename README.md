SmartFM – Fleet Management System
SmartFM is a full‑stack logistics management project built with Node.js/Express for the backend and React + Vite for the frontend.
It simulates a fleet operations platform with modules for Admin Configurator, Dispatcher Center, Driver App, and Customer Billing Portal.
The backend uses JSON files as a lightweight database and provides enriched REST APIs that behave like SQL joins.

Requirements
Before running locally, ensure you have:

Node.js version 18 or newer

npm (comes bundled with Node.js)

Git (to clone the repository)

Project Structure
Code
Website/
├── server/        # Backend (Express + file persistence)
├── client/        # Frontend (React + Vite)
└── database/data/ # JSON files acting as database tables
Backend Setup (Express Server)
Open a terminal and navigate to the server folder:

bash
cd Website/server
Install dependencies:

bash
npm install
Start the backend server:

bash
npm run dev
The backend runs at:

Code
http://localhost:5000
Example backend endpoints
Trips (enriched with orders, vehicles, drivers, telemetry, incidents):
http://localhost:5000/api/enriched/trips

Invoices (enriched with orders, customers, transactions):
http://localhost:5000/api/enriched/invoices

Customers (enriched with orders and invoices):
http://localhost:5000/api/enriched/customers

Drivers (enriched with user and trips):
http://localhost:5000/api/enriched/drivers

Frontend Setup (React + Vite)
Open a new terminal and navigate to the client folder:

bash
cd Website/client
Install dependencies:

bash
npm install
Start the frontend dev server:

bash
npm run dev
The frontend runs at:

Code
http://localhost:5173
Running the Project
Start backend (npm run dev inside /server)

Start frontend (npm run dev inside /client)

Open http://localhost:5173 in your browser

The frontend will call backend APIs at http://localhost:5000
