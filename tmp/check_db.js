const mongoose = require('mongoose');

async function debug() {
  await mongoose.connect('mongodb+srv://mernstackaab1_db_user:hSJLODrntR07YGFH@proconnect-database.2qgdfu3.mongodb.net/proconnect-database?appName=proconnect-database');
  
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
  const Notification = mongoose.model('Notification', new mongoose.Schema({}, { strict: false, collection: 'notifications' }));

  const users = await User.find({}).lean();
  console.log("\n=== USERS ===");
  users.forEach(u => {
    console.log(`  ID: ${u._id} | email: ${u.email} | role: ${u.role} | fullName: ${u.fullName}`);
  });

  const notifs = await Notification.find({}).lean();
  console.log("\n=== NOTIFICATIONS ===");
  if (notifs.length === 0) {
    console.log("  (none)");
  } else {
    notifs.forEach(n => {
      console.log(`  ID: ${n._id} | to: ${n.recipientId} | from: ${n.senderId} | type: ${n.type || 'general'} | job: ${n.jobId || 'null'} | msg: ${n.message}`);
    });
  }

  await mongoose.disconnect();
  process.exit(0);
}

debug().catch(e => { console.error(e); process.exit(1); });
