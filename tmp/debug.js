const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/src/models/User');
const Notification = require('../backend/src/models/Notification');
const Job = require('../backend/src/models/Job');

async function debug() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'proconnect-database' });
  const users = await User.find({}).lean();
  console.log("Users in DB:");
  users.forEach(u => {
    console.log(`- ${u.email} (role: ${u.role}, id: ${u._id})`);
  });

  const notifs = await Notification.find({}).lean();
  console.log("\nNotifications in DB:");
  notifs.forEach(n => {
    console.log(`- To: ${n.recipientId}, From: ${n.senderId}, Type: ${n.type}, Job: ${n.jobId}, Message: ${n.message}`);
  });

  process.exit(0);
}

debug().catch(console.error);
