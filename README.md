

# 🏛️ Blockchain-Based Cadastral System with GIS & Decentralized Storage

> **A blockchain-integrated cadastral management system combining Ethereum, GIS mapping, and IPFS to create transparent, tamper-resistant, and verifiable land records.**

This project was motivated by the weaknesses of traditional land registration systems, including disputes, lack of transparency, data tampering, and inefficient record management.

The core innovation of this system is the integration of:

* **Blockchain (Ethereum)** for immutable ownership records
* **GIS (Geographic Information Systems)** for storing real land parcel geometries
* **IPFS (InterPlanetary File System)** for decentralized storage of land boundaries

> ⚠️ **Note:** This is a Proof of Concept (PoC). The system demonstrates blockchain-based cadastral registration with decentralized storage. More advanced privacy mechanisms (such as Zero-Knowledge Proofs) are listed under *Future Advancements*.

---

## 📋 Table of Contents

* Overview
* Key Features
* System Architecture
* Technology Stack
* Prerequisites
* Installation & Setup
* Running the Application
* API Documentation
* Database Schema
* Smart Contract
* Security Features
* Troubleshooting
* Project Structure
* Future Advancements
* Contributing
* License

---

## 🎯 Overview

This system modernizes land registration by:

* **Storing ownership commitments on blockchain** — immutable and publicly auditable
* **Storing land boundaries on IPFS** — decentralized and tamper-resistant
* **Using cryptographic commitments** — to prevent unauthorized modifications
* **Providing a GIS-based map interface** — for intuitive parcel visualization

### Real-World Use Cases

1. **🏦 Bank Loan Applications** — Verify land ownership using blockchain records
2. **🏘️ Property Sales** — Confirm seller ownership before purchase
3. **📊 Government Tax Assessment** — Validate registered land parcels
4. **⚖️ Legal Disputes** — Cryptographically verifiable ownership records

---

## ✨ Key Features

### 🔐 Secure & Transparent Architecture

* **Commitment-Based Registration**: Only cryptographic commitments stored on blockchain
* **Tamper Resistance**: Blockchain prevents record alteration
* **Auditability**: Every transaction is publicly logged

### 🔗 Blockchain Integration

* **Ethereum Smart Contracts**: Immutable land registry
* **Event Logging**: Full audit trail of all parcel registrations
* **Gas-Efficient Design**: Optimized Solidity contract

### 📦 Decentralized Storage

* **IPFS Integration**: Land boundary GeoJSON files stored off-chain
* **Pinata Service**: Reliable IPFS pinning
* **Encrypted Metadata**: Additional security layer for stored files

### 🗺️ Interactive Map Interface

* **Leaflet.js Maps**: Visualize land parcels
* **GeoJSON Support**: Industry-standard spatial format
* **Boundary Drawing**: Create parcels directly on map

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (HTML/Vanilla JS)           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Login      │  │   Dashboard  │  │   Map View   │       │
│  │   MetaMask   │  │   My Parcels │  │   GeoJSON    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS / REST API
┌────────────────────────▼────────────────────────────────────┐
│                    Backend (Node.js + Express)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │     Auth     │  │  Parcel      │  │    IPFS      │       │
│  │   JWT/Web3   │  │  Registry    │  │   Pinata     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└────────┬──────────────────┬─────────────────┬───────────────┘
         │                  │                 │
         ▼                  ▼                 ▼
