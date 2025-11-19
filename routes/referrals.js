const express = require('express');
const router = express.Router();
const Referral = require('../models/Referral');
const User = require('../models/User');
const { authenticateRequest, apiLimiter } = require('../middleware/auth');

router.use(apiLimiter);

router.post('/', authenticateRequest, async (req, res) => {
  try {
    const { userId, referredBy, newUserName, newUserId } = req.body;

    console.log(`🔗 Creating referral: ${userId} referred by ${referredBy}`);

    if (!userId || !referredBy) {
      return res.status(400).json({
        success: false,
        error: 'User ID and referredBy are required'
      });
    }

    if (userId === referredBy) {
      return res.status(400).json({
        success: false,
        error: 'Self-referral is not allowed'
      });
    }

    const existingReferral = await Referral.referralExists(userId, referredBy);
    if (existingReferral) {
      return res.status(400).json({
        success: false,
        error: 'Referral already exists'
      });
    }

    const user = await User.findOne({ userId });
    if (user && user.referred_by) {
      return res.status(400).json({
        success: false,
        error: 'User already has a referrer'
      });
    }

    const referral = new Referral({
      userId,
      referredBy,
      referrerUserId: referredBy,
      newUserName: newUserName || 'ইউজার',
      newUserId: newUserId || userId
    });

    await referral.save();

    await User.findOneAndUpdate(
      { userId },
      { referred_by: referredBy }
    );

    console.log(`✅ Referral created: ${userId} by ${referredBy}`);

    res.json({
      success: true,
      data: referral,
      message: 'Referral created successfully'
    });

  } catch (error) {
    console.error('❌ Error in POST /referrals:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

router.get('/count/:userId', authenticateRequest, async (req, res) => {
  try {
    const { userId } = req.params;

    const count = await Referral.getReferralCount(userId);

    res.json({
      success: true,
      data: { count },
      message: `Referral count: ${count}`
    });

  } catch (error) {
    console.error('❌ Error in GET /referrals/count/:userId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

router.post('/bonus', authenticateRequest, async (req, res) => {
  try {
    const { newUserId, referrerUserId } = req.body;

    console.log(`💰 Processing referral bonus: ${newUserId} referred by ${referrerUserId}`);

    if (!newUserId || !referrerUserId) {
      return res.status(400).json({
        success: false,
        error: 'newUserId and referrerUserId are required'
      });
    }

    const newUser = await User.findOneAndUpdate(
      { userId: newUserId },
      { 
        $inc: { 
          balance: 50,
          total_income: 50
        }
      },
      { new: true }
    );

    if (!newUser) {
      return res.status(404).json({
        success: false,
        error: 'New user not found'
      });
    }

    const referrer = await User.findOneAndUpdate(
      { userId: referrerUserId },
      { 
        $inc: { 
          balance: 100,
          total_income: 100,
          total_referrals: 1
        }
      },
      { new: true }
    );

    if (!referrer) {
      return res.status(404).json({
        success: false,
        error: 'Referrer not found'
      });
    }

    await Referral.findOneAndUpdate(
      { userId: newUserId, referredBy: referrerUserId },
      { bonus_given: true }
    );

    console.log(`✅ Referral bonuses given: ${newUserId} +50 BDT, ${referrerUserId} +100 BDT`);

    res.json({
      success: true,
      data: {
        newUser: { balance: newUser.balance },
        referrer: { balance: referrer.balance, total_referrals: referrer.total_referrals }
      },
      message: 'Referral bonuses given successfully'
    });

  } catch (error) {
    console.error('❌ Error in POST /referrals/bonus:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

router.get('/user/:userId', authenticateRequest, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    const referrals = await Referral.find({ referredBy: userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Referral.countDocuments({ referredBy: userId });

    res.json({
      success: true,
      data: {
        referrals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('❌ Error in GET /referrals/user/:userId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;