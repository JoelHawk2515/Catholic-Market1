// models/Parish.js
const mongoose = require('mongoose');

const parishSchema = new mongoose.Schema({
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
    required: true
  },
  state: {
    type: String,
    required: true
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
  phone: {
    type: String,
    default: null
  },
  website: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for geospatial queries
parishSchema.index({ lat: 1, lng: 1 });
parishSchema.index({ city: 1 });

module.exports = mongoose.model('Parish', parishSchema);
