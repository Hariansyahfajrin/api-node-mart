const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Definisi skema pengguna
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware untuk memperbarui updatedAt setiap kali dokumen disimpan
userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Middleware untuk meng-hash password sebelum menyimpan dokumen
userSchema.pre('save', async function (next) {
  if (this.isModified('password') || this.isNew) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

// Metode untuk memverifikasi password
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Membuat model pengguna
const User = mongoose.model('User', userSchema);

module.exports = User;
