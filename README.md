# SmartFM – Fleet Management System

![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green)
![React](https://img.shields.io/badge/React-Vite-blue)
![Architecture](https://img.shields.io/badge/Architecture-Full--Stack-orange)

---

## Abstract

This document outlines the architecture, design, and implementation of **SmartFM**, a web-based Fleet Management System engineered to enhance operational transparency and supply chain visibility. Addressing key industry challenges such as real-time vehicle tracking, route monitoring, and multi-role data governance, SmartFM provides a unified platform built upon a modern, decoupled web architecture. Specifically, the system integrates a dynamic **React** single-page application (SPA) on the front-end with an asynchronous, event-driven **Node.js** RESTful API services layer on the back-end.

In order to accommodate diverse operational stakeholders, SmartFM features four role-tailored execution portals: an **Admin Configurator Portal** for system configurations, a **Dispatcher Control Center** to manage fleet telemetry, a **Driver Workspace** for field staff to handle route manifests, and a **Customer Portal** providing clients with live order tracking and financial insights. Furthermore, during the prototyping phase, dynamic mock data simulation engines were implemented to validate high-frequency telemetry streams—including GPS coordinates, speed metrics, geofence status, and automated alert logs—prior to physical IoT device integration. 

Consequently, system testing and architectural verification confirm that SmartFM successfully achieves efficient state management, strict role-based access control, and low-latency UI updates. Ultimately, the modular design and clean separation of concerns establish a scalable foundation fully prepared for future IoT hardware onboarding, predictive analytics, and cloud-based deployment.

---

## 1. Executive Summary & Project Introduction

**SmartFM** is an enterprise-grade, full-stack logistics management platform engineered to digitize and streamline end-to-end fleet operations. Built upon a decoupled architecture featuring a **Node.js/Express** RESTful API backend and a dynamic **React + Vite** single-page application (SPA) frontend, SmartFM provides operational transparency, real-time telemetry tracking, and seamless cross-role collaboration.

---

## 2. Business Scenario & Problem Statement

### The Problem Context
Modern mid-to-large-scale logistics enterprise operations face severe operational bottlenecks due to fragmented systems and legacy processes:
* **Fragmented Communication:** Dispatchers lack a unified, live visualization interface to monitor vehicle positions, leading to delayed incident responses and inefficient route management.
* **Operational Inefficiencies:** Field drivers rely on paper-based manifests and manual status updates, introducing data latency and high administrative overhead.
* **Opaque Customer Experience:** Enterprise clients have limited visibility into their active shipments, resulting in excessive support inquiries regarding order status, delivery verification, and financial invoicing.

### The SmartFM Solution
SmartFM resolves these operational gaps by establishing a centralized, data-driven system of record. By implementing Role-Based Access Control (RBAC) and asynchronous event-driven data streaming, the platform connects all operational stakeholders through dedicated, task-tailored execution portals.

---

## 3. Operational Workspaces (User Scenarios)

SmartFM categorizes system functionality into four distinct execution portals:

1. **Admin Configurator Portal:**
   * Empowers system administrators to configure system parameters, register vehicle assets, manage driver profiles, and set global operational thresholds.
2. **Dispatcher Control Center:**
   * Equips dispatchers with live telemetry visualization (GPS, speed metrics, geofence status), real-time driver tracking, and automated alert logs for incident response.
3. **Driver Mobile App:**
   * Provides field staff with a mobile-responsive interface to accept dispatch manifests, record milestone completions, log operational incidents, and update trip statuses in real time.
4. **Customer Billing & Tracking Portal:**
   * Offers enterprise clients self-service capabilities to track active shipment lifecycles, review order histories, and audit digital invoice records.

---

## 4. System Architecture & Project Structure

The platform adopts a lightweight JSON-based file persistence layer designed to execute complex, asynchronous relational join operations at the service layer, mimicking SQL-like joins over flat-file structures.

```text
Assignments/Assignment3/website/
├── server/          # Backend RESTful API Service (Express.js)
├── client/          # Frontend Web Application (React + Vite SPA)
└── database/data/   # Simulated Relational Storage (JSON Data Collections)