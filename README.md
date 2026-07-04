# کارنامه — KarNama

**نرم‌افزار بومی و متن‌باز مدیریت پروژه، کارها و چک‌لیست‌های روزانه**

---

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-2.x-24C8DB?style=for-the-badge&logo=tauri&logoColor=white" alt="Tauri">
  <img src="https://img.shields.io/badge/SolidJS-1.x-4F87C6?style=for-the-badge&logo=solidjs&logoColor=white" alt="SolidJS">
  <img src="https://img.shields.io/badge/TypeScript-6.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Rust-2021-CE4128?style=for-the-badge&logo=rust&logoColor=white" alt="Rust">
  <img src="https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License">
</p>

---

برنامه دسکتاپ و موبایل بومی (Native) ساخته شده با Tauri 2، SolidJS و SQLite. تمامی داده‌ها کاملاً محلی هستند و هیچ‌گاه به هیچ سروری ارسال نمی‌شوند.

---

## امکانات

| بخش | شرح |
|---|---|
| **داشبورد یکپارچه** | نمایش لحظه‌ای وضعیت پروژه‌ها، کارها و پیشرفت چک‌لیست‌های روزانه |
| **مدیریت مشتریان** | ثبت اطلاعات تماس، رنگ اختصاصی و بودجه تجمیعی برای هر مشتری |
| **کنترل پروژه‌ها** | دسته‌بندی پروژه‌ها بر اساس وضعیت، اولویت و مشتری مرتبط |
| **بورد کانبان** | پیگیری کارها با جریان کاری سه‌مرحله‌ای (در انتظار / در حال انجام / انجام شده) |
| **چک‌لیست روزانه** | ثبت وظایف روزانه با نوار پیشرفت دایره‌ای و ناوبری زمانی |
| **پوسته روشن / تاریک / سیستم** | سازگار با تنظیمات رنگ سیستم‌عامل |
| **بروزرسانی خودکار** | دریافت و نصب نسخه‌های جدید بدون نیاز به دخالت کاربر |
| **پشتیبان‌گیری** | خروجی و ورودی کامل اطلاعات در قالب JSON |
| **داده محلی** | تمامی اطلاعات در پایگاه‌داده SQLite محلی ذخیره می‌شود |

---

## پلتفرم‌های پشتیبانی شده

| پلتفرم | فرمت نصب |
|---|---|
| ویندوز | `.msi` / `.exe` |
| macOS | `.dmg` (Universal — Intel + Apple Silicon) |
| لینوکس | `.deb` / `.AppImage` |
| اندروید | `.apk` |

آخرین نسخه پایدار را از بخش [Releases](https://github.com/arsamadineh/karnameh/releases) دریافت کنید.

---

## معیارهای فنی

| شاخص | مقدار |
|---|---|
| زمان راه‌اندازی سرد | کمتر از ۱ ثانیه |
| حافظه مصرفی (حالت عادی) | کمتر از ۸۰ مگابایت |
| حجم فایل نصبی (ویندوز) | کمتر از ۱۰ مگابایت |
| تعداد کوئری‌های SQL برای بارگذاری داشبورد | حداکثر ۴ |
| پشتیبانی RTL | کامل در تمامی صفحات |
| فونت پیش‌فرض | وزیرمتن (Vazirmatn) |
| مقیاس‌بندی فونت | Clamp fluid (بدون پرش در ریسپانسیو) |

---

## پیش‌نیازهای توسعه

- **Node.js** نسخه LTS یا بالاتر
- **Rust** نسخه Stable
- ابزارهای بومی سیستم‌عامل (Build Tools ویندوز، Xcode برای macOS، یا gcc برای لینوکس)

---

## راه‌اندازی محلی

```bash
# ۱. نصب وابستگی‌ها
npm install

# ۲. اجرا در حالت توسعه (دسکتاپ)
npm run tauri dev

# ۳. ساخت فایل نصبی دسکتاپ
npm run tauri build

# ۴. ساخت APK اندروید
npm run tauri android build --apk
```

---

## معماری پروژه

```
karnameh/
├── src/                    پوسته کاربری (SolidJS + TypeScript)
│   ├── features/           بخش‌های اصلی برنامه
│   ├── components/         کامپوننت‌های قابل استفاده مجدد
│   ├── lib/                لایه API و ابزارها
│   ├── store/              مدیریت وضعیت سراسری
│   └── styles/             توکن‌های طراحی و سبک‌های سراسری
├── src-tauri/              هسته پردازشی (Rust)
│   ├── src/
│   │   ├── commands/       دستورات IPC Tauri
│   │   ├── repositories/   دسترسی به پایگاه‌داده
│   │   ├── models/         مدل‌های داده
│   │   └── commands/       منطق کسب‌وکار
│   ├── migrations/         مهاجرت‌های پایگاه‌داده SQLite
│   └── tauri.conf.json     پیکربندی Tauri
└── .github/workflows/      ساخت و انتشار خودکار (CI/CD)
```

---

## مشارکت در توسعه

از مشارکت شما استقبال می‌کنیم. لطفاً قبل از ارسال Pull Request، مسئله (Issue) مربوطه را ابتدا ثبت کنید.

---

## انتشار نسخه جدید

برای انتشار نسخه جدید، راهنمای [RELEASING.md](./RELEASING.md) را مطالعه کنید.

**خلاصه فرآیند:**
1. نسخه را در سه فایل به‌روز کنید (`tauri.conf.json`, `Cargo.toml`, `package.json`)
2. تغییرات را commit کنید
3. Git tag ایجاد کنید
4. Push کنید - GitHub Actions به‌صورت خودکار برای تمام پلتفرم‌ها build می‌کند

**پلتفرم‌های build خودکار:**
- 🪟 Windows: NSIS installer (`.exe`) + MSI (`.msi`)
- 🍎 macOS: DMG (`.dmg`) برای Intel و Apple Silicon
- 🐧 Linux: Debian (`.deb`) + AppImage
- 📱 Android: APK برای تمام معماری‌ها

---

## پروانه

این پروژه تحت مجوز **MIT** منتشر شده است.
