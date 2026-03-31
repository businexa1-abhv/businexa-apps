/**
 * Users — NODEJS_API_GENERATION_PROMPT.md § E
 * Base path: /api/users
 */
const User = require('../models/User');
const Notification = require('../models/Notification');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Subscription = require('../models/Subscription');
const { AppError } = require('../middleware/errorHandler');

/** GET /api/users/profile */
async function getProfile(req, res, next) {
  try {
    res.json({ user: req.dbUser });
  } catch (e) {
    next(e);
  }
}

/** PUT /api/users/profile */
async function updateProfile(req, res, next) {
  try {
    const { fullName, email, profileImage } = req.body;
    if (fullName !== undefined) req.dbUser.fullName = fullName;
    if (email !== undefined) req.dbUser.email = email;
    if (profileImage !== undefined) req.dbUser.profileImage = profileImage;
    await req.dbUser.save();
    res.json({ user: req.dbUser });
  } catch (e) {
    next(e);
  }
}

/** PUT /api/users/preferences */
async function updatePreferences(req, res, next) {
  try {
    const { language, theme, notifications } = req.body;
    if (language !== undefined) req.dbUser.preferences.language = language;
    if (theme !== undefined) req.dbUser.preferences.theme = theme;
    if (notifications !== undefined) req.dbUser.preferences.notifications = notifications;
    await req.dbUser.save();
    res.json({ preferences: req.dbUser.preferences });
  } catch (e) {
    next(e);
  }
}

/** GET /api/users/notifications?page=&limit= */
async function listNotifications(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 10);
    const userId = req.dbUser._id;
    const [notifications, total] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments({ userId }),
    ]);
    res.json({ notifications, total });
  } catch (e) {
    next(e);
  }
}

/** PUT /api/users/notifications/:notificationId/read */
async function markNotificationRead(req, res, next) {
  try {
    const n = await Notification.findOne({ _id: req.params.notificationId, userId: req.dbUser._id });
    if (!n) throw new AppError('Not found', 404);
    n.isRead = true;
    await n.save();
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

/** DELETE /api/users/account — cascades shops, products, subscriptions, notifications */
async function deleteAccount(req, res, next) {
  try {
    const userId = req.dbUser._id;
    await Product.deleteMany({ ownerId: userId });
    await Subscription.deleteMany({ userId });
    await Shop.deleteMany({ ownerId: userId });
    await Notification.deleteMany({ userId });
    await User.deleteOne({ _id: userId });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  updatePreferences,
  listNotifications,
  markNotificationRead,
  markRead: (req, res, next) => markNotificationRead(req, res, next),
  deleteAccount,
};
