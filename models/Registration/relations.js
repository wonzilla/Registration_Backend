module.exports = (models) => {
  const { Registration, Media, Course, RegistrationPayment  , User} = models;

  // Registration has many Media
  Registration.hasMany(Media, {
    foreignKey: "moduleId",
    as: "paymentScreenshots",
    constraints: false,
    scope: {
      moduleType: "registration_payment"
    }
  });

  // Registration belongs to Course
  Registration.belongsTo(Course, {
    foreignKey: 'courseId',
    as: 'course',
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
  });


    Registration.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
  });

  

  // Registration has one RegistrationPayment
  Registration.hasOne(RegistrationPayment, {
    foreignKey: 'registrationId',
    as: 'payment',
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
  });
};