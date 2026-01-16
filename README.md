# 🔐 Skwad

**Skwad** is an **advanced, end‑to‑end encrypted peer‑to‑peer (P2P) communication system** designed to work **entirely over local networks (LAN)** — **no internet, no servers, no trackers**.

It focuses on **secure device pairing**, **trusted peer identity**, and **cryptographically protected sessions**, making it suitable for offline collaboration, private messaging, and experimental distributed systems.

> ⚠️ This is **not** a beginner project. Skwad is built for developers comfortable with networking, cryptography, and systems design.

---

## ✨ Key Features

* 🔒 **End‑to‑End Encryption** (ChaCha20‑Poly1305 IETF)
* 🤝 **Secure Peer Pairing** with device codes
* 🧠 **Trusted Peer Store** (fingerprint‑based identity)
* 🌐 **LAN‑only Discovery** (Wi‑Fi, no internet)
* 🔁 **Replay Protection & Ordered Frames**
* 🧩 **Protocol‑first architecture** (UI‑agnostic)
* 🛠️ **Extensible for desktop & mobile clients**

---

## 🧠 Architecture Overview

```
┌─────────────┐        Secure TCP        ┌─────────────┐
│   Device A  │ ◀────────────────────▶ │   Device B  │
│             │   Encrypted Frames      │             │
│  Skwad Core │                          │  Skwad Core │
└─────────────┘                          └─────────────┘
        ▲                                        ▲
        │                                        │
   (Future UI)                             (Future UI)
   Flutter / CLI                           Flutter / CLI
```

Skwad separates **core protocol logic** from **user interfaces**, allowing multiple frontends (CLI, Flutter, desktop) to interact with the same secure engine.

---

## 🔐 Security Model

### Cryptography

* **Key Exchange**: Ephemeral session keys
* **Encryption**: `ChaCha20‑Poly1305 (IETF)`
* **Nonces**: 96‑bit (counter‑based, monotonic)
* **Integrity**: Authenticated encryption (AEAD)
* **Replay Protection**: Strict message counters

### Secure Framing

Each encrypted frame:

```
[ 8‑byte counter ] + [ AEAD ciphertext ]
```

Out‑of‑order or replayed packets are **rejected immediately**.

---

## 🤝 Peer Identity & Trust

* Each device generates a **public/private key pair**
* Peers are identified by a **SHA‑256 fingerprint** of their public key
* Trusted peers are stored locally in:

```
.skwad/peers.json
```

Once trusted, a peer can reconnect **without re‑pairing**.

---

## 🌐 LAN Discovery

* UDP‑based local discovery
* Zero external dependencies
* Works on:

  * Home Wi‑Fi
  * Hotspots
  * Isolated LANs

Peers automatically discover and initiate secure TCP handshakes.

---

## 🖥️ Current Interface

### CLI (Node.js)

The current implementation ships with a **fully functional CLI** used for:

* Generating device identities
* Pairing peers
* Running secure TCP servers
* Exchanging encrypted messages

Example:

```bash
node ./dist/client/cli.js --profile nodeA --skwad myroom --port 45454
```

---

## 📱 Mobile Support (In Progress)

Skwad is being extended with a **Flutter mobile UI**, which will:

* Connect to the Skwad Node core locally
* Display peers and sessions visually
* Send & receive messages securely

> The cryptographic core remains untouched — the UI is just a client.

---

## 📂 Project Structure

```
src/
 ├─ core/
 │   ├─ crypto/        # Keys, peers, encryption
 │   └─ protocol/      # SecureFrame, handshake
 │
 ├─ net/
 │   ├─ lan/           # UDP discovery
 │   └─ tcp/           # Secure TCP sessions
 │
 ├─ client/
 │   └─ cli.ts         # CLI entry point
 │
 └─ utils/
```

---

## 🚧 Project Status

**Stage:** Active development

✔ Secure LAN discovery
✔ Trusted peer pairing
✔ Encrypted TCP sessions
✔ Replay‑safe framing
🟡 Flutter UI integration
🔴 Public release & packaging

---

## 🧪 Who This Is For

* Systems programmers
* Security enthusiasts
* Networking learners
* Developers building offline‑first tools

If you’re looking for a "simple chat app", this is not it.
If you want to understand **how secure P2P systems actually work**, welcome.

---

## ⚠️ Disclaimer

Skwad is an **experimental project**.

* Not audited
* Not production‑ready
* Do not use for sensitive data (yet)

---

## 🧠 Philosophy

> No servers. No accounts. No tracking. Just devices you trust.

---

## 📜 License

Apache License

---

## 👤 Author

**Odinaka Ezurike**
Founder & Systems Developer

---

If this project interests you, ⭐ the repo and follow development.
