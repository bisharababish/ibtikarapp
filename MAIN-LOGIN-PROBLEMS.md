# Main Login Problems - Analysis

## File: `contexts/AuthContext.tsx`

This is the **main file** with all the login logic. Here are the core problems:

---

## 🔴 Problem #1: Callback URL Validation Too Strict (Line 44-49)

**Location:** `contexts/AuthContext.tsx:44-49`

```typescript
if (!url.startsWith("ibtikar://") || !url.includes("oauth/callback")) {
    console.log("⚠️ Invalid callback URL format");
    return; // ❌ REJECTS VALID CALLBACKS
}
```

**Issue:**
- Only accepts URLs starting with `ibtikar://`
- Web callbacks come as URL params (e.g., `?success=true&user_id=1`)
- The web detection (line 163) constructs an `ibtikar://` URL as a workaround, but this is fragile
- If a callback comes in a different format, it gets rejected

**Impact:** Callbacks might be silently rejected if they don't match the exact format.

---

## 🔴 Problem #2: Web Redirect Doesn't Clear Timeout (Line 304-307)

**Location:** `contexts/AuthContext.tsx:304-307`

```typescript
if (typeof window !== "undefined" && window.location) {
    window.location.href = oauthUrl;
    return; // ❌ Returns early without clearing timeout
}
```

**Issue:**
- On web, redirects and returns early
- The 30-second timeout (line 274) is never cleared
- After 30 seconds, `isLoggingIn` gets reset to `false` even if callback is processing
- This causes the login state to reset prematurely

**Impact:** Web login might appear to fail even if the callback is processing.

---

## 🔴 Problem #3: Deep Links Unreliable in Expo Go

**Location:** `contexts/AuthContext.tsx:187-225` (Deep link listeners)

**Issue:**
- Deep links (`ibtikar://oauth/callback`) don't work reliably in Expo Go
- The `Linking.addEventListener` might not fire consistently
- Polling fallback exists but might not trigger correctly

**Impact:** Mobile login gets stuck because deep link never arrives.

---

## 🔴 Problem #4: Polling Fallback May Not Work

**Location:** `contexts/AuthContext.tsx:399-447` (Polling interval)

**Issue:**
- Polling starts only if `result.url` is missing (line 360)
- But if `result.type` is something unexpected, polling might not start
- The polling interval might get cleared prematurely
- No guarantee the backend has processed the OAuth callback when polling starts

**Impact:** Even with polling, login might not complete if timing is off.

---

## 🔴 Problem #5: Web Callback Detection Might Run Too Early

**Location:** `contexts/AuthContext.tsx:148-185` (Web callback detection)

**Issue:**
- Checks URL params on component mount
- But if the page hasn't fully loaded after redirect, params might not be available
- The `popstate` listener might not fire for programmatic redirects
- Race condition: callback might be processed before `isLoggingIn` is set

**Impact:** Web login might miss the callback if timing is wrong.

---

## 🟡 Problem #6: No Error Recovery

**Location:** Throughout the file

**Issue:**
- If any step fails, the login state might get stuck
- No automatic retry mechanism
- User has to manually cancel and try again
- Errors are logged but not always shown to user

**Impact:** User experience is poor when things go wrong.

---

## 📋 Summary

**Main File:** `contexts/AuthContext.tsx`

**Critical Issues:**
1. ✅ **Callback URL validation too strict** - might reject valid callbacks
2. ✅ **Web timeout not cleared** - causes premature state reset
3. ✅ **Deep links unreliable** - mobile login fails
4. ✅ **Polling timing issues** - fallback might not work
5. ✅ **Web callback race conditions** - might miss callbacks

**Root Cause:** The OAuth flow relies heavily on deep links which are unreliable, and the fallback mechanisms (polling, web detection) have timing/validation issues.

---

## 🔧 Recommended Fixes

1. **Make callback validation more flexible** - accept both `ibtikar://` and URL params
2. **Clear timeout on web redirect** - store timeout ID and clear it
3. **Start polling immediately** - don't wait for deep link to fail
4. **Improve web callback detection** - check params more frequently
5. **Add better error recovery** - automatic retry with exponential backoff

