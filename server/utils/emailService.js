import nodemailer from 'nodemailer';
import Otp from '../models/Otp.js';

// Create transporter - only if credentials are configured
let transporter = null;

const initTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_HOST) {
    console.warn('Email not configured. Check .env');
    return null;
  }

  console.log('Initializing Transporter for:', process.env.SMTP_USER);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

/**
 * Send OTP email for password reset
 * @param {string} to - Recipient email
 * @param {string} otp - 6-digit OTP code
 */
export const sendOtpEmail = async (to, otp) => {
  try {

    if (!transporter) {
      transporter = initTransporter();
    }


    if (!transporter) {
      console.log('======================================');
      console.log(`📧 OTP for ${to}: ${otp}`);
      console.log('======================================');
      console.log('(Email not sent - configure SMTP settings in .env)');
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"FashionVerse" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Password Reset OTP - FashionVerse',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0f172a; margin: 0; font-size: 24px;">FashionVerse</h1>
            <p style="color: #64748b; margin: 5px 0 0;">Your Digital Fashion Destination</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 12px; padding: 30px; text-align: center;">
            <h2 style="color: #1e293b; margin: 0 0 10px; font-size: 20px;">Password Reset Request</h2>
            <p style="color: #64748b; margin: 0 0 25px; font-size: 14px;">Use the OTP below to reset your password. It expires in 10 minutes.</p>
            
            <div style="background: #0f172a; color: #fff; font-size: 32px; letter-spacing: 8px; padding: 20px 30px; border-radius: 8px; display: inline-block; font-weight: 700;">
              ${otp}
            </div>
            
            <p style="color: #94a3b8; margin: 25px 0 0; font-size: 12px;">If you didn't request this, please ignore this email.</p>
          </div>
          
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 30px;">
            © ${new Date().getFullYear()} FashionVerse. All rights reserved.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent successfully to ${to}`);
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    // Log OTP to console as fallback
    console.log('======================================');
    console.log(`📧 OTP for ${to}: ${otp}`);
    console.log('======================================');
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Send OTP email for Registration
 * @param {string} to - Recipient email
 * @param {string} otp - 6-digit OTP code
 */
export const sendRegistrationOtpEmail = async (to, otp) => {
  try {
    if (!transporter) transporter = initTransporter();

    if (!transporter) {
      console.log('======================================');
      console.log(`📧 Registration OTP for ${to}: ${otp}`);
      console.log('======================================');
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"FashionVerse" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Verify Your Email - FashionVerse Registration',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0f172a; margin: 0; font-size: 24px;">FashionVerse</h1>
            <p style="color: #64748b; margin: 5px 0 0;">Welcome to FashionVerse!</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 12px; padding: 30px; text-align: center;">
            <h2 style="color: #1e293b; margin: 0 0 10px; font-size: 20px;">Verify Your Email</h2>
            <p style="color: #64748b; margin: 0 0 25px; font-size: 14px;">Use the OTP below to complete your registration. It expires in 10 minutes.</p>
            
            <div style="background: #000; color: #fff; font-size: 32px; letter-spacing: 8px; padding: 20px 30px; border-radius: 8px; display: inline-block; font-weight: 700;">
              ${otp}
            </div>
            
            <p style="color: #94a3b8; margin: 25px 0 0; font-size: 12px;">If you didn't attempt to register, please ignore this email.</p>
          </div>
          
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 30px;">
            © ${new Date().getFullYear()} FashionVerse. All rights reserved.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Registration OTP sent to ${to}`);
  } catch (error) {
    console.error('❌ Registration OTP failed:', error.message);
    console.log('======================================');
    console.log(`📧 Registration OTP for ${to}: ${otp}`);
    console.log('======================================');
  }
};

/**
 * Send email to brand owner after successful registration (pending approval)
 * @param {string} to - Brand business email
 * @param {string} brandName - Name of the brand
 */
