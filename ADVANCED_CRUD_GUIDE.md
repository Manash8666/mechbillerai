# 🚀 Advanced CRUD Operations Guide

## ✨ **What's New - Advanced CRUD Features**

We've upgraded from basic CRUD to **enterprise-level** CRUD operations with:

### **10 Major Enhancements:**
1. ✅ **Pagination** - Handle large datasets efficiently
2. ✅ **Advanced Filtering** - Multiple filter criteria
3. ✅ **Full-Text Search** - Search across multiple fields
4. ✅ **Sorting** - Ascending/descending on any field
5. ✅ **Bulk Operations** - Delete/update multiple records
6. ✅ **Input Validation** - Comprehensive validation
7. ✅ **Error Handling** - Detailed error messages
8. ✅ **Activity Logging** - Audit trail for all operations
9. ✅ **Relationship Loading** - Include related data
10. ✅ **Statistics** - Calculated metrics and counts

---

## 📚 **API Documentation**

### **1. List Customers (GET /api/customers)**

#### **Basic Usage:**
```http
GET /api/customers?userId=xxx
```

#### **Advanced Usage with All Features:**
```http
GET /api/customers?userId=xxx
  &page=1                    // Pagination: page number
  &limit=20                  // Pagination: items per page
  &search=John               // Search: across name, email, phone, GST, address
  &sortBy=name               // Sort: by field name
  &sortOrder=asc             // Sort: asc or desc
  &hasVehicles=true          // Filter: customers with vehicles
  &hasGst=true               // Filter: customers with GST number
  &createdFrom=2024-01-01    // Filter: created date range start
  &createdTo=2024-12-31      // Filter: created date range end
```

#### **Response:**
```json
{
  "data": [
    {
      "id": "xxx",
      "name": "John Doe",
      "phone": "+91 98765 43210",
      "email": "john@example.com",
      "address": "123 Street, Ahmedabad",
      "gstNumber": "24AABCU9603R1ZV",
      "vehicles": [
        {
          "id": "yyy",
          "registrationNo": "GJ-01-AB-1234",
          "make": "Maruti",
          "model": "Swift",
          "year": 2020
        }
      ],
      "_count": {
        "jobCards": 5,
        "invoices": 3
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### **2. Get Single Customer (GET /api/customers/[id])**

#### **Basic Usage:**
```http
GET /api/customers/xxx
```

#### **With Full History:**
```http
GET /api/customers/xxx?includeHistory=true
```

#### **Response:**
```json
{
  "id": "xxx",
  "name": "John Doe",
  "phone": "+91 98765 43210",
  "email": "john@example.com",
  "address": "123 Street, Ahmedabad",
  "gstNumber": "24AABCU9603R1ZV",
  "vehicles": [...],
  "invoices": [...],
  "jobCards": [...],
  "_count": {
    "invoices": 15,
    "jobCards": 20,
    "vehicles": 2
  },
  "statistics": {
    "totalRevenue": 50000,
    "pendingAmount": 5000,
    "completedJobs": 18,
    "totalJobs": 20,
    "totalInvoices": 15,
    "totalVehicles": 2
  }
}
```

---

### **3. Create Customer (POST /api/customers)**

#### **Request:**
```http
POST /api/customers
Content-Type: application/json

