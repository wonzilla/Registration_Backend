// models/Media/relations.js
module.exports = (models) => {
  const { Registration, Media, Course, RegistrationPayment } = models;

  // Media belongs to Registration (polymorphic)
  Media.belongsTo(Registration, {
    foreignKey: "moduleId",
    as: 'registration',
    constraints: false, // IMPORTANT: No foreign key constraint
    scope: {
      moduleType: 'registration_payment'
    }
  });

  // Media belongs to Course (polymorphic)
  Media.belongsTo(Course, {
    foreignKey: "moduleId",
    as: "course",
    constraints: false, // IMPORTANT: No foreign key constraint
    scope: {
      moduleType: 'course'
    }
  });

  // Media belongs to RegistrationPayment (polymorphic)
  Media.belongsTo(RegistrationPayment, {
    foreignKey: "moduleId",
    as: "payment",
    constraints: false, // IMPORTANT: No foreign key constraint
    scope: {
      moduleType: 'payment'
    }
  });
};