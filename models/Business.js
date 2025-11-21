// models/Business.js
const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true
  },
  street: {
    type: String,
    default: null
  },
  city: {
    type: String,
    default: null
  },
  state: {
    type: String,
    default: null
  },
  zip: {
    type: String,
    default: null
  },
  lat: {
    type: Number,
    default: null
  },
  lng: {
    type: Number,
    default: null
  },
  owner: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    default: null
  },
  email: {
    type: String,
    default: null
  },
  website: {
    type: String,
    default: null
  },
  category: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: null
  },
  tags: {
    type: [String],
    default: []
  },
  parishId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parish',
    default: null
  },
  verified: {
    type: Boolean,
    default: false
  },
  sponsored: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String,
    default: null
  },
  hasWifi: {
    type: Boolean,
    default: false
  },
  familyFriendly: {
    type: Boolean,
    default: false
  },
  hasParking: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for geospatial queries
businessSchema.index({ lat: 1, lng: 1 });
businessSchema.index({ verified: 1 });

module.exports = mongoose.model('Business', businessSchema);
