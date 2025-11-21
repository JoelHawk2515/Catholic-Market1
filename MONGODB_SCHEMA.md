# MongoDB Collections Structure

## Collections

### 1. `admins` Collection
Stores administrator accounts with hashed passwords.

**Schema:**
```javascript
{
  _id: ObjectId,
  username: String (unique, lowercase),
  password: String (bcrypt hashed),
  email: String (optional),
  role: String ('admin' | 'superadmin'),
  active: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `username` (unique)

**Methods:**
- `comparePassword(candidatePassword)` - Compares plain text password with hashed

---

### 2. `businesses` Collection
Stores approved businesses displayed on the map.

**Schema:**
```javascript
{
  _id: ObjectId,
  name: String (required),
  address: String (required),
  lat: Number (required),
  lng: Number (required),
  owner: String (optional),
  phone: String (optional),
  email: String (optional),
  website: String (optional),
  category: String (optional),
  description: String (optional),
  tags: [String] (array),
  parishId: ObjectId (ref: Parish, optional),
  verified: Boolean (default: false),
  imageUrl: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `lat` + `lng` (for geospatial queries)
- `verified`

---

### 3. `parishes` Collection
Stores Catholic parish information.

**Schema:**
```javascript
{
  _id: ObjectId,
  name: String (required),
  address: String (required),
  city: String (required),
  state: String (required),
  lat: Number (required),
  lng: Number (required),
  phone: String (optional),
  website: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `lat` + `lng` (for geospatial queries)
- `city`

---

### 4. `submissions` Collection
Stores pending business submissions from users.

**Schema:**
```javascript
{
  _id: ObjectId,
  name: String (required),
  address: String (required),
  city: String (optional),
  owner: String (optional),
  phone: String (optional),
  email: String (optional),
  website: String (optional),
  category: String (optional),
  description: String (optional),
  tags: String (comma-separated),
  parishId: ObjectId (ref: Parish, optional),
  parishName: String (optional),
  status: String ('pending' | 'approved' | 'rejected'),
  submittedAt: Date,
  reviewedAt: Date (optional),
  reviewedBy: ObjectId (ref: Admin, optional),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `status`
- `submittedAt` (descending)

---

### 5. `sessions` Collection
Stores Express session data (managed by `connect-mongo`).

**Schema:** (Auto-managed by connect-mongo)
```javascript
{
  _id: String (session ID),
  expires: Date,
  session: Object (serialized session data)
}
```

---

## Migration Notes

- Old `id` fields (integers) are replaced with MongoDB `_id` (ObjectId)
- API responses format `_id` as `id` for frontend compatibility
- Tags converted from comma-separated strings to arrays in Business schema
- Parish references use ObjectId instead of integer IDs
- All passwords are hashed with bcrypt (10 rounds)

---

## Querying Examples

### Find businesses in a bounding box:
```javascript
Business.find({
  lat: { $gte: minLat, $lte: maxLat },
  lng: { $gte: minLng, $lte: maxLng }
})
```

### Find parishes by city (case-insensitive):
```javascript
Parish.find({
  city: new RegExp(`^${cityName}$`, 'i')
})
```

### Find pending submissions:
```javascript
Submission.find({ status: 'pending' }).sort({ submittedAt: -1 })
```

### Authenticate admin:
```javascript
const admin = await Admin.findOne({ username: username.toLowerCase(), active: true });
const isMatch = await admin.comparePassword(password);
```