export const sendBrandRegistrationEmail = async (to, brandName) => {
  try {
    if (!transporter) transporter = initTransporter();
    if (!transporter) return;

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"FashionVerse" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Brand Registration Received - FashionVerse',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0f172a; margin: 0; font-size: 24px;">FashionVerse</h1>
            <p style="color: #64748b; margin: 5px 0 0;">Brand Partnership</p>
          </div>
          
          <div style="background: #f8fafc; border-radius: 12px; padding: 30px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin: 0 0 15px; font-size: 20px;">Registration Received!</h2>
            <p style="color: #475569; line-height: 1.6;">Hello <strong>${brandName}</strong>,</p>
            <p style="color: #475569; line-height: 1.6;">Thank you for registering with FashionVerse. Your application has been received and is currently <strong>pending approval</strong> from our admin team.</p>
            <p style="color: #475569; line-height: 1.6;">Please wait while we verify your documents. You will receive another email once your brand is approved.</p>
            
            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">
              Current Status: <span style="color: #f59e0b; font-weight: 600;">Pending Review</span>
            </div>
          </div>
          
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 30px;">
            © ${new Date().getFullYear()} FashionVerse. All rights reserved.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Brand registration email sent to ${to}`);
  } catch (error) {
    console.error('❌ Brand registration email failed:', error.message);
  }
};

/**
 * Send email to brand owner when brand is approved
 * @param {string} to - Brand business email
 * @param {string} brandName - Name of the brand
 * @param {string} password - Generated password for the owner
 */
export const sendBrandApprovalEmail = async (to, brandName, password) => {
  try {
    if (!transporter) transporter = initTransporter();
    if (!transporter) return;

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"FashionVerse" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Welcome to FashionVerse - Brand Approved!',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0f172a; margin: 0; font-size: 24px;">FashionVerse</h1>
            <p style="color: #64748b; margin: 5px 0 0;">Welcome to the Family</p>
          </div>
          
          <div style="background: #f0fdf4; border-radius: 12px; padding: 30px; border: 1px solid #bbf7d0;">
            <h2 style="color: #166534; margin: 0 0 15px; font-size: 20px;">Congratulations! 🎉</h2>
            <p style="color: #166534; line-height: 1.6;">Great news! <strong>${brandName}</strong> has been approved on FashionVerse.</p>
            <p style="color: #166534; line-height: 1.6;">Your brand owner account has been created. You can now login and start managing your products.</p>
            
            <div style="background: #ffffff; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px dashed #bbf7d0;">
              <p style="margin: 0 0 10px; color: #64748b; font-size: 13px;">Your Login Credentials:</p>
              <div style="margin-bottom: 5px;"><strong>Email:</strong> ${to}</div>
              <div><strong>Password:</strong> <span style="font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${password}</span></div>
            </div>
            
            <p style="color: #166534; font-size: 13px;"><em>Note: We recommend changing your password after your first login.</em></p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="background: #0f172a; color: #ffffff; padding: 12px 25px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Login to Dashboard</a>
          </div>
          
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 40px;">
            © ${new Date().getFullYear()} FashionVerse. All rights reserved.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Brand approval email sent to ${to}`);
  } catch (error) {
    console.error('❌ Brand approval email failed:', error.message);
  }
};

/**
 * Send email to brand owner when registration is rejected
 * @param {string} to - Brand business email
 * @param {string} brandName - Name of the brand
 * @param {string} reason - Reason for rejection
 */
