import Setting from '../models/Setting.js';

// Get global settings (create default if not exists)
export const getSettings = async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            settings = new Setting();
            await settings.save();
        }
        // Only return sensitive keys to admins if needed, or masked
        // But this route is admin protected
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update global settings
export const updateSettings = async (req, res) => {
    try {
        const { stripeSecretKey, stripePublishableKey, siteName } = req.body;

        // Upsert logic
        const settings = await Setting.findOneAndUpdate(
            {},
            { stripeSecretKey, stripePublishableKey, siteName },
            { new: true, upsert: true } // Create if not exists
        );

        res.json({ message: 'Settings updated successfully', settings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
