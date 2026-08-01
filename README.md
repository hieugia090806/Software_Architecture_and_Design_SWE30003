
🚚 SmartFM – Fleet Management System
SmartFM is a full‑stack logistics management project built with Node.js/Express for the backend and React + Vite for the frontend.
It provides enriched REST APIs for trips, invoices, customers, and drivers, and a modern UI for dispatch, admin, driver, and billing portals.

📦 Prerequisites
Install Node.js (v18+ recommended)

Install npm (comes with Node.js)

Clone the repository:

bash
git clone https://github.com/hieugia090806/Software_Architecture_and_Design_SWE30003.git
cd Software_Architecture_and_Design_SWE30003/Assignments/Assignment3/Website
⚙️ Backend Setup (Express Server)
Navigate to the server folder:

bash
cd server
Install dependencies:

bash
npm install
Start the development server:

bash
npm run dev
The backend runs at:

Code
http://localhost:5000
Example endpoints:

http://localhost:5000/api/enriched/trips

http://localhost:5000/api/enriched/invoices

http://localhost:5000/api/enriched/customers

http://localhost:5000/api/enriched/drivers

🎨 Frontend Setup (React + Vite)
Open a new terminal and navigate to the client folder:

bash
cd client
Install dependencies:

bash
npm install
Start the Vite dev server:

bash
npm run dev
The frontend runs at:

Code
http://localhost:5173
🔗 Typical Workflow
Start backend (npm run dev in /server)

Start frontend (npm run dev in /client)

Visit http://localhost:5173 in your browser

The frontend will call backend APIs at http://localhost:5000