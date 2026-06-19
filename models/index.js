

const fs = require("fs");
const path = require("path");
const sequelize = require("../config/database");

const models = {};

const loadModels = (dir) => {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      loadModels(fullPath);
    } 
    else if (file === "index.js" && fullPath !== __filename) {
      const exported = require(fullPath);

      // ✅ SUPPORT BOTH: single model & multiple models
      if (exported?.prototype instanceof sequelize.Sequelize.Model) {
        models[exported.name] = exported;
      } 
      else if (typeof exported === "object") {
        Object.values(exported).forEach((model) => {
          if (model?.prototype instanceof sequelize.Sequelize.Model) {
            models[model.name] = model;
          }
        });
      }
    }
  });
};

loadModels(__dirname);

// 🔗 Relations
const applyRelations = (dir) => {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      applyRelations(fullPath);
    } 
   else if (file === "relations.js") {
  const relations = require(fullPath);

  if (typeof relations === "function") {
    relations(models);
  } else {
    console.warn(`⚠️ Skipped ${fullPath} (not a function)`);
  }
}
  });
};

applyRelations(__dirname);

models.sequelize = sequelize;
models.Sequelize = require("sequelize");

module.exports = models;
