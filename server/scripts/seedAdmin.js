const mongoose = require('mongoose');
const User = require('../models/User');
const Building = require('../models/Building');
require('dotenv').config();

async function seedAdmin() {
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
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // Get command line arguments
    const args = process.argv.slice(2);
    const phone = args[0] || '01000000000';
    const password = args[1] || 'admin123';
    const fullName = args[2] || 'مدير النظام';
    const buildingNumber = args[3] || '1';
    const unit = args[4] || '1';

    // Find or get first building
    let building = await Building.findOne({ number: buildingNumber });
    if (!building) {
      // If building doesn't exist, get the first one
      building = await Building.findOne();
      if (!building) {
        console.error('❌ لا توجد عمارات في قاعدة البيانات. قم بتشغيل seed:buildings أولاً.');
        process.exit(1);
      }
      console.log(`⚠️  العماره ${buildingNumber} غير موجودة. سيتم استخدام العماره ${building.number} بدلاً منها.`);
    }

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ phone, userType: 'manager' });
    if (existingAdmin) {
      console.log(`⚠️  يوجد بالفعل مستخدم مدير برقم الهاتف: ${phone}`);
      console.log('إذا كنت تريد إعادة إنشاء المدير، قم بحذف المستخدم الحالي أولاً.');
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      fullName,
      phone,
      password,
      buildingId: building._id,
      unit,
      ownerType: 'owner',
      userType: 'manager',
      isActive: true
    });

    await admin.save();
    await admin.populate('buildingId', 'number');

    console.log('\n✅ تم إنشاء مستخدم المدير بنجاح!');
    console.log('='.repeat(60));
    console.log(`الاسم: ${fullName}`);
    console.log(`رقم الهاتف: ${phone}`);
    console.log(`كلمة المرور: ${password}`);
    console.log(`العماره: ${admin.buildingId.number}`);
    console.log(`الشقة: ${unit}`);
    console.log('='.repeat(60));
    console.log('\n⚠️  يرجى تغيير كلمة المرور بعد تسجيل الدخول الأول!');

    // Close connection
    await mongoose.connection.close();
    console.log('\nتم إغلاق الاتصال بقاعدة البيانات');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ في إنشاء مستخدم المدير:', error.message);
    
    // Provide helpful error messages
    if (error.code === 13 || error.message.includes('authentication')) {
      console.error('\n⚠️  خطأ في المصادقة مع قاعدة البيانات');
      console.error('يرجى التحقق من:');
      console.error('1. اسم المستخدم وكلمة المرور في MONGODB_URI');
      console.error('2. صيغة الاتصال: mongodb://username:password@host:port/database');
      console.error('3. أو للـ MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/database');
      console.error('\nمثال:');
      console.error('MONGODB_URI=mongodb://admin:password123@localhost:27017/darmasr');
    } else if (error.code === 11000) {
      console.error('رقم الهاتف أو الشقة مستخدمة بالفعل');
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

seedAdmin();
