import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config();

/**
 * Ye script aapki .env configuration ko test karega.
 * Isay run karne ke liye terminal mein likhein: node runTest.js
 */

const runEmailTest = async () => {
    console.log('-------------------------------------------');
    console.log('🚀 FASHIONVERSE EMAIL TEST SYSTEM');
    console.log('-------------------------------------------');

    const config = {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS ? '********' : 'MISSING',
        from: process.env.EMAIL_FROM
    };

    console.log('📋 Current Config in .env:');
    console.log(config);

    if (!config.user || !config.pass) {
        console.error('❌ Error: SMTP_USER or SMTP_PASS is missing in .env!');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: config.host,
        port: parseInt(config.port) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: config.user,
            pass: process.env.SMTP_PASS
        }
    });

    try {
        console.log('\n🔍 Phase 1: Verifying Connection Connection...');
        await transporter.verify();
        console.log('✅ Phase 1 Success: Connection established and authenticated!');

        console.log('\n📧 Phase 2: Sending Test Email to:', config.user);
        const info = await transporter.sendMail({
            from: config.from || `"FashionVerse Test" <${config.user}>`,
            to: config.user,
            subject: 'FashionVerse 🛠️ SMTP Test Mail',
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0f172a;">FashionVerse Email Success!</h2>
          <p>Agar aapko ye email mili hai, iska matlab hai aapka <b>SMTP Configuration</b> bilkul theek hai.</p>
          <ul style="color: #444;">
            <li><b>Host:</b> ${config.host}</li>
            <li><b>User:</b> ${config.user}</li>
            <li><b>Time:</b> ${new Date().toLocaleString()}</li>
          </ul>
          <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
            Aap ab Forgot Password aur Brand Registration emails test kar sakte hain.
          </p>
        </div>
      `
        });

        console.log('✅ Phase 2 Success: Email sent successfully!');
        console.log('🆔 Message ID:', info.messageId);
        console.log('\n✨ RESULT: SAB KUCH THEEK HAI! ✨');
        console.log('Server restart karein aur project use karein.');

    } catch (error) {
        console.error('\n❌ TEST FAILED!');
        console.error('Error Message:', error.message);

        if (error.code === 'EAUTH') {
            console.log('\n💡 Tip: App Password galat hai ya email user sahi nahi hai.');
        } else if (error.code === 'ESOCKET') {
            console.log('\n💡 Tip: Network issue ya firewall host block kar rahi hai.');
        }
    }
    console.log('-------------------------------------------');
};

runEmailTest();