{
  "userId": "xxx",
  "name": "John Doe",
  "phone": "+91 9876543210",
  "email": "john@example.com",
  "address": "123 Street, Ahmedabad",
  "gstNumber": "24AABCU9603R1ZV"
}
```

#### **Validation Rules:**
- ✅ **Required:** name, phone, userId
- ✅ **Email:** Valid email format (if provided)
- ✅ **Phone:** Indian format (10 digits starting with 6-9)
- ✅ **Duplicate Check:** Phone and email must be unique per user
- ✅ **GST Format:** Valid GST format (if provided)

#### **Success Response (201):**
```json
{
  "id": "xxx",
  "name": "John Doe",
  "phone": "+91 9876543210",
  ...
}
```

#### **Error Responses:**

**Validation Error (400):**
```json
{
  "error": "Field 'name' is required",
  "code": "VALIDATION_ERROR",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Duplicate Error (409):**
```json
{
  "error": "Customer with this phone already exists",
  "code": "DUPLICATE_CUSTOMER",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### **4. Update Customer (PUT /api/customers/[id])**

#### **Request:**
```http
PUT /api/customers/xxx
Content-Type: application/json

{
  "userId": "yyy",
  "name": "John Doe Updated",
  "phone": "+91 9876543210",
  "email": "newemail@example.com",
  "address": "New Address",
  "notes": "VIP customer"
}
```

#### **Features:**
- ✅ Partial updates (send only changed fields)
- ✅ Validation on all fields
- ✅ Duplicate check (excluding current record)
- ✅ Activity logging
- ✅ Returns updated record with relationships

---

### **5. Delete Customer (DELETE /api/customers/[id])**

#### **Simple Delete:**
```http
DELETE /api/customers/xxx?userId=yyy
```

#### **Force Delete (with related data):**
```http
DELETE /api/customers/xxx?userId=yyy&force=true
```

#### **Safety Features:**
- ⚠️ Checks for related data (vehicles, jobs, invoices)
- ⚠️ Requires `force=true` if related data exists
- ✅ Returns count of deleted related records
- ✅ Logs deletion activity

#### **Response with Related Data:**
```json
{
  "error": "Customer has related data. Use force=true to delete anyway.",
  "code": "HAS_RELATED_DATA",
  "details": {
    "vehicles": 2,
    "jobCards": 5,
    "invoices": 3
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### **6. Bulk Delete (DELETE /api/customers)**

#### **Request:**
```http
DELETE /api/customers?userId=xxx&ids=id1,id2,id3
```

#### **Response:**
```json
{
  "success": true,
  "deleted": 3,
  "message": "Successfully deleted 3 customer(s)"
}
```

---

## 🎯 **Query Parameter Reference**

### **Pagination:**
```
page=1          // Page number (default: 1)
limit=10        // Items per page (default: 10, max: 100)
```

### **Search:**
```
search=john     // Search across multiple fields
```

**Searchable Fields (Customers):**
- name
- email
- phone
- gstNumber
- address

### **Sorting:**
```
sortBy=name         // Field to sort by
sortOrder=asc       // asc (ascending) or desc (descending)
```

**Sortable Fields (Customers):**
- name
- email
- phone
- createdAt
- updatedAt

### **Filters:**

#### **Boolean Filters:**
```
hasVehicles=true    // true, false, or omit
hasGst=true         // true, false, or omit
```

#### **Date Range Filters:**
```
createdFrom=2024-01-01    // ISO date format
createdTo=2024-12-31      // ISO date format
```

#### **Custom Filters:**
```
status=active             // Exact match
name_contains=john        // Partial match (case-insensitive)
amount_from=1000          // Greater than or equal
amount_to=5000            // Less than or equal
category_in=A,B,C         // In list
```

---

## 📊 **Response Formats**

### **Success Response:**
```json
{
  "data": [...],              // Array of records
  "pagination": {             // Only for list endpoints
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### **Error Response:**
```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {...},           // Optional: additional error details
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🔐 **Error Codes**

### **Client Errors (4xx):**
- `MISSING_USER_ID` (400) - User ID not provided
- `VALIDATION_ERROR` (400) - Input validation failed
- `INVALID_EMAIL` (400) - Email format invalid
- `INVALID_PHONE` (400) - Phone format invalid
- `MISSING_IDS` (400) - No IDs provided for bulk operation
- `NOT_FOUND` (404) - Resource not found
- `DUPLICATE_CUSTOMER` (409) - Duplicate phone/email
- `HAS_RELATED_DATA` (409) - Cannot delete due to relationships

### **Server Errors (5xx):**
- `SERVER_ERROR` (500) - Internal server error

---

## 🧪 **Testing Examples**

### **Example 1: Search Customers**
```bash
curl "http://localhost:3000/api/customers?userId=xxx&search=john&page=1&limit=10"
```

### **Example 2: Filter by Date Range**
```bash
curl "http://localhost:3000/api/customers?userId=xxx&createdFrom=2024-01-01&createdTo=2024-12-31"
```

### **Example 3: Sort by Name**
```bash
curl "http://localhost:3000/api/customers?userId=xxx&sortBy=name&sortOrder=asc"
```

### **Example 4: Get Customers with Vehicles**
```bash
curl "http://localhost:3000/api/customers?userId=xxx&hasVehicles=true"
```

### **Example 5: Create Customer**
```bash
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "xxx",
    "name": "John Doe",
    "phone": "+91 9876543210",
    "email": "john@example.com"
  }'
```

### **Example 6: Update Customer**
```bash
curl -X PUT http://localhost:3000/api/customers/xxx \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "yyy",
    "name": "John Doe Updated"
  }'
```

### **Example 7: Bulk Delete**
```bash
curl -X DELETE "http://localhost:3000/api/customers?userId=xxx&ids=id1,id2,id3"
```

---

## 📋 **Advanced Features Explained**

### **1. Pagination**
**Why:** Prevents loading thousands of records at once
**How:** Returns fixed number of items per page
**Benefit:** Fast performance even with large datasets

### **2. Full-Text Search**
**Why:** Users need to find data quickly
**How:** Searches across multiple fields simultaneously
**Benefit:** Better user experience

### **3. Advanced Filtering**
**Why:** Users need specific subsets of data
**How:** Multiple filter criteria combined
**Benefit:** Precise data retrieval

### **4. Sorting**
**Why:** Users want data in specific order
**How:** Sort by any field, ascending or descending
**Benefit:** Organized data presentation

### **5. Bulk Operations**
**Why:** Manage multiple records efficiently
**How:** Single API call for multiple items
**Benefit:** Time-saving for admins

### **6. Input Validation**
**Why:** Prevent bad data in database
**How:** Validate all inputs before saving
**Benefit:** Data integrity

### **7. Error Handling**
**Why:** Clear feedback on what went wrong
**How:** Descriptive error codes and messages
**Benefit:** Easy debugging

### **8. Activity Logging**
**Why:** Track who did what and when
**How:** Log all create/update/delete operations
**Benefit:** Audit trail and accountability

### **9. Relationship Loading**
**Why:** Get related data in single request
**How:** Include vehicles, invoices, job cards
**Benefit:** Fewer API calls

### **10. Statistics**
**Why:** Quick insights and metrics
**How:** Calculate totals, counts, averages
**Benefit:** Dashboard-ready data

---

## 🎯 **Best Practices**

### **1. Always Use Pagination**
```javascript
// Good
fetch('/api/customers?userId=xxx&page=1&limit=20')

// Bad (loads all records)
fetch('/api/customers?userId=xxx')
```

### **2. Search Before Filtering**
```javascript
// Good (narrow down first, then filter)
fetch('/api/customers?userId=xxx&search=john&hasVehicles=true')
```

### **3. Sort for Better UX**
```javascript
// Good (alphabetical order)
fetch('/api/customers?userId=xxx&sortBy=name&sortOrder=asc')
```

### **4. Handle Errors Gracefully**
```javascript
try {
  const response = await fetch('/api/customers', {...});
  if (!response.ok) {
    const error = await response.json();
    console.error('Error:', error.error, error.code);
  }
} catch (error) {
  console.error('Network error:', error);
}
```

### **5. Use Bulk Operations**
```javascript
// Good (single request)
fetch(`/api/customers?userId=xxx&ids=${ids.join(',')}`, {
  method: 'DELETE'
})

// Bad (multiple requests)
ids.forEach(id => {
  fetch(`/api/customers/${id}`, { method: 'DELETE' })
})
```

---

## 🚀 **Performance Tips**

1. **Use pagination** - Don't load all records
2. **Limit included relations** - Only load what you need
3. **Use indexes** - Database indexes on searchable fields
4. **Cache when possible** - Cache frequently accessed data
5. **Batch operations** - Use bulk endpoints for multiple items

---

## ✨ **Summary**

### **Before (Basic CRUD):**
- Simple list/create/update/delete
- No pagination (loads all records)
- No search or filters
- No validation
- Basic error messages
- No activity logging

### **After (Advanced CRUD):**
- ✅ Pagination for large datasets
- ✅ Full-text search across fields
- ✅ Advanced filtering (10+ filter types)
- ✅ Sorting (any field, any direction)
- ✅ Bulk operations (delete multiple)
- ✅ Comprehensive validation
- ✅ Detailed error handling
- ✅ Activity logging
- ✅ Statistics and metrics
- ✅ Relationship loading

---

**The same advanced features are being applied to ALL entities:**
- Customers ✅ (Completed)
- Invoices (Next)
- Job Cards (Next)
- Inventory (Next)
- Appointments (Next)

---

**Your CRUD operations are now enterprise-ready! 🎉**
