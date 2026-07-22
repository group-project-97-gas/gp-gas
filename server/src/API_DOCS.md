# API Docs — AI Quiz Battle Server

Dokumen ini adalah kontrak API server untuk tim client: seluruh REST endpoint dan Socket.IO event yang tersedia, beserta bentuk payload-nya. Dokumen ini disusun langsung dari implementasi aktual di `src/routes/quizRoutes.js`, `src/socket/triviaHandlers.js`, `src/services/aiService.js`, dan `src/store/roomStore.js`.

## Base URL & Autentikasi

- Base URL server diatur lewat environment variable `PORT` di `server/.env` (default `3000`), dan diakses dari client lewat `VITE_SERVER_URL` di `client/.env`.
- **Tidak ada autentikasi/token di API ini.** Login hanya berupa username (lihat PRD bagian 11) — tidak ada password, session token, atau API key yang dikirim dari client. Identitas seorang peserta di dalam room ditentukan oleh `socketId` koneksi Socket.IO-nya, bukan oleh credential apa pun.
- CORS di server hanya mengizinkan origin yang cocok dengan `CLIENT_URL` di `server/.env` (berlaku untuk REST maupun Socket.IO, dikonfigurasi terpisah untuk masing-masing di `server.js`) — request dari origin lain akan ditolak oleh browser.
- `GEMINI_API_KEY` murni dipakai di server untuk memanggil Gemini API dan tidak pernah dikirim ke client dalam bentuk apa pun (tidak di response REST, tidak di payload socket, tidak di log — lihat `redactApiKey()` di `aiService.js`).

---

## 1. REST Endpoints

### POST /generate-quiz

Generate soal kuis lewat AI dan membuat room baru. Dipanggil satu kali oleh host sebelum room dibuka ke peserta lain.

**Method & Path:** `POST /generate-quiz`

**Request Body:**

```json
{
  "topic": "JavaScript Dasar",
  "difficulty": "easy",
  "totalQuestion": 5
}
```

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| topic | string | ya | Topik kuis, non-kosong |
| difficulty | string | ya | Tingkat kesulitan, non-kosong (mis. `"easy"`, `"medium"`, `"hard"`) |
| totalQuestion | number | ya | Bilangan bulat positif, jumlah soal yang di-generate |

**Contoh Response Sukses — `200 OK`:**

```json
{
  "roomCode": "AB3XZ9",
  "questions": [
    {
      "question": "Apa fungsi keyword `let` di JavaScript?",
      "options": ["Mendeklarasikan variabel dengan scope block", "Membuat fungsi", "Import modul", "Looping array"],
      "answer": "Mendeklarasikan variabel dengan scope block"
    }
  ]
}
```

> **Catatan:** response ini adalah satu-satunya tempat field `answer` dikirim secara eksplisit ke client. Selama gameplay lewat Socket.IO, event `question` dan `next_question` **tidak pernah** menyertakan `answer` ke peserta mana pun.

**Contoh Response Error — `400 Bad Request`** (validasi body gagal):

```json
{ "error": "Field \"topic\" wajib diisi dan berupa string" }
```

Pesan error yang sama polanya juga berlaku untuk `difficulty` dan `totalQuestion` kalau tidak valid.

**Contoh Response Error — `502 Bad Gateway`** (Gemini gagal, timeout, atau output tidak valid setelah divalidasi):

```json
{ "error": "Gagal generate soal dari AI: gagal memanggil Gemini API untuk generate soal: ..." }
```

> **Catatan waktu tunggu:** panggilan ke Gemini di endpoint ini diberi batas waktu 20 detik (lebih longgar dari NFR umum PRD bagian 12 yang menargetkan <10 detik), karena durasi generate soal secara wajar naik seiring `totalQuestion` yang diminta. Untuk event `summary` di Socket.IO (ringkasan akhir game, teksnya selalu pendek dan tidak scale dengan jumlah pemain), batas waktunya lebih ketat di 10 detik sesuai NFR.

### GET /health

Health check sederhana, tidak butuh body, tidak menyentuh Gemini atau roomStore sama sekali — dipakai untuk memastikan proses server hidup.

**Method & Path:** `GET /health`

**Contoh Response — `200 OK`:**

```json
{ "status": "ok" }
```

---

## 2. Socket.IO Events

