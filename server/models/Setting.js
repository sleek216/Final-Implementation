import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
    stripeSecretKey: {
        type: String,
        default: '',
    },
    stripePublishableKey: {
        type: String,
        default: '',
    },
    siteName: {
        type: String,
        default: 'FashionVerse',
    },
    smtpHost: { type: String, default: '' },
    smtpPort: { type: String, default: '' },
    smtpSecure: { type: Boolean, default: false },
    smtpUser: { type: String, default: '' },
    smtpPass: { type: String, default: '' },
    emailFrom: { type: String, default: '' },
}, { timestamps: true });

const Setting = mongoose.model('Setting', settingSchema);

export default Setting;
