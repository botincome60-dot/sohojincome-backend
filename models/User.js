const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    unique: true,
    trim: true
  },
  first_name: {
    type: String,
    default: 'ইউজার',
    trim: true
  },
  username: {
    type: String,
    default: '',
    trim: true
  },
  balance: {
    type: Number,
    default: 50.00,
    min: [0, 'Balance cannot be negative']
  },
  today_ads: {
    type: Number,
    default: 0,
    min: [0, 'Today ads cannot be negative']
  },
  total_ads: {
    type: Number,
    default: 0,
    min: [0, 'Total ads cannot be negative']
  },
  today_bonus_ads: {
    type: Number,
    default: 0,
    min: [0, 'Today bonus ads cannot be negative']
  },
  total_referrals: {
    type: Number,
    default: 0,
    min: [0, 'Total referrals cannot be negative']
  },
  total_income: {
    type: Number,
    default: 50.00,
    min: [0, 'Total income cannot be negative']
  },
  join_date: {
    type: Date,
    default: Date.now
  },
  last_ad_reset: {
    type: Date,
    default: Date.now
  },
  last_bonus_ad_reset: {
    type: Date,
    default: Date.now
  },
  referred_by: {
    type: String,
    default: null
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

userSchema.index({ userId: 1 });
userSchema.index({ lastActive: -1 });
userSchema.index({ referred_by: 1 });

userSchema.statics.findActiveUsers = function() {
  return this.find({ is_active: true });
};

userSchema.methods.canWatchAds = function() {
  const now = new Date();
  const lastReset = new Date(this.last_ad_reset);
  const hoursDiff = (now - lastReset) / (1000 * 60 * 60);
  
  if (hoursDiff >= 1) {
    return true;
  }
  
  return this.today_ads < 10;
};

userSchema.methods.canWatchBonusAds = function() {
  const now = new Date();
  const lastReset = new Date(this.last_bonus_ad_reset);
  const hoursDiff = (now - lastReset) / (1000 * 60 * 60);
  
  if (hoursDiff >= 1) {
    return true;
  }
  
  return this.today_bonus_ads < 10;
};

userSchema.pre('save', function(next) {
  const now = new Date();
  
  const lastAdReset = new Date(this.last_ad_reset);
  const adHoursDiff = (now - lastAdReset) / (1000 * 60 * 60);
  if (adHoursDiff >= 1) {
    this.today_ads = 0;
    this.last_ad_reset = now;
  }
  
  const lastBonusReset = new Date(this.last_bonus_ad_reset);
  const bonusHoursDiff = (now - lastBonusReset) / (1000 * 60 * 60);
  if (bonusHoursDiff >= 1) {
    this.today_bonus_ads = 0;
    this.last_bonus_ad_reset = now;
  }
  
  this.lastActive = now;
  next();
});

module.exports = mongoose.model('User', userSchema);