
module.exports = (models)=>{


const {Media,Course} = models;
  // Course has many Media
  Course.hasMany(Media, {
    foreignKey: "moduleId",
    as: "images",
    constraints: false,
    scope: {
      moduleType: "course"
    }
  });
  
}