Seluruh siklus room setelah soal siap (join, mulai game, jawab, leaderboard, hasil akhir) berjalan lewat Socket.IO, bukan REST — lihat PRD bagian 6. Urutan di bawah mengikuti alur data end-to-end: client dapat `roomCode` dari `POST /generate-quiz`, lalu semua interaksi berikutnya memakai `roomCode` tersebut lewat socket.

### Client → Server

Event yang di-*emit* dari client ke server.

#### `join_room`

Host atau player bergabung ke room memakai `roomCode` hasil `/generate-quiz`. Dipanggil host tepat setelah room dibuat, dan oleh setiap player setelah mengisi Room Code di Lobby.

```json
{
  "roomCode": "AB3XZ9",
  "username": "rayyan",
  "isHost": true
}
```

| Field | Tipe | Keterangan |
|---|---|---|
| roomCode | string | Wajib, harus cocok dengan room yang sudah ada |
| username | string | Wajib, non-kosong |
| isHost | boolean | Opsional (default `false`). `true` hanya untuk socket yang berhak jadi host room ini — server menetapkan `room.hostId` berdasarkan flag ini, bukan berdasarkan siapa yang membuat room lewat REST |

Ditolak (lewat event `error`, lihat di bawah) kalau: `roomCode`/`username` kosong, room tidak ditemukan, atau room sudah berstatus `playing`/`finished`. Kalau ditolak, server **tidak** broadcast apa pun ke room — hanya emit `error` ke socket pemanggil saja.

#### `start_game`

Host memulai permainan. Hanya diterima dari socket yang tercatat sebagai host room tersebut (`room.hostId`) — request dari socket lain, room tanpa soal, atau room yang sudah `playing`, akan ditolak lewat event `error`.

```json
{ "roomCode": "AB3XZ9" }
```

#### `submit_answer`

Peserta mengirim jawaban untuk soal yang sedang aktif.

```json
{
  "roomCode": "AB3XZ9",
  "answer": "Mendeklarasikan variabel dengan scope block"
}
```

| Field | Tipe | Keterangan |
|---|---|---|
| roomCode | string | Wajib |
| answer | string | Jawaban peserta — dicocokkan persis (`===`) ke `answer` soal yang sedang aktif di server |

Jawaban kedua dari socket yang sama untuk soal yang sama akan ditolak lewat `error` (idempotent, tidak menambah skor dua kali). Skor dihitung server-side: `1000` dikurangi `50` per detik sejak soal dikirim, minimum `100` — jawaban salah tidak menambah skor sama sekali.

### Server → Client

Event yang di-*broadcast* ke seluruh room (atau, khusus `error`, dikirim ke satu socket saja) dari server.

#### `player_joined`

Broadcast daftar peserta terbaru ke seluruh room. Terjadi setiap kali `join_room` berhasil, dan setiap kali seorang peserta terputus (`disconnect`).

```json
{
  "players": [
    { "username": "rayyan", "socketId": "abc123", "score": 0 },
    { "username": "budi", "socketId": "def456", "score": 0 }
  ]
}
```

#### `question`

Kirim soal aktif ke seluruh peserta. Dikirim **satu kali**, tepat setelah `start_game` diterima dari host (soal pertama, index 0).

```json
{
  "questionNumber": 1,
  "totalQuestions": 5,
  "question": "Apa fungsi keyword `let` di JavaScript?",
  "options": ["Mendeklarasikan variabel dengan scope block", "Membuat fungsi", "Import modul", "Looping array"],
  "timeLimit": 20
}
```

> Field `answer` sengaja tidak ada di sini — peserta tidak boleh tahu jawaban benar sebelum submit. Field `timeLimit` (dalam detik) dikirim supaya UI Timer di client (PRD bagian 13) bisa tersinkron persis dengan waktu auto-advance server — jangan hardcode angka ini terpisah di client, selalu baca dari payload.

#### `leaderboard`

Update papan skor. Broadcast setelah seluruh peserta di room sudah menjawab soal aktif, **atau** setelah 20 detik timer soal itu habis (mana pun lebih dulu) — untuk setiap soal, termasuk soal terakhir.

```json
{
  "rankings": [
    { "username": "rayyan", "score": 1000 },
    { "username": "budi", "score": 250 }
  ]
}
```

#### `next_question`

Lanjut ke soal berikutnya. Dikirim tepat setelah `leaderboard`, kalau masih ada soal tersisa. Bentuk payload sama persis dengan `question` (termasuk tanpa field `answer`).

```json
{
  "questionNumber": 2,
  "totalQuestions": 5,
  "question": "Apa itu Closure?",
  "options": ["...", "...", "...", "..."],
  "timeLimit": 20
}
```

