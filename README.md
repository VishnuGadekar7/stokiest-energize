# ⚡ Energize Pharmaceuticals — Stockist Appointment Form

**ENERGIZE PHARMACEUTICALS (P) LIMITED** | SBU of DAKSON GROUP

A full-stack web application for submitting stockist appointment applications online. Applicants fill a 6-step form, which triggers:
1. **MongoDB save** — all form data stored in cloud database
2. **PDF Generation** — a 2-page A4 PDF (Puppeteer) with Page 1 filled and Page 2 left blank for office use
3. **Email to HR** — styled email with PDF attachment via Resend API

---

## 📁 Folder Structure

```
energize-stockist-form/
  ├── server.js          # Express server, routes, orchestration
  ├── generatePDF.js     # Puppeteer PDF generation (2-page A4)
  ├── emailSender.js     # Resend email with PDF attachment
  ├── db.js              # Mongoose connection
  ├── Stockist.js        # Mongoose schema/model
  ├── public/
  │    └── index.html    # 6-step applicant form (Vanilla HTML/CSS/JS)
  ├── .env.example       # Environment variable template
  ├── .gitignore
  ├── package.json
  └── README.md
```

---

## 🚀 Local Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd energize-stockist-form
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Then edit `.env` and fill in your values:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
HR_EMAIL=hr@energizepharma.com
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/energize
PORT=3000
IS_PRODUCTION=false
```

### 4. Start the server

```bash
npm start
```

Open your browser at `http://localhost:3000`

---

## 📧 Resend API Key Setup

1. Go to [resend.com](https://resend.com) and sign up for a free account
2. Navigate to **API Keys** → click **Create API Key**
3. Copy the key (starts with `re_...`)
4. Paste it as `RESEND_API_KEY` in your `.env`
5. By default, emails are sent **from** `onboarding@resend.dev` (works on all Resend plans without domain verification)

### Using Your Own Domain with Resend

1. Go to Resend dashboard → **Domains** → Add your domain
2. Add the provided **DNS records** (MX, SPF, DKIM) to your domain registrar
3. Wait for verification (usually a few minutes)
4. Update `emailSender.js`:
   ```js
   from: 'Energize Pharma <no-reply@yourdomain.com>',
   ```

---

## 🗄️ MongoDB Atlas Setup

1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas) and create a free account
2. Create a **free cluster** (M0 tier)
3. In **Database Access** → Add a database user with password
4. In **Network Access** → Allow access from anywhere (`0.0.0.0/0`) for deployment, or your IP for local
5. Click **Connect** → **Connect your application** → copy the connection string
6. Replace `<username>`, `<password>`, and `<database>` in the URI:
   ```
   mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/energize?retryWrites=true&w=majority
   ```
7. Paste it as `MONGODB_URI` in your `.env`

---

## ☁️ Deploy to Render.com

### 1. Push your code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/energize-stockist-form.git
git push -u origin main
```

### 2. Create a Render.com Web Service

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure service:
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 3. Set Environment Variables on Render

In the **Environment** tab, add:

| Key | Value |
|-----|-------|
| `RESEND_API_KEY` | `re_xxxxxxxxxxxxxxxxxx` |
| `HR_EMAIL` | `hr@energizepharma.com` |
| `MONGODB_URI` | `mongodb+srv://...` |
| `PORT` | `3000` |
| `IS_PRODUCTION` | `true` |
| `PUPPETEER_EXECUTABLE_PATH` | `/usr/bin/google-chrome-stable` |

> **Note:** Render.com free tier automatically provides Chrome for Puppeteer via `puppeteer-core`. The `IS_PRODUCTION=true` flag switches between `puppeteer` (local) and `puppeteer-core` (Render).

### 4. Deploy

Click **Create Web Service** — Render will build and deploy. Your URL will be `https://your-service.onrender.com`.

---

## 🌍 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `RESEND_API_KEY` | Your Resend API key | `re_abc123...` |
| `HR_EMAIL` | HR email that receives applications | `hr@energizepharma.com` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `PORT` | Server port | `3000` |
| `IS_PRODUCTION` | Use `puppeteer-core` instead of `puppeteer` | `true` or `false` |
| `PUPPETEER_EXECUTABLE_PATH` | Path to Chrome on Render | `/usr/bin/google-chrome-stable` |

---

## ✉️ How to Change HR Recipient Email

Edit your `.env` file:
```env
HR_EMAIL=new-recipient@company.com
```

Or set it in Render.com environment variables.

---

## 📄 PDF Structure

- **Page 1**: All applicant-filled data rendered in a professional A4 table layout matching the original Energize form
- **Page 2**: Pre-printed office-use layout with all fields blank (dotted lines), diagonal "OFFICE USE ONLY" watermark, identical company header and footer

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js ≥ 18 |
| Web Framework | Express.js |
| Database | MongoDB + Mongoose (NeonDB Atlas) |
| PDF | Puppeteer / Puppeteer-Core |
| Email | Resend SDK |
| Frontend | Vanilla HTML, CSS, JavaScript |
| Deployment | Render.com (free tier) |

---

## 📞 Contact

**ENERGIZE PHARMACEUTICALS (P) LIMITED**  
24, 2nd Floor, B-Building, City Vista Downtown, EON IT Park Road, Kharadi, PUNE-411014 (MH) INDIA  
📧 sales@energizepharma.com | 🌐 www.energizepharma.com | ☎ +020-65-414-555
