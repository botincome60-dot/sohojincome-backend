const express = require('express');
const router = express.Router();
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const { authenticateRequest, apiLimiter } = require('../middleware/auth');

router.use(apiLimiter);

router.post('/', authenticateRequest, async (req, res) => {
  try {
    const { userId, userName, amount, accountNumber, method } = req.body;

    console.log(`💸 Creating withdrawal request for: ${userId}`);

    if (!userId || !amount || !accountNumber || !method) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: userId, amount, accountNumber, method'
      });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (amount < 500) {
      return res.status(400).json({
        success: false,
        error: 'Minimum withdrawal amount is 500 BDT',
        data: { minimum: 500 }
      });
    }

    if (amount > user.balance) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        data: { 
          currentBalance: user.balance,
          requestedAmount: amount 
        }
      });
    }

    if (user.total_referrals < 15) {
      return res.status(400).json({
        success: false,
        error: 'Minimum 15 referrals required for withdrawal',
        data: { 
          currentReferrals: user.total_referrals,
          requiredReferrals: 15 
        }
      });
    }

    if (user.total_ads < 10) {
      return res.status(400).json({
        success: false,
        error: 'Minimum 10 ads required for withdrawal',
        data: { 
          currentAds: user.total_ads,
          requiredAds: 10 
        }
      });
    }

    const validMethods = ['bKash', 'Nagad', 'Rocket'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment method',
        data: { validMethods }
      });
    }

    const accountRegex = /^01[3-9]\d{8}$/;
    if (!accountRegex.test(accountNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account number format. Must be a valid Bangladeshi mobile number (11 digits, starting with 01)'
      });
    }

    user.balance -= amount;
    await user.save();

    const withdrawal = new Withdrawal({
      userId,
      userName: userName || user.first_name,
      amount,
      accountNumber,
      method,
      userAds: user.total_ads,
      userReferrals: user.total_referrals
    });

    await withdrawal.save();

    console.log(`✅ Withdrawal request created: ${userId} - ${amount} BDT via ${method}`);

    res.json({
      success: true,
      data: {
        withdrawal,
        newBalance: user.balance
      },
      message: 'Withdrawal request submitted successfully. It will be processed within 24 hours.'
    });

  } catch (error) {
    console.error('❌ Error in POST /withdrawals:', error);
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

    const withdrawals = await Withdrawal.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const total = await Withdrawal.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        withdrawals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('❌ Error in GET /withdrawals/user/:userId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

router.get('/:withdrawalId', authenticateRequest, async (req, res) => {
  try {
    const { withdrawalId } = req.params;

    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        error: 'Withdrawal not found'
      });
    }

    res.json({
      success: true,
      data: withdrawal
    });

  } catch (error) {
    console.error('❌ Error in GET /withdrawals/:withdrawalId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;