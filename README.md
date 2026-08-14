# وصل الباك بمشروع Edujar — دليل سريع

## 1) انسخ الملفات
انسخ مجلد `src` كامل من هون فوق مجلد `src` يلي عندك بمشروعك (مو استبدال — بس ضيف/ادمج الملفات الجديدة):

```
src/config/api.js
src/contexts/AuthContext.jsx
src/contexts/ToastContext.jsx   (جديد)
src/components/OtpInput.jsx     (جديد)
src/utils/errorMessages.js      (جديد)
src/pages/Auth/AuthForms.jsx
src/pages/Auth/GoogleCallback.jsx
src/pages/Auth/GuardianApprove.jsx
```

> ملاحظة: مشروعك TypeScript بس هاي الملفات `.jsx`. ما في مشكلة — Vite بتقدر تشغل `.jsx` جنب `.tsx` بلا أي تعديل. بس تأكد إنه بملف `tsconfig.json` عندك `"allowJs": true` (أو خليها زي ما هي إذا ما في تعارض).

## 2) ثبت axios إذا مش موجود
```bash
pnpm add axios
```

## 3) لف الـ App بالـ Providers
بملف `src/main.tsx` أو `src/App.tsx`، لازم `AuthProvider` و `ToastProvider` يلفوا كل التطبيق:

```jsx
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

<ToastProvider>
  <AuthProvider>
    <App />
  </AuthProvider>
</ToastProvider>
```

## 4) ضيف الـ Routes
بملف الراوتينج (غالبًا `App.tsx`):

```jsx
import AuthForms from './pages/Auth/AuthForms';
import GoogleCallback from './pages/Auth/GoogleCallback';
import GuardianApprove from './pages/Auth/GuardianApprove';

<Route path="/login" element={<AuthForms defaultTab="login" />} />
<Route path="/register" element={<AuthForms defaultTab="register" />} />
<Route path="/auth/google/callback" element={<GoogleCallback />} />
<Route path="/guardian/approve" element={<GuardianApprove />} />
```

## 5) تأكد من الـ Backend URL
بملف `src/config/api.js` الـ baseURL مثبت على:
```
http://localhost:3000/api/v1
```
إذا الباك شغال على بورت تاني، عدلها هون (والأفضل بعدين تحطها بمتغير بيئة `VITE_API_URL`).

## 6) شرط أساسي بالباك (Backend)
عشان الـ cookies (`refresh_token`, `csrf_token`) والـ CORS يشتغلوا صح، لازم السيرفر يكون معد بـ:
- `Access-Control-Allow-Origin` = عنوان الفرونت بالضبط (مش `*`) — مثلاً `http://localhost:5173`
- `Access-Control-Allow-Credentials: true`
- الكوكيز نفسها لازم تكون `httpOnly` + `SameSite=Lax` (أو `None` + `Secure` إذا عم تجرب https)

إذا هاي الإعدادات مش مضبوطة بالباك، رح تشوف إنه الـ login عم ينجح (status 200) بس بعدها كل request بيرجع 401 لأنه الكوكي ما وصل.

## 7) جرب
```bash
pnpm dev
```
افتح `/login`، جرب تسجل دخول بحساب تجريبي، وتابع الـ Console — الملف `api.js` مليان `console.log` (✅/❌) يساعدك تعرف وين المشكلة إذا صارت.

## أشياء لسا ناقصة لو حبيت تكمل لاحقًا
- `AuthForms.jsx` بيستخدم class names عادية (`auth-card`, `form-stack`, `field-group`, `btn-primary`...) مش Tailwind classes — يعني التصميم رح يطلع بلا ستايل لحتى تضيفلهم CSS أو تحولهم Tailwind. هاد طبيعي بما إنه هاد كود تجريبي من صاحبك للتأكد من الباك بس.
- `UserProfile.jsx` و `CourseCatalog.jsx` يلي بعتهم كمان ما وصلناهم لسا — إذا بدك ندمجهم قلي.
