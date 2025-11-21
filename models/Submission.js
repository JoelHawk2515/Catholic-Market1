// models/Submission.js
const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
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
    type: String,
    default: ''
  },
  parishId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parish',
    default: null
  },
  parishName: {
    type: String,
    default: null
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
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, {
  timestamps: true
});

submissionSchema.index({ status: 1 });
submissionSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('Submission', submissionSchema);
