import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setup() {
  try {
    const testAccount = await nodemailer.createTestAccount();
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    
    const smtpConfig = `
# Email Configuration (Ethereal Test Account)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=${testAccount.user}
SMTP_PASS=${testAccount.pass}
EMAIL_FROM="FashionVerse Test <${testAccount.user}>"
`;
    
    fs.writeFileSync(envPath, envContent + smtpConfig);
    console.log("Email setup complete! Ethereal credentials added to .env");
    console.log("User:", testAccount.user);
    console.log("Pass:", testAccount.pass);
    console.log("You can view sent emails at: https://ethereal.email/login");
  } catch (err) {
    console.error("Error setting up email:", err);
  }
}

setup();
