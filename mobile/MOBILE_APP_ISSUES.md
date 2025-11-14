# Mobile App Issues Assessment

## Overview
This document outlines all identified issues in the mobile app that need to be fixed to ensure proper functionality.

## Critical Issues

### 1. **Duplicate API Clients** ⚠️ CRITICAL
**Problem:** Two API client files exist:
- `mobile/lib/api-client.ts` - Used by most pages
- `mobile/lib/api.ts` - Alternative implementation

**Impact:** 
- Confusion about which client to use
- Inconsistent API calls across the app
- Potential conflicts

**Files Affected:**
- All pages using `apiClient` from `api-client.ts`
- Some pages might be using `api.ts` instead

**Solution:**
- Consolidate into a single API client
- Ensure all imports use the same client
- Align with backend API structure

---

### 2. **API Endpoint Mismatches** ⚠️ CRITICAL
**Problem:** Mobile app uses different endpoint paths than backend expects.

**Examples:**
- Mobile: `GET /api/tasks` → Backend: `GET /api/tasks` ✅ (correct)
- Mobile: `GET /api/dashboard` → Backend: `GET /api/dashboard` ✅ (needs verification)
- Mobile: `GET /health/stats` → Backend: `GET /api/health/stats` ❌ (missing `/api` prefix)
- Mobile: `GET /focus/templates` → Backend: `GET /api/focus/templates` ❌ (missing `/api` prefix)
- Mobile: `POST /tasks` → Backend: `POST /api/tasks` ❌ (missing `/api` prefix in `api.ts`)

**Files Affected:**
- `mobile/lib/api-client.ts` - Uses `/api/` prefix ✅
- `mobile/lib/api.ts` - Missing `/api/` prefix in some methods ❌
- `mobile/app/(tabs)/health.tsx` - Uses `apiClient.get('/health/stats')` ❌
- `mobile/app/(tabs)/focus.tsx` - Uses `apiClient.get('/focus/templates')` ❌

**Solution:**
- Ensure all endpoints use `/api/` prefix
- Update all direct API calls to use correct paths
- Standardize on `api-client.ts` or update `api.ts` to match

---

### 3. **Response Format Mismatches** ⚠️ CRITICAL
**Problem:** Mobile app expects different response formats than backend returns.

**Backend Response Formats:**
```typescript
// Tasks
GET /api/tasks → { tasks: Task[], hasMore: boolean, nextCursor?: string, total?: number }

// Single Task
GET /api/tasks/{id} → { task: Task }

// Dashboard
GET /api/dashboard → { taskStats: {...}, focusStats: {...}, ... }

// Health Logs
GET /api/health/logs → { logs: HealthLog[], ... }
```

**Mobile App Expectations:**
```typescript
// Tasks (api-client.ts)
getTasks() → expects { tasks: Task[] } ✅ (correct)

// Tasks (tasks.tsx)
expects response.tasks ✅ (correct)

// Dashboard (dashboard.tsx)
expects response.taskStats, response.focusStats ✅ (correct)

// Health Logs (health.tsx)
expects response.logs ✅ (correct)

// Focus Sessions (focus.tsx)
expects response.sessions ✅ (needs verification)
```

**Files Affected:**
- `mobile/app/(tabs)/tasks.tsx` - Line 39: `response.tasks` ✅
- `mobile/app/(tabs)/dashboard.tsx` - Lines 48-49, 58-59: Response handling
- `mobile/app/(tabs)/health.tsx` - Line 47: `response.logs`
- `mobile/app/(tabs)/focus.tsx` - Lines 62, 72, 82: Response handling

**Solution:**
- Verify all response formats match backend
- Update response extraction logic where needed
- Add proper error handling for missing data

---

### 4. **Task Status Value Mismatch** ⚠️ HIGH
**Problem:** Mobile uses different status values than backend.

**Mobile App:**
- `'pending'` ✅
- `'in_progress'` ❌
- `'completed'` ❌

**Backend API:**
- `'pending'` ✅
- `'done'` ❌ (mobile uses 'completed')
- `'archived'` ❌ (not used in mobile)

**Files Affected:**
- `mobile/types/index.ts` - Line 53: `status: 'pending' | 'in_progress' | 'completed'`
- `mobile/app/(tabs)/tasks.tsx` - Lines 22, 79, 86-110: Status filtering and toggling
- `mobile/app/modals/add-task.tsx` - Status not set (defaults to 'pending')

**Solution:**
- Update TypeScript types to match backend: `'pending' | 'done' | 'archived'`
- Update all status checks and filters
- Map 'completed' → 'done' in UI if needed, or update backend to accept 'completed'
- Remove 'in_progress' or map it appropriately

---

### 5. **Dashboard Stats API Issues** ⚠️ MEDIUM
**Problem:** Dashboard expects specific response structure.

