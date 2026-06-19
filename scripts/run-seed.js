const { sequelize } = require('../config/database');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    
    console.log('🔄 Starting admin user seed...');

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { email: 'tahqeeq86@gmail.com' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Name: ${existingAdmin.name}`);
      console.log(`🔑 Role: ADMIN`);
      console.log(`🆔 ID: ${existingAdmin.id}`);
      
      // Optionally update password if needed (hook will handle hashing)
      // existingAdmin.password = 'Farhan33.';
      // await existingAdmin.save();
      // console.log('🔄 Admin password updated!');
      
      process.exit(0);
    }

    // Create admin user - NO MANUAL HASHING NEEDED
    // The beforeCreate hook will automatically hash the password
    const adminUser = await User.create({
      name: 'Admin',
      email: 'tahqeeq86@gmail.com',
      password: 'Farhan33.', // Plain password - hook will hash it
      phone: '+923110172637',
      isAdmin: true,
      auth_provider: 'local',
      country: 'Pakistan',
      city: 'Chiniot',
      state: 'Punjab',
      zipCode: '35400',
      images: []
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: tahqeeq86@gmail.com');
    console.log('🔑 Password: Farhan33.');
    console.log('👤 Name: Admin');
    console.log('🔑 Role: ADMIN');
    console.log(`🆔 ID: ${adminUser.id}`);
    console.log('📅 Created At:', adminUser.createdAt);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    process.exit(1);
  }
};

// Run the seed
seedAdmin();