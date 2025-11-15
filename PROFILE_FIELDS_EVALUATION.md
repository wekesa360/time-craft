# Profile Fields Evaluation Report

## Summary
This document evaluates the alignment between frontend profile form fields and backend API/database schema.

## Issues Found and Fixed

### ✅ Issue 1: `displayName` Field Mismatch
**Problem:**
- Frontend was sending `displayName` in profile update requests
- Backend schema (`updateUserSchema`) does NOT accept `displayName`
- Database does NOT have a `display_name` column
- This field was being silently ignored by the backend

**Fix Applied:**
- ✅ Removed `displayName` from `ProfileForm` interface
- ✅ Removed `displayName` input field from SettingsPage
- ✅ Updated form reset logic to exclude `displayName`
- ✅ Updated display logic to use `firstName + lastName` instead
- ✅ Updated frontend `User` type to remove `displayName`

### ✅ Issue 2: `preferredLanguage` Validation Mismatch
**Problem:**
- Frontend User type allowed: `'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'ja' | 'ko' | 'zh'`
- Backend schema only accepts: `'en' | 'de'`
- If user selected other languages, backend would reject with validation error

**Fix Applied:**
- ✅ Updated frontend `User` type to only allow `'en' | 'de'` (matching backend)
- ✅ Frontend dropdown already only showed 'en' and 'de', so no UI changes needed

## Fields That Match Correctly

### ✅ `firstName`
- **Frontend:** Sends as `firstName` (camelCase)
- **Backend:** Accepts `firstName`, converts to `first_name` (snake_case) for database
- **Database:** Stores as `first_name`
- **Status:** ✅ Working correctly

### ✅ `lastName`
- **Frontend:** Sends as `lastName` (camelCase)
- **Backend:** Accepts `lastName`, converts to `last_name` (snake_case) for database
- **Database:** Stores as `last_name`
- **Status:** ✅ Working correctly

### ✅ `timezone`
- **Frontend:** Sends as `timezone` (camelCase)
- **Backend:** Accepts `timezone`, validates against known timezone patterns
- **Database:** Stores as `timezone`
- **Status:** ✅ Working correctly

### ✅ `preferredLanguage`
- **Frontend:** Sends as `preferredLanguage` (camelCase), now limited to `'en' | 'de'`
- **Backend:** Accepts `preferredLanguage`, converts to `preferred_language` (snake_case) for database
- **Database:** Stores as `preferred_language`
- **Status:** ✅ Fixed and working correctly

## Current Profile Form Fields

The profile form now only includes fields that are:
1. ✅ Accepted by backend validation schema
2. ✅ Stored in the database
3. ✅ Properly transformed between camelCase (frontend) and snake_case (backend/database)

### Fields in Profile Form:
1. `firstName` - ✅ Validated, stored, working
2. `lastName` - ✅ Validated, stored, working
3. `timezone` - ✅ Validated, stored, working
4. `preferredLanguage` - ✅ Validated, stored, working (now limited to 'en' | 'de')

### Fields NOT in Profile Form (but in User type):
- `email` - Displayed but not editable (correct behavior)
- `subscriptionType` - Managed separately
- `isStudent` - Managed separately
- `avatar` - Managed via separate upload endpoint

## Backend API Endpoint Details

### PUT `/api/user/profile`
**Accepts (camelCase):**
```typescript
{
  firstName?: string;        // min 1, max 50
  lastName?: string;        // min 1, max 50
  timezone?: string;        // validated against timezone patterns
  preferredLanguage?: 'en' | 'de';
}
```

**Converts to (snake_case for database):**
```typescript
{
  first_name?: string;
  last_name?: string;
  timezone?: string;
  preferred_language?: 'en' | 'de';
}
```

**Returns:**
- User object from database (snake_case) - Note: This may need transformation to camelCase for frontend

## Recommendations

### ⚠️ Potential Issue: Response Format
The backend `/api/user/profile` endpoint returns the user object directly from the database (snake_case), but the frontend expects camelCase. 

**Current State:**
- Backend returns: `{ first_name, last_name, preferred_language, ... }`
- Frontend expects: `{ firstName, lastName, preferredLanguage, ... }`

**Recommendation:**
The backend should transform the response to camelCase, similar to how `sanitizeUser` function does in `auth.ts`. Alternatively, the frontend API client should handle the transformation.

## Testing Checklist

- [ ] Profile update with firstName works
- [ ] Profile update with lastName works
- [ ] Profile update with timezone works
- [ ] Profile update with preferredLanguage ('en' or 'de') works
- [ ] Profile update with preferredLanguage (other values) is rejected
- [ ] displayName is no longer sent in requests
- [ ] Profile display shows firstName + lastName correctly

