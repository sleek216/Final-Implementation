import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import fs from 'fs';

dotenv.config();

async function checkUsers() {
    let output = '';
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        output += 'Connected to MongoDB\n';

        const users = await User.find({}, 'name email role');
        output += 'Registered Users:\n';
        users.forEach(u => u.email && (output += `- ${u.name} (${u.email}) [${u.role}]\n`));

        await mongoose.disconnect();
    } catch (err) {
        output += 'Error: ' + err.message + '\n';
    }
    fs.writeFileSync('users_db_output.txt', output);
}

checkUsers();
