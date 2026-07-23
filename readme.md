# NEW FAMILY 3000 — AI Quiz Battle

Aplikasi kuis multiplayer real-time dengan tema cyberpunk. Host bikin room, soal-soalnya di-generate otomatis oleh AI (Gemini) sesuai topik & tingkat kesulitan yang diminta, lalu semua pemain jawab bareng secara real-time layaknya kompetisi trivia langsung. Di akhir game, AI juga bikin ringkasan performa seluruh pemain.

Dibuat sebagai Group Project Fase 2 — Hacktiv8 Full Stack JavaScript Bootcamp.

---

## Fitur Utama

- **Buat & Join Room** — host bikin room dengan Room Code unik, pemain lain tinggal masukin kode buat gabung
- **Generate Soal dengan AI** — soal kuis pilihan ganda di-generate otomatis oleh Gemini AI sesuai topik, tingkat kesulitan, dan jumlah soal yang diminta
- **Gameplay Real-Time** — semua pemain menerima soal, timer, dan update leaderboard secara bersamaan lewat WebSocket (Socket.IO), tanpa perlu refresh
- **Sistem Skor Berbasis Kecepatan** — semakin cepat jawab benar, semakin tinggi skor yang didapat
- **Leaderboard Live** — ranking pemain update otomatis setelah setiap soal
- **Ringkasan Hasil dari AI** — di akhir game, AI merangkum performa seluruh pemain dalam bahasa natural
- **Reconnect Handling** — status koneksi pemain ditampilkan real-time (connected/reconnecting)

---

## Tech Stack

**Client**
- React 19 + Vite
- React Router — SPA routing
- React Context — state management (`SocketContext`, `RoomContext`)
- Socket.IO Client — komunikasi real-time
- Axios — REST API call
- Tailwind CSS v4 — styling (custom cyberpunk theme)

**Server**
- Node.js + Express 5 — REST API
- Socket.IO — server real-time (WebSocket)
- Google Gemini API (`@google/genai`) — generate soal kuis & ringkasan hasil
- In-memory store (`Map`) — penyimpanan data room & game state

---

## Arsitektur

Aplikasi ini menggunakan arsitektur **client-server terpisah**:

```
┌─────────────┐         REST API           ┌─────────────┐         ┌─────────────┐
│   Client    │ ────────────────────────▶  │   Server    │ ──────▶ │  Gemini AI  │
│ (React+Vite)│ ◀────────────────────────  │ (Express +  │ ◀────── │             │
│             │      Socket.IO (real-time) │  Socket.IO) │         └─────────────┘
└─────────────┘ ◀────────────────────────▶ └─────────────┘
```

- **REST API** dipakai sekali di awal: generate soal + bikin room (`POST /generate-quiz`)
- **Socket.IO** menangani seluruh siklus permainan setelah room dibuat: join room, mulai game, submit jawaban, leaderboard, hasil akhir

Detail lengkap tiap endpoint & event ada di [`server/src/API_DOCS.md`](./server/src/API_DOCS.md).

---

## Struktur Folder

```
gp-gas/
├── client/                  # Frontend (React + Vite)
│   └── src/
│       ├── components/      # Komponen reusable (Button, Leaderboard, dll)
│       ├── context/         # SocketContext & RoomContext
│       ├── pages/           # Home, CreateQuiz, Lobby, Game, Result
│       └── services/        # API client (axios)
│
└── server/                  # Backend (Express + Socket.IO)
    └── src/
        ├── routes/          # REST endpoint
        ├── socket/          # Socket.IO event handlers
        ├── services/        # Integrasi Gemini AI
        ├── store/           # In-memory room store
        └── API_DOCS.md      # Dokumentasi API lengkap
```

---

## Cara Menjalankan Secara Lokal

### 1. Clone repository
```bash
git clone <url-repo-ini>
cd gp-gas
```

### 2. Setup Server
```bash
cd server
npm install
cp .env.example .env
```
Isi `.env`:
```
GEMINI_API_KEY=isi_key_kalian
PORT=3000
CLIENT_URL=http://localhost:5173
```
Jalankan:
```bash
npm run dev
```

### 3. Setup Client
```bash
cd client
npm install
cp .env.example .env
```
Isi `.env`:
```
VITE_SERVER_URL=http://localhost:3000
```
Jalankan:
```bash
npm run dev
```

### 4. Buka aplikasi
Akses `http://localhost:5173` di browser. Buka di 2+ tab/device berbeda untuk simulasi multiplayer.

---

## Live Demo

- **Client: https://gp-gas.vercel.app/ **
- **Server: https://gp-gas-production.up.railway.app/**

---

## Tim

| Nama | Kontribusi |
|---|---|
| ismailarifberlianto | Server App |
| rayyandwiutomo | Client App Lobby |
| Muhamad Raafi Dewanto | Client App Room Quiz |
