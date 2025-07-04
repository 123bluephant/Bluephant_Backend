import mongoose from "mongoose";

const websiteOrderSchema = new mongoose.Schema({
  orderToken: {
    type: String,
    required: true,
    unique: true
  },
  orderfor:{
    type:String, // for web or app?
    required: true,

  },
  businessName: {
    type: String,
    required: true
  },
  ownerName: {
    type: String,
    required: true
  },
  domainName: {
    type: String,
    default: ''
  },
  businessType: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  designPreferences: {
    type: String,
    default: ''
  },
  designType: {
    type: String,
  },
  dynamicRequirements: {
    type: String,
    default: ''
  },
  totalPrice: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending Review', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending Review'
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export const Order = mongoose.model('Order', websiteOrderSchema);