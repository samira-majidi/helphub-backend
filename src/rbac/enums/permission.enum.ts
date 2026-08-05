// src/common/enums/permission.enum.ts
export enum Permission {
  // مدیریت پروفایل (برای هر دو نقش: آپدیت عکس، شماره، رزومه و...)
  PROFILE_MANAGE = 'PROFILE_MANAGE',

  // دسترسی‌های مربوط به کار/تسک (Task)
  TASK_READ = 'TASK_READ', // دیدن لیست کارها (کاربر کارهای خودش رو میبینه، متخصص کارهای موجود رو)
  TASK_CREATE = 'TASK_CREATE', // کاربر تسک جدید میسازه، متخصص میتونه پیشنهاد (Offer) ثبت کنه
  TASK_UPDATE = 'TASK_UPDATE', // برای تغییر وضعیت کار (مثلاً متخصص میزنه "انجام شد"، یا کاربر ویرایش میکنه)
  TASK_DELETE = 'TASK_DELETE', // برای لغو کردن کار
}
