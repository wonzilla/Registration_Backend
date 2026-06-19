module.exports = (models) => {
  const { Visitor, VisitorAction, User, Course, Registration } = models;

  // Visitor belongs to User (optional)
  Visitor.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  // Visitor has many actions
  Visitor.hasMany(VisitorAction, {
    foreignKey: 'sessionId',
    sourceKey: 'sessionId',
    as: 'actions',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
};