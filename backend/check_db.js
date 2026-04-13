require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

async function debug() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri, { dbName: 'proconnect-database' });
  
  const UserModel = mongoose.connection.collection('users');
  const NotifModel = mongoose.connection.collection('notifications');

  let output = "";

  const users = await UserModel.find({}).toArray();
  output += "=== USERS ===\n";
  users.forEach(u => {
    output += `  ID: ${u._id}\n  email: ${u.email}\n  role: ${u.role}\n  fullName: ${u.fullName}\n\n`;
  });

  const notifs = await NotifModel.find({}).toArray();
  output += "=== NOTIFICATIONS ===\n";
  if (notifs.length === 0) {
    output += "  (none)\n";
  } else {
    notifs.forEach(n => {
      output += `  ID: ${n._id}\n  recipientId: ${n.recipientId}\n  senderId: ${n.senderId}\n  type: ${n.type}\n  jobId: ${n.jobId}\n  message: ${n.message}\n\n`;
    });
  }

  fs.writeFileSync('db_output.txt', output, 'utf8');
  console.log("Written to db_output.txt");

  await mongoose.disconnect();
  process.exit(0);
}

debug().catch(e => { console.error(e); process.exit(1); });
