# NAMMA TRADE - Procurement & B2B Platform

A modern, full-stack procurement platform designed to connect Warehouses, Vendors, and Consumers in a seamless e-commerce ecosystem.

## 🚀 Overview

NAMMA TRADE streamlines the supply chain by providing dedicated portals for different users:
- **Administrators**: Global oversight of users, products, and system health.
- **Warehouse Managers**: Inventory tracking, procurement approval, and logistics coordination.
- **Vendors**: Product listing with MRP/MOP validation and order fulfillment.
- **Consumers**: Retail shopping with live tracking and order history.

## 🛠️ Technology Stack

- **Frontend**: Vite + React + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend/Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with Role-Based Access Control (RBAC)

## 📦 Getting Started

### Local Development

1. **Clone the repository**:
   ```sh
   git clone https://github.com/shyamspark19/NammaTrade002.git
   cd NammaTrade002
   ```

2. **Install dependencies**:
   ```sh
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env` file in the root and add your Supabase credentials:
   ```sh
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   ```

4. **Start the dev server**:
   ```sh
   npm run dev
   ```

## 🌐 Deployment

The project is configured for deployment on **Vercel** or **Netlify**:
- Use the provided `vercel.json` for Vercel SPA routing.
- Use `netlify.toml` and `_redirects` for Netlify SPA routing.

## 📄 License

Proprietary - NAMMA TRADE. All rights reserved.
