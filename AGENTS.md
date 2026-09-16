# Watch Club Omnichannel Loyalty System

## Project Context
This is an enterprise-grade omnichannel loyalty and Loyalty system for Watch Club Indonesia (40+ Stores). 
The application has transitioned from a simple HTML/CSS/JS frontend to a full-stack React + Vite + Tailwind CSS application with Firebase Firestore integration for real-time data sync.

## Portals
1. **Customer PWA (Member Portal)**: Displays tier, points, QR code for scanning, gamification (confetti), and profile picture upload (canvas compression).
2. **Cashier Interface**: Includes a QR scanner interface, points issuance, voucher redemption, and real-time member lookup.
3. **Head Office (Admin) Dashboard**: Restricted portal for managing all transactions, members, stores, tiers, and vouchers. Features CSV exports, Recharts analytics, and an Immutable Audit Trail.

## Guidelines
- Maintain strict modularity (components, hooks, types).
- Use Tailwind CSS for all styling (avoid custom CSS files).
- Prefer Firestore real-time listeners (`onSnapshot`) for critical data like point balances.
- Follow a single-page app structure with smooth state-based portal switching.
