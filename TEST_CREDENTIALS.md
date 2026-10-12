# 🔐 Test Credentials & Sample Data

## 🎯 Quick Access

### **Test Account #1 (Full Sample Data - Four-Wheeler Garage)**
```
URL:      http://localhost:3000/login
Email:    test@garagesaas.com
Password: test123
License:  TEST-1234-ABCD-5678
Status:   Active (Lifetime)
Type:     🚗 Four-Wheeler (Cars & SUVs)
```

### **Demo Account #2 (Empty - Two-Wheeler Garage)**
```
URL:      http://localhost:3000/login
Email:    demo@garagesaas.com
Password: test123
License:  DEMO-9876-WXYZ-4321
Status:   Active (Lifetime)
Type:     🏍️ Two-Wheeler (Bikes & Scooters)
```

---

## 📊 Sample Data (Test Account)

### **Customers (3)**
1. **Rahul Patel**
   - Phone: +91 98765 11111
   - Email: rahul@example.com
   - Address: 123 Ellis Bridge, Ahmedabad
   - GST: 24AABCU9603R1ZV
   - Vehicle: GJ-01-AB-1234 (Maruti Swift)

2. **Priya Shah**
   - Phone: +91 98765 22222
   - Email: priya@example.com
   - Address: 456 CG Road, Ahmedabad
   - Vehicle: GJ-01-CD-5678 (Hyundai i20)

3. **Amit Desai**
   - Phone: +91 98765 33333
   - Email: amit@example.com
   - Address: 789 Satellite, Ahmedabad
   - Vehicle: GJ-01-EF-9012 (Honda City)

---

### **Job Cards (2)**

#### Job #1 - In Progress
- **Job Number**: JOB-2410-0001
- **Customer**: Rahul Patel
- **Vehicle**: GJ-01-AB-1234 (Maruti Swift)
- **Status**: In Progress
- **Priority**: High
- **Service**: Oil change and general service
- **Estimated Cost**: ₹2,500
- **Tasks**:
  - ✅ Engine oil change
  - ✅ Oil filter replacement
  - ⏳ Air filter check
  - ⏳ Brake inspection

#### Job #2 - Completed
- **Job Number**: JOB-2410-0002
- **Customer**: Priya Shah
- **Vehicle**: GJ-01-CD-5678 (Hyundai i20)
- **Status**: Completed
- **Priority**: Normal
- **Service**: Tire rotation and alignment
- **Actual Cost**: ₹1,500
- **Tasks**: All completed ✅

---

### **Invoices (2)**

#### Invoice #1 - Paid
- **Invoice Number**: INV-2410-0001
- **Customer**: Priya Shah
- **Job Card**: JOB-2410-0002
- **Total**: ₹1,500.00
- **Paid**: ₹1,500.00
- **Balance**: ₹0.00
- **Status**: Paid (UPI)
- **Items**:
  - Tire Rotation Service: ₹944.00
  - Wheel Alignment: ₹556.00

#### Invoice #2 - Partial Payment
- **Invoice Number**: INV-2410-0002
- **Customer**: Amit Desai
- **Total**: ₹5,000.00
- **Paid**: ₹2,000.00 (Advance)
- **Balance**: ₹3,000.00
- **Status**: Partial Payment
- **Items**:
  - Brake Pad Replacement: ₹2,950.00
  - Brake Fluid Flush: ₹944.00
  - Labor Charges: ₹1,106.00

---

### **Inventory (5 Items)**

| Item | Code | Stock | Min | Status |
|------|------|-------|-----|--------|
| Engine Oil 5W-30 | OIL-5W30 | 50 ltr | 20 | ✅ Good |
| Oil Filter | FILTER-001 | 30 pcs | 15 | ✅ Good |
| Air Filter | FILTER-002 | 25 pcs | 10 | ✅ Good |
| **Brake Pads** | BRAKE-001 | **8 sets** | **10** | ⚠️ **Low Stock** |
| Coolant | COOL-001 | 40 ltr | 15 | ✅ Good |

---

### **Appointments (2)**

#### Appointment #1 - Tomorrow
- **Customer**: Rahul Patel
- **Service**: General Service
- **Date**: Tomorrow, 10:00 AM - 12:00 PM
- **Bay**: Bay 1
- **Status**: Confirmed
- **Notes**: Complete the pending service tasks

#### Appointment #2 - Next Week
- **Customer**: Amit Desai
- **Service**: Brake Repair
- **Date**: Next week, 2:00 PM - 3:00 PM
- **Bay**: Bay 2
- **Status**: Scheduled
- **Notes**: Final payment and delivery

---

## 🎨 Branding Settings

