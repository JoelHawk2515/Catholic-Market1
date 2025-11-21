// models/Analytics.js
const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  businessName: {
    type: String,
    required: true
  },
  eventType: {
    type: String,
    enum: ['card_click', 'tag_click', 'directions_click', 'website_click'],
    required: true
  },
  tag: {
    type: String,
    default: null // Only populated for tag_click events
  },
  userLocation: {
    lat: {
      type: Number,
      default: null
    },
    lng: {
      type: Number,
      default: null
    }
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
analyticsSchema.index({ businessId: 1, timestamp: -1 });
analyticsSchema.index({ eventType: 1, timestamp: -1 });
analyticsSchema.index({ timestamp: -1 });
analyticsSchema.index({ 'userLocation.lat': 1, 'userLocation.lng': 1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