#### `game_over`

Menandakan soal sudah habis. Dikirim tepat setelah `leaderboard` untuk soal terakhir.

```json
{
  "finalRankings": [
    { "username": "rayyan", "score": 4200 },
    { "username": "budi", "score": 3100 }
  ]
}
```

#### `summary`

Kirim hasil ringkasan AI ke seluruh peserta. Dikirim tepat setelah `game_over`.

```json
{ "summaryText": "Sebagian besar pemain memahami konsep dasar JavaScript, namun banyak yang masih kesulitan pada materi Closure dan Promise." }
```

Kalau Gemini gagal saat generate ringkasan, `summaryText` tetap dikirim berisi pesan fallback generik (`"Ringkasan AI tidak tersedia saat ini."`) — event ini akan selalu terkirim setelah `game_over`, client tidak perlu menangani kondisi "tidak ada summary".

#### `disconnect`

Event bawaan Socket.IO (client tidak listen ke ini sebagai event server-ke-client biasa; ini murni koneksi socket yang terputus, termasuk kalau player menutup tab). Saat terjadi, server menghapus peserta itu dari `room.players` lalu broadcast ulang `player_joined` dengan daftar terbaru ke sisa peserta di room.

> **Catatan perilaku khusus:**
> - Kalau room jadi **kosong** (pemain terakhir disconnect), room langsung dihapus dari store (`deleteRoom`) — tidak ada `player_joined` yang di-broadcast karena tidak ada lagi socket di room itu.
> - Kalau yang disconnect adalah **host**, dan room masih berstatus `waiting` (belum `start_game`), server otomatis menunjuk pemain pertama yang tersisa di `room.players` sebagai host baru (`room.hostId` diperbarui). Kalau room sudah `playing`, host tidak di-reassign — gameplay tetap jalan lewat `submit_answer` peserta lain tanpa butuh host aktif.

#### Error event (di luar tabel PRD)

Bukan bagian dari tabel event PRD bagian 10, tapi ada di implementasi: server emit `error` **ke socket pemanggil saja** (bukan broadcast) setiap kali sebuah aksi ditolak — room tidak ditemukan, bukan host saat `start_game`, game belum berjalan, atau jawaban duplikat. Client sebaiknya listen ke event ini untuk menampilkan pesan error, bukan berasumsi setiap emit pasti berhasil.

```json
{ "message": "Room AB3XZ9 tidak ditemukan" }
```

---

## Ringkasan Urutan Event (sesuai alur PRD bagian 6)

1. Client → `POST /generate-quiz` → dapat `roomCode` + `questions`
2. Client → `join_room` (host, lalu setiap player) → Server → `player_joined` (berkali-kali, tiap ada yang join)
3. Client (host) → `start_game` → Server → `question` (soal #1)
4. Client (tiap peserta) → `submit_answer` → Server → `leaderboard` → Server → `next_question` (soal berikutnya) atau lanjut ke langkah 5 kalau soal terakhir
5. Server → `game_over` → Server → `summary`

---

## Catatan Hardening (di luar cakupan kontrak PRD, relevan buat integrasi client)

Beberapa perilaku tambahan di luar tabel event/kontrak PRD, hasil hardening dari review internal tim:

- Payload `question`/`next_question` menyertakan `timeLimit` (detik) — pastikan Timer UI di client membaca nilai ini dari payload, bukan hardcode angka terpisah.
- Room otomatis dihapus dari memori begitu semua peserta disconnect (lihat catatan di event `disconnect`), dan host otomatis di-reassign ke peserta lain kalau host disconnect sebelum game dimulai.
- Timeout pemanggilan Gemini dibedakan per jenis: 20 detik untuk generate soal (`POST /generate-quiz`), 10 detik untuk generate ringkasan (event `summary`) — lihat catatan di masing-masing bagian.
- Panggilan ke Gemini otomatis di-retry **1 kali** (jeda 1 detik) kalau error-nya bersifat transient di sisi Gemini (`DEADLINE_EXCEEDED`, `UNAVAILABLE`, `RESOURCE_EXHAUSTED`, atau HTTP 5xx) — error konfigurasi (API key salah, dsb) tidak di-retry dan langsung gagal. Konsekuensinya, waktu tunggu maksimum sebelum client menerima `502`/fallback text bisa hampir dua kali lipat dari timeout yang tertulis di atas kalau percobaan pertama kena error transient.
