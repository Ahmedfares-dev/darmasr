const mongoose = require('mongoose');

const nominationSchema = new mongoose.Schema({
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  statement: {
    type: String,
    required: true,
    trim: true
  },
  qualifications: {
    type: String,
    trim: true
  },
  goals: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index to ensure one nomination per resident per election
nominationSchema.index({ electionId: 1, residentId: 1 }, { unique: true });

module.exports = mongoose.model('Nomination', nominationSchema);

