module.exports = (models) => {
  const { Visitor, VisitorAction, User, Course, Registration } = models;

  VisitorAction.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  VisitorAction.belongsTo(Course, {
    foreignKey: 'courseId',
    as: 'course',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  VisitorAction.belongsTo(Registration, {
    foreignKey: 'registrationId',
    as: 'registration',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });
};