**Current Implementation:**
```typescript
// dashboard.tsx line 48
const response = await apiClient.getDashboardStats();
return response; // Expects: { taskStats: {...}, focusStats: {...}, ... }
```

**Backend API:**
- Need to verify exact response format from `/api/dashboard`
- May need to transform response data

**Files Affected:**
- `mobile/app/(tabs)/dashboard.tsx` - Lines 45-52, 69-76
- `mobile/lib/api-client.ts` - Lines 202-210: `getDashboardStats()` and `getRecentActivities()`

**Solution:**
- Verify backend response format
- Update response extraction if needed
- Add proper error handling

---

### 6. **Health Logs API Issues** ⚠️ MEDIUM
**Problem:** Health logs endpoint may not match backend structure.

**Current Implementation:**
```typescript
// health.tsx line 44
const response = await apiClient.getHealthLogs({ limit: ... });
return response.logs || [];
```

**Backend API:**
- Need to verify `/api/health/logs` endpoint exists
- Verify response format: `{ logs: HealthLog[], ... }`

**Files Affected:**
- `mobile/app/(tabs)/health.tsx` - Lines 41-50, 56-60
- `mobile/lib/api-client.ts` - Lines 240-252: Health methods

**Solution:**
- Verify backend health endpoints
- Update response handling if needed
- Add error handling for missing endpoints

---

### 7. **Focus Sessions API Issues** ⚠️ MEDIUM
**Problem:** Focus session endpoints may not match backend.

**Current Implementation:**
```typescript
// focus.tsx line 61
const response = await apiClient.get('/focus/templates');
return response.data.templates || [];
```

**Issues:**
- Missing `/api/` prefix
- Response format: `response.data.templates` vs backend format

**Files Affected:**
- `mobile/app/(tabs)/focus.tsx` - Lines 58-65, 68-75, 78-85
- `mobile/lib/api-client.ts` - Lines 255-272: Focus methods

**Solution:**
- Fix endpoint paths (add `/api/` prefix)
- Verify response formats
- Update response extraction

---

### 8. **Task Creation/Update Issues** ⚠️ MEDIUM
**Problem:** Task creation may not match backend API format.

**Current Implementation:**
```typescript
// add-task.tsx line 52
apiClient.createTask({
  title: task.title,
  description: task.description,
  priority: task.priority,
  dueDate: task.dueDate,
  estimatedDuration: task.estimatedDuration,
});
```

**Backend API:**
- Expects: `POST /api/tasks` with TaskForm data
- May need field name transformations (camelCase vs snake_case)

**Files Affected:**
- `mobile/app/modals/add-task.tsx` - Task creation
- `mobile/app/(tabs)/tasks.tsx` - Task updates
- `mobile/lib/api-client.ts` - Lines 213-237: Task methods

**Solution:**
- Verify field names match backend
- Add field transformations if needed
- Test create/update operations

---

## Medium Priority Issues

### 9. **Missing Error Handling**
- Many API calls lack proper error handling
- No user-friendly error messages
- Network errors not handled gracefully

### 10. **Loading States**
- Some pages don't show loading indicators
- No skeleton screens during data fetching

### 11. **Type Safety**
- Some API responses use `any` type
- Missing proper TypeScript interfaces for some responses

---

## Low Priority Issues

### 12. **Code Duplication**
- Similar API call patterns repeated across files
- Could benefit from custom hooks

### 13. **Hardcoded Values**
- Some API base URLs hardcoded
- Should use environment variables

---

## Testing Checklist

- [ ] Login/Register flow
- [ ] Dashboard loads and displays data
- [ ] Tasks page loads tasks
- [ ] Create task works
- [ ] Update task status works
- [ ] Delete task works
- [ ] Health page loads logs
- [ ] Create health log works
- [ ] Focus page loads templates
- [ ] Start focus session works
- [ ] Profile page loads user data
- [ ] All API calls use correct endpoints
- [ ] All response formats handled correctly
- [ ] Error states handled gracefully
- [ ] Loading states shown appropriately

---

## Recommended Fix Order

1. **Fix API client conflicts** (Issue #1)
2. **Fix API endpoint mismatches** (Issue #2)
3. **Fix response format handling** (Issue #3)
4. **Fix task status values** (Issue #4)
5. **Fix dashboard stats** (Issue #5)
6. **Fix health logs** (Issue #6)
7. **Fix focus sessions** (Issue #7)
8. **Test all pages** (Issue #9)

---

## Notes

- Backend API base URL: `http://localhost:8787` (dev) or `http://10.0.2.2:8787` (Android emulator)
- All backend endpoints use `/api/` prefix
- Backend uses snake_case for some fields, mobile uses camelCase
- Need to verify all endpoints exist in backend

