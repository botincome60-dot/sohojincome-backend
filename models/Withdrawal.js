const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    trim: true
  },
  userName: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [500, 'Minimum withdrawal amount is 500 BDT']
  },
  accountNumber: {
    type: String,
    required: [true, 'Account number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^01[3-9]\d{8}$/.test(v);
      },
      message: 'Please provide a valid Bangladeshi mobile number'
    }
  },
  method: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['bKash', 'Nagad', 'Rocket'],
    default: 'bKash'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  userAds: {
    type: Number,
    default: 0
  },
  userReferrals: {
    type: Number,
    default: 0
  },
  adminNotes: {
    type: String,
    default: ''
  },
  processedAt: {
    type: Date
  }
}, {
  timestamps: true
});

withdrawalSchema.index({ userId: 1 });
withdrawalSchema.index({ status: 1 });
withdrawalSchema.index({ createdAt: -1 });

withdrawalSchema.statics.getPendingWithdrawals = function() {
  return this.find({ status: 'pending' }).sort({ createdAt: 1 });
};

withdrawalSchema.statics.getUserWithdrawals = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

withdrawalSchema.methods.canProcess = function() {
  return this.status === 'pending';
};

module.exports = mongoose.model('Withdrawal', withdrawalSchema);