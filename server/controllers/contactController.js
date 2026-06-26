import Message from "../models/Message.js";

// PUBLIC: Submit Contact Form
export const submitContactForm = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const newMessage = new Message({
            name,
            email,
            subject,
            message,
            userId: req.user ? req.user._id : null
        });

        await newMessage.save();

        res.status(201).json({ message: "Message sent successfully! We will get back to you soon." });
    } catch (error) {
        console.error("Contact form error:", error);
        res.status(500).json({ message: "Failed to send message. Please try again later." });
    }
};

// ADMIN: Get all messages
export const getAllMessages = async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ADMIN: Get unread count
export const getUnreadCount = async (req, res) => {
    try {
        const count = await Message.countDocuments({ status: "unread" });
        res.json({ unreadCount: count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ADMIN: Get message by ID and mark as read
export const getMessageById = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        if (message.status === "unread") {
            message.status = "read";
            await message.save();
        }

        res.json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ADMIN: Delete message
export const deleteMessage = async (req, res) => {
    try {
        await Message.findByIdAndDelete(req.params.id);
        res.json({ message: "Message deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// USER: Get my messages
export const getUserMessages = async (req, res) => {
    try {
        const messages = await Message.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