export const sendBrandRejectionEmail = async (to, brandName, reason) => {
  try {
    if (!transporter) transporter = initTransporter();
    if (!transporter) return;

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"FashionVerse" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Brand Registration Status - FashionVerse',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0f172a; margin: 0; font-size: 24px;">FashionVerse</h1>
            <p style="color: #64748b; margin: 5px 0 0;">Brand Partnership Team</p>
          </div>
          
          <div style="background: #fff1f0; border-radius: 12px; padding: 30px; border: 1px solid #ffa39e;">
            <h2 style="color: #cf1322; margin: 0 0 15px; font-size: 20px;">Registration Status Update</h2>
            <p style="color: #cf1322; line-height: 1.6; font-weight: 600;">We are very sorry your registration has been rejected.</p>
            
            <div style="background: #ffffff; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #cf1322;">
              <p style="margin: 0 0 10px; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Reason for Rejection:</p>
              <p style="color: #1e293b; margin: 0; line-height: 1.6;">${reason}</p>
            </div>
            
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">If you believe this was a mistake or would like to re-apply after addressing the mentioned reason, please contact our support team or try again later.</p>
          </div>
          
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 40px;">
            © ${new Date().getFullYear()} FashionVerse. All rights reserved.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Brand rejection email sent to ${to}`);
  } catch (error) {
    console.error('❌ Brand rejection email failed:', error.message);
  }
};

/**
 * Send Order Confirmation Email
 * @param {string} to - Customer email
 * @param {object} order - Order object with details
 */
export const sendOrderConfirmationEmail = async (to, order) => {
  try {
    if (!transporter) transporter = initTransporter();
    if (!transporter) return;

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #edf2f7;">
          <div style="font-weight: 600; color: #1a202c;">${item.productId?.name || 'Product'}</div>
          <div style="font-size: 12px; color: #718096;">Qty: ${item.quantity}</div>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #edf2f7; text-align: right; color: #1a202c;">
          Rs. ${item.price.toLocaleString()}
        </td>
      </tr>
    `).join('');

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"FashionVerse" <${process.env.SMTP_USER}>`,
      to,
      subject: `Order Confirmed! #${order._id.toString().slice(-6).toUpperCase()}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a202c;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="margin: 0; color: #000; font-size: 28px; letter-spacing: 2px;">FASHIONVERSE</h1>
            <p style="color: #64748b; font-size: 14px;">Style. Elegance. Delivered.</p>
          </div>

          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background: #000; color: #fff; padding: 30px; text-align: center;">
              <h2 style="margin: 0; font-size: 20px;">Thank You For Your Order!</h2>
              <p style="margin: 10px 0 0; opacity: 0.8; font-size: 14px;">Order ID: #${order._id.toString().slice(-6).toUpperCase()}</p>
            </div>

            <div style="padding: 30px;">
              <p style="margin: 0 0 20px; font-size: 16px;">Hello,</p>
              <p style="margin: 0 0 20px; color: #4a5568; line-height: 1.6;">We've received your order and are getting it ready for shipment. Here's a summary of your stylish picks:</p>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="background: #f7fafc;">
                    <th style="text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase; color: #718096;">Item</th>
                    <th style="text-align: right; padding: 12px; font-size: 12px; text-transform: uppercase; color: #718096;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td style="padding: 20px 10px 10px; font-weight: 700; font-size: 18px;">Total Paid</td>
                    <td style="padding: 20px 10px 10px; text-align: right; font-weight: 700; font-size: 18px; color: #000;">
                      Rs. ${order.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-top: 20px;">
                <h3 style="margin: 0 0 10px; font-size: 14px; text-transform: uppercase; color: #718096;">Shipping Address</h3>
                <p style="margin: 0; color: #2d3748; font-size: 14px; line-height: 1.5;">
                  ${order.shippingAddress.name}<br>
                  ${order.shippingAddress.address}<br>
                  ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
                </p>
              </div>
            </div>

            <div style="padding: 0 30px 30px; text-align: center;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/profile" style="background: #000; color: #fff; text-decoration: none; padding: 15px 30px; border-radius: 30px; font-weight: 600; font-size: 14px; display: inline-block;">Track Your Order</a>
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
            <p>© ${new Date().getFullYear()} FashionVerse. All rights reserved.</p>
            <p>If you have any questions, reply to this email or visit our Help Center.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Order confirmation email sent to ${to}`);
  } catch (error) {
    console.error('❌ Order confirmation email failed:', error.message);
  }
};

/**
 * Send New Order Notification to Brand/Admin
 * @param {string} to - Brand/Admin email
 * @param {object} order - Order object
 * @param {string} role - 'admin' or 'brand'
 */
export const sendNewOrderNotification = async (to, order, role = 'admin') => {
  try {
    if (!transporter) transporter = initTransporter();
    if (!transporter) return;

    const subject = role === 'admin'
      ? `New Order Received! #${order._id.toString().slice(-6).toUpperCase()}`
      : `New Sale Alert! Order #${order._id.toString().slice(-6).toUpperCase()}`;

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #edf2f7;">
          <div style="font-weight: 600; color: #1a202c;">${item.productId?.name || 'Product'}</div>
          <div style="font-size: 12px; color: #718096;">Qty: ${item.quantity}</div>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #edf2f7; text-align: right; color: #1a202c;">
          Rs. ${item.price.toLocaleString()}
        </td>
      </tr>
    `).join('');

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"FashionVerse" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a202c;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="margin: 0; color: #000; font-size: 24px;">FashionVerse</h1>
            <p style="color: #64748b; font-size: 14px;">Internal Notification</p>
          </div>

          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px;">
            <h2 style="margin: 0 0 20px; color: #2d3748; font-size: 20px;">
              ${role === 'admin' ? 'New Order Placed' : 'You made a sale!'}
            </h2>
            
            <p style="margin: 0 0 20px; color: #4a5568;">
              Order <strong>#${order._id.toString().slice(-6).toUpperCase()}</strong> has been confirmed.
            </p>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background: #f7fafc;">
                  <th style="text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase;">Item</th>
                  <th style="text-align: right; padding: 12px; font-size: 12px; text-transform: uppercase;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
              <strong>Customer Details:</strong><br>
              ${order.shippingAddress.name}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.country}
            </div>
            
            <div style="text-align: center; margin-top: 25px;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/${role}/dashboard" style="background: #000; color: #fff; padding: 12px 25px; border-radius: 6px; text-decoration: none; font-size: 14px;">View in Dashboard</a>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Notification sent to ${role}: ${to}`);
  } catch (error) {
    console.error(`❌ Notification failed for ${role}:`, error.message);
  }
};

export default transporter;
