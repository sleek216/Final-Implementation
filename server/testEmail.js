import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('📧 Testing Email Configuration...\n');

console.log('Configuration:');
console.log('- SMTP_HOST:', process.env.SMTP_HOST);
console.log('- SMTP_PORT:', process.env.SMTP_PORT);
console.log('- SMTP_SECURE:', process.env.SMTP_SECURE);
console.log('- SMTP_USER:', process.env.SMTP_USER);
console.log('- SMTP_PASS:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET');
console.log('\n');

async function testEmail() {
    try {
        // Create transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            debug: true, // Enable debug output
            logger: true // Log information
        });

        console.log('🔍 Verifying SMTP connection...\n');

        // Verify connection
        await transporter.verify();
        console.log('✅ SMTP connection verified successfully!\n');

        // Send test email
        console.log('📤 Sending test email...\n');

        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || `"FashionVerse" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER, // Send to yourself
            subject: 'Test Email - FashionVerse SMTP Setup',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0f172a;">✅ SMTP Configuration Successful!</h2>
          <p>Your email service is properly configured and working.</p>
          <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
          <hr style="border: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="color: #64748b; font-size: 12px;">
            This is a test email from FashionVerse server.
          </p>
        </div>
      `
        });

        console.log('✅ Test email sent successfully!');
        console.log('📬 Message ID:', info.messageId);
        console.log('\n🎉 Email configuration is working perfectly!\n');

    } catch (error) {
        console.error('❌ Email test failed:\n');
        console.error('Error:', error.message);

        if (error.code === 'EAUTH') {
            console.error('\n⚠️ Authentication failed. Possible issues:');
            console.error('   1. App Password might be incorrect');
            console.error('   2. 2-Step Verification not enabled on Gmail');
            console.error('   3. Need to generate a new App Password');
            console.error('\n📝 Steps to fix:');
            console.error('   1. Go to: https://myaccount.google.com/apppasswords');
            console.error('   2. Generate a new App Password for "Mail"');
            console.error('   3. Update SMTP_PASS in .env file');
        } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
            console.error('\n⚠️ Connection failed. Possible issues:');
            console.error('   1. Firewall blocking SMTP port 587');
            console.error('   2. Internet connection issue');
            console.error('   3. SMTP server unreachable');
        }

        console.error('\n');
    }
}

testEmail();
