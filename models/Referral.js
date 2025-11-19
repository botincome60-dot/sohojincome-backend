const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    trim: true
  },
  referredBy: {
    type: String,
    required: [true, 'Referred by is required'],
    trim: true
  },
  referrerUserId: {
    type: String,
    required: [true, 'Referrer user ID is required'],
    trim: true
  },
  newUserName: {
    type: String,
    trim: true
  },
  newUserId: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  },
  source: {
    type: String,
    default: 'telegram_startapp'
  },
  bonus_given: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

referralSchema.index({ userId: 1, referredBy: 1 }, { unique: true });
referralSchema.index({ referredBy: 1 });
referralSchema.index({ status: 1 });

referralSchema.statics.getReferralCount = function(userId) {
  return this.countDocuments({ 
    referredBy: userId, 
    status: 'completed' 
  });
};

referralSchema.statics.referralExists = function(userId, referredBy) {
  return this.findOne({ userId, referredBy });
};

module.exports = mongoose.model('Referral', referralSchema);