const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const checkPassword = async () => {
  try {
    
    console.log('🔍 Checking admin user...');

    const user = await User.findOne({
      where: { email: 'tahqeeq86@gmail.com' }
    });

    if (!user) {
      console.log('❌ Admin user not found!');
      process.exit(1);
    }

    console.log('✅ Admin user found!');
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 Password hash: ${user.password}`);
    console.log(`👤 Name: ${user.name}`);
    console.log(`🔑 isAdmin: ${user.isAdmin}`);

    // Test password comparison directly with bcrypt
    const testPassword = 'Farhan33.';
    
    // Method 1: Using comparePassword method
    let isMatch = await user.comparePassword(testPassword);
    console.log(`\n🔐 Testing password: "${testPassword}"`);
    console.log(`✅ Password match (comparePassword): ${isMatch}`);

    // Method 2: Direct bcrypt compare
    const directMatch = await bcrypt.compare(testPassword, user.password);
    console.log(`✅ Password match (direct bcrypt): ${directMatch}`);

    if (!isMatch) {
      console.log('\n❌ Password mismatch!');
      console.log('🔧 Updating password WITHOUT triggering hooks...');
      
      // Hash password manually
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(testPassword, salt);
      
      // Update using update() with individualHooks: false to skip hooks
      await User.update(
        { password: hashedPassword },
        { 
          where: { id: user.id },
          individualHooks: false // This skips the hooks!
        }
      );
      
      // Or use raw query to bypass hooks
      // await sequelize.query(
      //   `UPDATE Users SET password = '${hashedPassword}' WHERE id = ${user.id}`
      // );
      
      console.log('✅ Password updated successfully!');
      console.log(`🔑 New password: ${testPassword}`);
      
      // Fetch fresh user
      const updatedUser = await User.findByPk(user.id);
      
      // Test again
      const newMatch = await updatedUser.comparePassword(testPassword);
      console.log(`✅ New password match: ${newMatch}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkPassword();