module.exports = (models) => {
  const { RegistrationPayment, Registration, Media } = models;

  // RegistrationPayment belongs to Registration
  RegistrationPayment.belongsTo(Registration, {
    foreignKey: 'registrationId',
    as: 'registration',
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
  });

  // RegistrationPayment has many Media
  RegistrationPayment.hasMany(Media, {
    foreignKey: "moduleId",
    as: "screenshots",
    constraints: false,
    scope: {
      moduleType: "payment"
    }
  });
};