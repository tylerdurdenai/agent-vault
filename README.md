# AgentVault

Secure crypto agent management PWA with Passkey authentication and TEE key injection.

## Features

- **Passkey Authentication** - WebAuthn-based login, no passwords
- **Local Wallet Generation** - Keys generated on device, never leave
- **Agent Binding** - Scan QR to bind agents to wallets
- **TEE Key Injection** - Secure key transfer via encrypted relay
- **Mode A** - Per-transaction passkey approval
- **Mode B** - Pre-authorized auto-sign within limits

## Quick Start

### 1. Install Dependencies

```bash
# PWA
cd agent-vault
npm install

# API (optional, for relay)
cd api
npm install
```

### 2. Run Development Server

```bash
# Terminal 1: PWA
cd agent-vault
npm run dev

# Terminal 2: API (optional)
cd api
npm run dev
```

### 3. Open in Browser

```
https://localhost:5173
```

Note: Passkey requires HTTPS. For local dev, use `mkcert` or test on deployed domain.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   PWA (React)   │────▶│  API (Relay)    │────▶│  TEE (Signing)  │
│                 │     │                 │     │                 │
│ - Passkey auth  │     │ - Key relay     │     │ - Key storage   │
│ - Wallet gen    │     │ - Attestation   │     │ - Transaction   │
│ - QR scanning   │     │ - Grants        │     │   signing       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Key Files

```
agent-vault/
├── src/
│   ├── components/
│   │   └── PasskeyAuth.jsx    # WebAuthn login/register
│   ├── pages/
│   │   ├── Dashboard.jsx      # Wallet & agent management
│   │   ├── AgentBinding.jsx   # QR scan & bind
│   │   └── TransactionApproval.jsx  # Mode A approval
│   ├── lib/
│   │   ├── crypto.js          # Wallet generation, key wrapping
│   │   └── keyInjection.js    # TEE injection protocol
│   ├── App.jsx                # Main router
│   └── main.jsx               # Entry point
├── api/
│   └── src/
│       └── server.js          # Relay API (Mode A/B)
├── package.json
└── vite.config.js
```

## Flow

### 1. Authentication

```
User opens PWA
    → Click "Create Account"
    → Browser prompts for passkey (Face ID / Touch ID / PIN)
    → Passkey stored in platform keystore
    → User logged in
```

### 2. Wallet Generation

```
User clicks "Generate EVM Wallet"
    → Key generated locally (noble-secp256k1)
    → Stored encrypted in localStorage
    → Address displayed
```

### 3. Agent Binding

```
User scans agent QR code
    → QR contains: agent_id, chain, TEE endpoint, nonce
    → User selects wallet to bind
    → Key wrapped with TEE public key
    → Encrypted blob sent via relay
    → TEE receives, decrypts, stores in memory
    → Agent bound
```

### 4. Transaction Signing

**Mode A (Per-TX):**
```
Agent requests sign
    → Push notification to user
    → User reviews TX details
    → User authenticates with passkey
    → Approval token sent to TEE
    → TEE verifies and signs
    → TX submitted
```

**Mode B (Auto-Sign):**
```
Agent requests sign
    → TEE checks grant limits
    → If within limits: auto-sign
    → If over limits: fallback to Mode A
```

## Security Model

| Component | Security |
|-----------|----------|
| **Passkey** | Stored in platform keystore (Keychain/Keystore) |
| **Wallet Keys** | Generated locally, encrypted with user key |
| **Key Injection** | ECDH + AES-256-GCM encrypted transfer |
| **TEE** | Keys never leave enclave memory |
| **Mode A** | Requires passkey for every transaction |
| **Mode B** | Pre-authorized limits, audit trail |

## Production Requirements

1. **HTTPS** - Required for WebAuthn
2. **TEE Infrastructure** - AWS Nitro Enclaves or similar
3. **Attestation Verification** - Verify TEE PCR values
4. **Push Notifications** - Web Push API for Mode A
5. **Database** - Persistent storage for grants, audit logs

## Development Notes

- `noble-secp256k1` used for EVM key generation (WebCrypto doesn't support secp256k1)
- Key wrapping is simplified (XOR with shared secret) - production should use proper AES-GCM
- TEE attestation verification should be done client-side or via transparent service
- localStorage used for demo - production should use encrypted IndexedDB

## License

MIT