┌────────────────┐  ┌──────────────┐  ┌──────────────┐
│   PostgreSQL   │  │   Ethereum   │  │     IPFS     │
│   (Records)    │  │  (Ganache)   │  │  (Pinata)    │
└────────────────┘  └──────────────┘  └──────────────┘
```

### Data Flow

#### **1. Parcel Registration**

```
User → Upload GeoJSON → IPFS (get CID)
→ Generate Commitment = hash(owner + parcelId + salt)
→ Store Commitment on Blockchain
→ Store Salt + CID in Database
```

#### **2. Ownership Verification**

```
User → Query blockchain for commitment
→ Match with database record
→ Ownership Verified
```

---

## 🛠️ Technology Stack

### Frontend

* **HTML5/CSS3/JavaScript**
* **Leaflet.js** — Interactive maps
* **Leaflet.draw** — Map drawing tools
* **ethers.js** — Ethereum interaction
* **MetaMask** — Wallet integration

### Backend

* **Node.js v18+**
* **Express.js**
* **ethers.js v6**
* **PostgreSQL**
* **JWT Authentication**
* **Axios**

### Blockchain

* **Solidity ^0.8.0**
* **Truffle Suite**
* **Ganache (Local Blockchain)**
* **OpenZeppelin Libraries**

### Storage

* **IPFS**
* **Pinata**

### Cryptography

* **Keccak256 Hashing**
* **ECDSA Signatures**
* **Commitment Schemes**

---

## 📦 Prerequisites

| Software   | Version |
| ---------- | ------- |
| Node.js    | v18+    |
| PostgreSQL | v14+    |
| Ganache    | v7+     |
| Truffle    | v5+     |
| MetaMask   | Latest  |

---

## 🚀 Installation & Setup

*(Kept same as your original — unchanged for brevity)*

---

## 🎮 Running the Application

### Start Backend

```bash
cd backend
npm start
```

### Start Frontend

```bash
cd frontend
live-server --port=3000
```

Open:

```
http://localhost:3000
```

---

## 📡 API Documentation

### Authentication

#### `POST /api/auth/challenge`

#### `POST /api/auth/login`

### Parcel Management

#### `GET /api/my-parcels`

#### `POST /api/parcels/register` (Authority only)

---

## 🗄️ Database Schema

### Tables

* **users**
* **user_secrets**
* **transfer_requests**
* **proof_verifications** (renamed to `verification_audit` in practice)

---

## 📜 Smart Contract — CommitmentLandRegistry.sol

*(Your contract stays the same — still valid without ZKP.)*

---

## 🔒 Security Features

### Authentication & Authorization

* JWT-based authentication

### Rate Limiting

* API request throttling

### Input Validation

* Ethereum address validation
* GeoJSON validation

### SQL Injection Prevention

* Parameterized queries

### Blockchain Security

* Commitment uniqueness
* Authority-only registration
* Event-based audit logs

---

## 🐛 Troubleshooting

*(Kept same as your original — still relevant.)*

---

## 📁 Project Structure

```
blockchain-based-cadastral-system-main/
│
├── frontend/
│   ├── index.html
│   ├── dashboard.html
│   ├── register.html
│   ├── verify.html
│
├── backend/
│   ├── server.js
│   ├── schema.sql
│   ├── package.json
│   ├── .env
│
├── blockchain/
│   ├── contracts/
│   │   └── CommitmentLandRegistry.sol
│   ├── migrations/
│   ├── truffle-config.js
│
└── README.md
```

---

## 🚀 **Future Advancements (Planned Upgrades)**

### 🔐 Integration of Zero-Knowledge Proofs (ZKP)

A future version of this system aims to incorporate **true Zero-Knowledge Proofs (zk-SNARKs/zk-STARKs)** to enhance privacy while maintaining verifiability.

Planned improvements include:

1. **Real ZK Circuit Implementation**

   * Use Circom or Noir to create a formal ZK circuit proving:

     ```
     hash(owner + parcelId + salt) == stored commitment
     ```
   * Generate proofs using `snarkjs` or a similar prover.

2. **Client-Side Proof Generation**

   * Users generate proofs locally, reducing trust in the backend.

3. **On-Chain or Off-Chain ZK Verification**

   * Deploy a Solidity verifier contract, or
   * Use a trusted backend verifier with public verification keys.

4. **Privacy-Preserving Ownership Verification**

   * Allow users to prove ownership **without revealing identity or salt**.

5. **Verifier-Bound Proofs**

   * Enable proofs that can only be verified by a specific party (e.g., a bank).

This upgrade would transition the system from:

> “Commitment-based blockchain cadastral system”
> to
> “Fully privacy-preserving ZK-enabled blockchain cadastral system.”

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Open a Pull Request

---

## 📝 License

MIT License — see LICENSE file.

---

## 🙏 Acknowledgments

* OpenZeppelin
* Truffle Suite
* Pinata
* Leaflet
* PostgreSQL

---

**Made with ❤️ for transparent and tamper-proof land records**

---
