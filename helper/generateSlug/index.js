const { Course } = require("../../models");

// Generate slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")         // spaces -> hyphen
    .replace(/[^a-z0-9-]/g, "");  // special chars remove
}

// Generate unique slug by checking database
async function generateUniqueSlug(name) {
  let slug = generateSlug(name);
  let exists = await Course.findOne({ where: { slug } });

  let counter = 2;
  while (exists) {
    const newSlug = `${slug}-${counter}`;
    exists = await Course.findOne({ where: { slug: newSlug } });
    if (!exists) {
      slug = newSlug;
      break;
    }
    counter++;
  }

  return slug;
}

module.exports = { generateSlug, generateUniqueSlug };