### Default Branding (Test Account)
- **Garage Name**: ABC Motors
- **Primary Color**: #C9A84C (Luxury Gold)
- **Theme**: Default Oatmeal & Ink

### To Test Custom Branding:
1. Login with test account
2. Go to **Dashboard → Branding** (🎨 icon)
3. Upload a logo
4. Click "Extract Colors from Logo"
5. Save and refresh!

---

## 📈 Dashboard Statistics (Test Account)

Expected numbers:
- **Total Customers**: 3
- **Active Jobs**: 1 (in-progress)
- **Invoices This Month**: 2
- **Today's Appointments**: 0-1 (depends on date)
- **Revenue This Month**: ₹6,500
- **Pending Invoices**: 1 (₹3,000 balance)
- **Low Stock Items**: 1 (Brake Pads)

---

## 🧪 Testing Scenarios

### Test Case 1: Login & Dashboard
```
1. Go to http://localhost:3000/login
2. Enter: test@garagesaas.com / test123
3. Click Login
4. Should see dashboard with statistics
5. Verify: 3 customers, 1 active job, 2 invoices
```

### Test Case 2: View Customers
```
1. Click "Customers" in sidebar
2. Should see 3 customers listed
3. Search for "Rahul" - should filter results
4. Click on a customer to view details
```

### Test Case 3: Check Low Stock Alert
```
1. Go to Dashboard
2. Look at "Alerts" card
3. Should show "Low Stock Items: 1"
4. Navigate to Inventory
5. Brake Pads should be highlighted (8/10)
```

### Test Case 4: Review Job Card
```
1. Click "Job Cards" in sidebar
2. Should see 2 job cards
3. Click on JOB-2410-0001 (In Progress)
4. See tasks: 2 completed, 2 pending
5. Check details and estimated cost
```

### Test Case 5: View Invoices
```
1. Click "Invoices" in sidebar
2. Should see 2 invoices
3. One marked "Paid" (green)
4. One marked "Partial" (orange)
5. Click to view full details
```

### Test Case 6: Check Appointments
```
1. Click "Appointments" in sidebar
2. Should see 2 appointments
3. One for tomorrow (confirmed)
4. One for next week (scheduled)
```

### Test Case 7: Custom Branding
```
1. Click "Branding" in sidebar (🎨 icon)
2. Upload a logo with your brand color
3. Click "Extract Colors from Logo"
4. See generated palette
5. Preview changes
6. Click "Save Branding"
7. Refresh page
8. Entire UI should match your brand!
```

---

## 🔄 Reset Database

To start fresh:

```bash
# Delete database
rm prisma/dev.db

# Recreate and seed
npx prisma db push
npm run db:seed
```

---

## 📝 Additional Test Accounts

You can create more accounts through registration:

1. Go to http://localhost:3000/register
2. Fill in details
3. Get 7-day trial automatically
4. License key shown after registration

---

## 🎯 Feature Testing Checklist

- [ ] Login with test credentials
- [ ] View dashboard statistics
- [ ] Browse customers list
- [ ] Check job cards (in-progress & completed)
- [ ] View paid invoice
- [ ] View partial payment invoice
- [ ] Check inventory low stock alert
- [ ] View appointments
- [ ] Upload logo for branding
- [ ] Extract colors from logo
- [ ] Preview custom theme
- [ ] Save branding
- [ ] Verify theme persistence
- [ ] Test search functionality
- [ ] Check mobile responsive design
- [ ] Test dark mode (if implemented)

---

## 💡 Pro Tips

### For Quick Testing:
- Use **test@garagesaas.com** - Has all sample data
- Use **demo@garagesaas.com** - Clean slate for custom testing

### For Branding Testing:
- Test with red logos → See red theme
- Test with blue logos → See blue theme
- Test with green logos → See green theme
- Any color works! 🎨

### For Development:
- Keep **Prisma Studio** open to view database:
  ```bash
  npx prisma studio
  ```
- View at: http://localhost:5555

---

## 🐛 Troubleshooting

### Can't Login?
```bash
# Re-run seed
npm run db:seed
```

### No Sample Data?
```bash
# Check database
npx prisma studio
# Re-seed if needed
npm run db:seed
```

### Wrong Password?
```
Password is: test123
Case-sensitive!
```

---

## 📞 Quick Commands

```bash
# Start dev server
npm run dev

# Open Prisma Studio
npx prisma studio

# Re-seed database
npm run db:seed

# View database schema
npx prisma format
```

---

## 🎉 Ready to Test!

**Primary Test Account:**
```
Email: test@garagesaas.com
Password: test123
```

**Login URL:**
```
http://localhost:3000/login
```

**Sample data includes everything you need to test all features!** ✨

---

*Last Updated: Database seeded with realistic Ahmedabad garage data*
