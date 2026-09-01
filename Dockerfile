# --- Stage 1: Builder ---
FROM node:20-alpine AS builder

WORKDIR /app

# کپی فایل‌های package
COPY package*.json ./

# نصب تمامی پکیج‌ها (کامل - برای بیلد کردن نیازشون داریم)
RUN npm install

# کپی سورس‌کد و بیلد کردن پروژه
COPY . .
RUN npm run build

# 💡 ترفند طلایی: حذف پکیج‌های dev از node_modules بعد از اتمام بیلد
RUN npm prune --omit=dev

# --- Stage 2: Production ---
FROM node:20-alpine

WORKDIR /app

# کپی فایل‌های تنظیمات
COPY package*.json ./

# کپی node_modules سبک و تمیز شده از مرحله قبل (بدون نیاز به اینترنت!)
COPY --from=builder /app/node_modules ./node_modules

# کپی کردن پوشه dist از مرحله builder
COPY --from=builder /app/dist ./dist

# پورت اجرایی
EXPOSE 3000

# دستور اجرای سرور
CMD ["node", "dist/main"]
