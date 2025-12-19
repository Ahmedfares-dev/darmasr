const mongoose = require('mongoose');
const Building = require('../models/Building');
require('dotenv').config();

async function seedBuildings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/darmasr', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');

    // Check if buildings already exist
    const existingCount = await Building.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  يوجد بالفعل ${existingCount} عماره في قاعدة البيانات.`);
      console.log('إذا كنت تريد إعادة البذر، قم بحذف العمارات الموجودة أولاً.');
      process.exit(0);
    }

    // Create 56 buildings
    const buildings = [];
    for (let i = 1; i <= 56; i++) {
      buildings.push({
        number: i.toString(),
        status: 'active'
      });
    }

    await Building.insertMany(buildings);
    console.log(`✅ تم إنشاء ${buildings.length} عماره بنجاح (من 1 إلى 56)`);

    // Close connection
    await mongoose.connection.close();
    console.log('تم إغلاق الاتصال بقاعدة البيانات');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ في زرع البيانات:', error);
    process.exit(1);
  }
}

seedBuildings();
