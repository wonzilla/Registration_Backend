


module.exports = (models)=>{
    const {Registration , User} = models;
     User.hasMany(Registration, {
    foreignKey: 'userId',
    as: 'registrations',
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
  });
}