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
}, { timestamps: true });

const Setting = mongoose.model('Setting', settingSchema);

export default Setting;
