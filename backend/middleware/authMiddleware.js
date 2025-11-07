import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      console.log('🪪 [protect] decoded token:', decoded);

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        console.log('❌ [protect] User not found for id:', decoded.id);
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      console.log('✅ [protect] Authenticated user:', user._id.toString(), user.email);
      req.user = user;
      return next();
    }

    console.log('❌ [protect] No Bearer token found');
    return res.status(401).json({ message: 'Not authorized, no token' });
  } catch (err) {
    console.error('🔥 [protect] Token error:', err.message);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};
