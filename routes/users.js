const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateRequest, apiLimiter } = require('../middleware/auth');

router.use(apiLimiter);

router.get('/:userId', authenticateRequest, async (req, res) => {
  try {
    const { userId } = req.params;
    const { first_name, username } = req.query;

    console.log(`🔍 Fetching user: ${userId}`);

    let user = await User.findOne({ userId });

    if (!user) {
      user = new User({
        userId,
        first_name: first_name || 'ইউজার',
        username: username || '',
        balance: 50.00,
        today_ads: 0,
        total_ads: 0,
        today_bonus_ads: 0,
        total_referrals: 0,
        total_income: 50.00,
        join_date: new Date(),
        last_ad_reset: new Date(),
        last_bonus_ad_reset: new Date()
      });

      await user.save();
      console.log(`✅ New user created: ${userId}`);
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('❌ Error in GET /users/:userId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

router.put('/:userId', authenticateRequest, async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    console.log(`🔄 Updating user: ${userId}`, updates);

    delete updates._id;
    delete updates.userId;
    delete updates.join_date;

    const user = await User.findOneAndUpdate(
      { userId },
      { $set: updates },
      { 
        new: true, 
        runValidators: true
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('❌ Error in PUT /users/:userId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

router.post('/:userId/reset-ads', authenticateRequest, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const now = new Date();
    const lastReset = new Date(user.last_ad_reset);
    const hoursDiff = (now - lastReset) / (1000 * 60 * 60);

    if (hoursDiff >= 1) {
      user.today_ads = 0;
      user.last_ad_reset = now;
      await user.save();
      console.log(`✅ Ads reset for user: ${userId}`);
    }

    res.json({
      success: true,
      data: user,
      message: 'Ads reset check completed'
    });

  } catch (error) {
    console.error('❌ Error in POST /users/:userId/reset-ads:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

router.post('/:userId/reset-bonus-ads', authenticateRequest, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const now = new Date();
    const lastReset = new Date(user.last_bonus_ad_reset);
    const hoursDiff = (now - lastReset) / (1000 * 60 * 60);

    if (hoursDiff >= 1) {
      user.today_bonus_ads = 0;
      user.last_bonus_ad_reset = now;
      await user.save();
      console.log(`✅ Bonus ads reset for user: ${userId}`);
    }

    res.json({
      success: true,
      data: user,
      message: 'Bonus ads reset check completed'
    });

  } catch (error) {
    console.error('❌ Error in POST /users/:userId/reset-bonus-ads:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

router.get('/:userId/stats', authenticateRequest, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const stats = {
      balance: user.balance,
      today_ads: user.today_ads,
      total_ads: user.total_ads,
      today_bonus_ads: user.today_bonus_ads,
      total_referrals: user.total_referrals,
      total_income: user.total_income,
      join_date: user.join_date,
      can_watch_ads: user.canWatchAds(),
      can_watch_bonus_ads: user.canWatchBonusAds()
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Error in GET /users/:userId/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;