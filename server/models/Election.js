const mongoose = require('mongoose');

const electionSchema = new mongoose.Schema({
  buildingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    required: true
  },
  number: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'running', 'ended', 'winner_pending', 'winner_confirmed'],
    default: 'scheduled'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident'
  }
}, {
  timestamps: true
});

// Index to ensure unique election numbers per building
electionSchema.index({ buildingId: 1, number: 1 }, { unique: true });

// Method to check if election is currently running
electionSchema.methods.isRunning = function() {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate;
};

module.exports = mongoose.model('Election', electionSchema);

