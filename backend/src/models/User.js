const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, default: '' },

    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'BRAND_ADMIN', 'DISTRIBUTOR'],
      required: true,
    },

    // null uniquement pour SUPER_ADMIN
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', default: null },

    isActive: { type: Boolean, default: true },

    // DISTRIBUTOR uniquement : autorisation accordée par le BRAND_ADMIN pour
    // que le distributeur puisse s'auto-attribuer du stock depuis le Stock
    // Central, sans passer par un Bon de Sortie créé par l'admin.
    canAddStock: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
