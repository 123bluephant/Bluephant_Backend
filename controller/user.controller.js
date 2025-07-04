import AdminBluePhant from "../model/User.js";
import generateCookie from "../utils/helper/generateCookie.js";
import bcrypt from "bcrypt"
import {Order} from "../model/order.js"
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../model/User.js";

const signupController = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await AdminBluePhant.findOne({
      $or: [{ email }, { fullName }],
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new AdminBluePhant({
      fullName,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    if (newUser) {
      generateCookie(newUser._id, res);
      return res.status(201).json({
        _id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
      });
    } else {
      return res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};


const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(req.body)

        if (!email || !password) {
            return res.status(400).json({ err: "All fields are required" });
        }

        const user = await AdminBluePhant.findOne({ email });
        if (!user) {
            return res.status(401).json({ err: "Invalid credentials" });
        }
        console.log(user.password,password)

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        console.log("c  ")
        if (!isPasswordCorrect) {
            return res.status(401).json({ err: "Invalid credentials" });
        }
        generateCookie(user._id, res);
        return res.status(200).json({
            _id: user._id,
            email: user.email,
            accountType:user.accountType,
            fullName: user.fullName
        });

    } catch (err) {
        console.error(err);
        if (!res.headersSent) {
            return res.status(500).json({ err: "Internal server error" });
        }
    }
};

const logoutController = async(req,res) => {
    try {
        res.cookie("jwt","",{maxAge:1});
		res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
        console.log("Error in signupUser: ", error);
        res.status(500).json({ error });

    }
}

const getdata = async (req, res) => {
  try {
    const allOrders = await Order.find().sort({ createdAt: -1 });

    const websiteOrders = allOrders.filter(order => order.orderfor === 'Website');
    const appOrders = allOrders.filter(order => order.orderfor === 'App');

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: {
        websiteOrders,
        appOrders
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


export const forgotPasswordController = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");

    // Save token and expiry to user
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 30; // 30 mins
    await user.save();

    const resetURL = `${process.env.ADMIN_URL}/reset-password/${token}`; // Use correct env key

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Password Reset - Gym Bluephant",
      html: `
        <h2>Password Reset Requested</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetURL}" target="_blank">${resetURL}</a>
        <p>This link will expire in 30 minutes.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Password reset link sent to email" });
  } catch (err) {
    console.error("❌ Forgot password error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const resetPasswordController = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword)
    return res.status(400).json({ message: "New password is required" });

  try {
    // Find user with valid token and unexpired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Token is invalid or has expired" });
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("❌ Reset password error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};
export {signupController,loginController,logoutController,getdata};