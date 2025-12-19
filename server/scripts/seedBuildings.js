const mongoose = require('mongoose');
const Building = require('../models/Building');
require('dotenv').config();

async function seedBuildings() {
  try {
    // Check if MONGODB_URI is set
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ خطأ: MONGODB_URI غير محدد في ملف .env');
      console.error('يرجى إضافة MONGODB_URI إلى ملف .env');
      console.error('مثال: MONGODB_URI=mongodb://username:password@host:port/database');
      process.exit(1);
    }

    // Connect to MongoDB with authentication support
    console.log('جاري الاتصال بقاعدة البيانات...');
    await mongoose.connect(mongoUri, {
      // Remove deprecated options for newer MongoDB driver
      // useNewUrlParser: true,  // Deprecated
      // useUnifiedTopology: true,  // Deprecated
    });
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

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
    console.error('❌ خطأ في زرع البيانات:', error.message);
    
    // Provide helpful error messages
    if (error.code === 13 || error.message.includes('authentication')) {
      console.error('\n⚠️  خطأ في المصادقة مع قاعدة البيانات');
      console.error('يرجى التحقق من:');
      console.error('1. اسم المستخدم وكلمة المرور في MONGODB_URI');
      console.error('2. صيغة الاتصال: mongodb://username:password@host:port/database');
      console.error('3. أو للـ MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/database');
      console.error('\nمثال:');
      console.error('MONGODB_URI=mongodb://admin:password123@localhost:27017/darmasr');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\n⚠️  لا يمكن الاتصال بخادم MongoDB');
      console.error('يرجى التأكد من أن MongoDB يعمل');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('\n⚠️  لا يمكن العثور على خادم MongoDB');
      console.error('يرجى التحقق من عنوان الخادم في MONGODB_URI');
    }
    
    process.exit(1);
  }
}

seedBuildings();
