const { Op } = require('sequelize');
const { FileMoveService, cloudinary } = require('../../modules/uploadModule');
const { generateUniqueSlug } = require('../../helper/generateSlug');

class CourseService {
  constructor(models) {
    this.models = models;
    this.Course = models.Course;
    this.Media = models.Media;
    this.TempUpload = models.TempUpload;
  }

async createCourse(courseData, tempImageIds = []) {
  const requiredFields = ['name', 'category', 'duration', 'originalFee', 'discountedFee', 'description'];
  for (const field of requiredFields) {
    if (!courseData[field]) {
      throw new Error(`${field} is required`);
    }
  }

  // Validate prices
  const originalFee = parseFloat(courseData.originalFee);
  const discountedFee = parseFloat(courseData.discountedFee);
  
  if (originalFee <= 0) {
    throw new Error('Original fee must be greater than 0');
  }
  
  if (discountedFee < 0) {
    throw new Error('Discounted fee cannot be negative');
  }
  
  if (discountedFee > originalFee) {
    throw new Error('Discounted fee must be less than or equal to original fee');
  }
  
  // Calculate discounted percentage
  let discountedPercentage = 0;
  if (discountedFee < originalFee && originalFee > 0) {
    discountedPercentage = ((originalFee - discountedFee) / originalFee) * 100;
    discountedPercentage = Math.round(discountedPercentage * 100) / 100; // Round to 2 decimal places
  }

  // Generate unique slug
  const slug = await generateUniqueSlug(courseData.name);

  // Process temp images
  let imageUrls = [];
  if (tempImageIds && Array.isArray(tempImageIds) && tempImageIds.length > 0) {
    for (const tempId of tempImageIds) {
      const tempUpload = await this.TempUpload.findByPk(tempId);
      
      if (tempUpload && !tempUpload.isUsed) {
        const moveResult = await FileMoveService.moveFileToPermanent(
          tempUpload.fileId,
          'course-image'
        );
        
        if (moveResult.success) {
          imageUrls.push({
            url: moveResult.newUrl,
            public_id: moveResult.newPublicId,
            resource_type: 'image'
          });
          
          await tempUpload.update({
            isUsed: true,
            metadata: {
              ...tempUpload.metadata,
              movedTo: moveResult.newPublicId,
              movedAt: new Date()
            }
          });
        }
      }
    }
  }


  // Create course with slug and price fields
  const course = await this.Course.create({
    name: courseData.name,
    slug: slug,
    category: courseData.category,
    icon: courseData.icon || '📚',
    duration: courseData.duration,
    originalFee: originalFee,
    discountedFee: discountedFee,
    discountedPercentage: discountedPercentage,
    description: courseData.description,
    prerequisites: courseData.prerequisites || null,
    outline: courseData.outline || [],
    features: courseData.features || [],
    schedule: courseData.schedule || null,
    isActive: courseData.isActive !== undefined ? courseData.isActive : true,
    order: courseData.order || 0
  });

  // Save images to Media table
  if (imageUrls.length > 0) {
    const mediaToInsert = imageUrls.map((img, index) => ({
      url: img.url,
      public_id: img.public_id,
      isPrivate: false,
      type: 'image',
      folder: 'courses',
      moduleType: 'course',
      moduleId: course.id,
    }));

    await this.Media.bulkCreate(mediaToInsert);
  }

  // Get created images
  const images = await this.Media.findAll({
    where: { moduleType: 'course', moduleId: course.id },
  });

  return { course, images };
}

  async getCourseBySlug(slug) {
    const course = await this.Course.findOne({
      where: { slug },
      include: [
        {
          model: this.Media,
          as: 'images',
          required: false,
          where: { moduleType: 'course' },
          attributes: ['id', 'url', 'public_id']
        }
      ]
    });
    
    if (!course) {
      throw new Error('Course not found');
    }
    
    return course;
  }

async getAllCourses(filters = {}) {
    const where = {};
    
    // Check if category exists and is not empty string
    if (filters.category && filters.category !== '') {
      where.category = filters.category;
    }
    
    // Check if isActive exists and is not undefined/null/empty string
    if (filters.isActive !== undefined && filters.isActive !== null && filters.isActive !== '') {
      // Handle both string and boolean values
      if (typeof filters.isActive === 'string') {
        where.isActive = filters.isActive === 'true';
      } else {
        where.isActive = filters.isActive === true;
      }
    }
    
    // Check if search exists and is not empty string
    if (filters.search && filters.search !== '') {
      where[Op.or] = [
        { name: { [Op.like]: `%${filters.search}%` } },
        { description: { [Op.like]: `%${filters.search}%` } }
      ];
    }

    const courses = await this.Course.findAll({
      where,
      include: [
        {
          model: this.Media,
          as: 'images',
          required: false,
          where: { moduleType: 'course' },
          attributes: ['id', 'url', 'public_id']
        }
      ],
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });

    // Parse outline and features for each course
    const parsedCourses = courses.map(course => {
      const courseData = course.toJSON();
      
      // Parse outline
      if (courseData.outline && typeof courseData.outline === 'string') {
        try {
          courseData.outline = JSON.parse(courseData.outline);
        } catch (e) {
          courseData.outline = [];
        }
      }
      if (!Array.isArray(courseData.outline)) {
        courseData.outline = [];
      }
      
      // Parse features
      if (courseData.features && typeof courseData.features === 'string') {
        try {
          courseData.features = JSON.parse(courseData.features);
        } catch (e) {
          courseData.features = [];
        }
      }
      if (!Array.isArray(courseData.features)) {
        courseData.features = [];
      }
      
      return courseData;
    });

    return parsedCourses;
}

async getCourseById(courseId) {
  const course = await this.Course.findByPk(courseId, {
    include: [
      {
        model: this.Media,
        as: 'images',
        required: false,
        where: { moduleType: 'course' },
        attributes: ['id', 'url', 'public_id']
      }
    ]
  });
  
  if (!course) {
    throw new Error('Course not found');
  }
  
  // Parse JSON fields if they are stored as strings
  if (course.outline && typeof course.outline === 'string') {
    try {
      course.outline = JSON.parse(course.outline);
    } catch (e) {
      course.outline = [];
    }
  }
  
  if (course.features && typeof course.features === 'string') {
    try {
      course.features = JSON.parse(course.features);
    } catch (e) {
      course.features = [];
    }
  }
  
  // Ensure arrays are always returned
  if (!Array.isArray(course.outline)) {
    course.outline = [];
  }
  
  if (!Array.isArray(course.features)) {
    course.features = [];
  }
  
  return course;
}

async updateCourse(courseId, updateData, tempImageIds = [], removeImageIds = []) {
  const course = await this.Course.findByPk(courseId);
  
  if (!course) {
    throw new Error('Course not found');
  }

  // Handle price updates if provided
  let originalFee = course.originalFee;
  let discountedFee = course.discountedFee;
  let discountedPercentage = course.discountedPercentage;

  if (updateData.originalFee !== undefined || updateData.discountedFee !== undefined) {
    originalFee = updateData.originalFee !== undefined ? parseFloat(updateData.originalFee) : course.originalFee;
    discountedFee = updateData.discountedFee !== undefined ? parseFloat(updateData.discountedFee) : course.discountedFee;
    
    // Validate prices
    if (originalFee <= 0) {
      throw new Error('Original fee must be greater than 0');
    }
    
    if (discountedFee < 0) {
      throw new Error('Discounted fee cannot be negative');
    }
    
    if (discountedFee > originalFee) {
      throw new Error('Discounted fee must be less than or equal to original fee');
    }
    
    // Calculate discounted percentage
    discountedPercentage = 0;
    if (discountedFee < originalFee && originalFee > 0) {
      discountedPercentage = ((originalFee - discountedFee) / originalFee) * 100;
      discountedPercentage = Math.round(discountedPercentage * 100) / 100;
    }
    
    // Update the values to be saved
    updateData.originalFee = originalFee;
    updateData.discountedFee = discountedFee;
    updateData.discountedPercentage = discountedPercentage;
  }

  // Handle image removal
  if (removeImageIds && removeImageIds.length > 0) {
    // Get images to delete for cleanup (optional: delete from cloudinary)
    const imagesToDelete = await this.Media.findAll({
      where: { 
        id: removeImageIds, 
        moduleType: 'course', 
        moduleId: courseId 
      }
    });
    
    // Delete from database
    await this.Media.destroy({
      where: { 
        id: removeImageIds, 
        moduleType: 'course', 
        moduleId: courseId 
      }
    });
    
    // Optional: Delete from cloudinary
    for (const image of imagesToDelete) {
      if (image.public_id) {
        try {
          await cloudinary.uploader.destroy(image.public_id);
        } catch (err) {
          console.error('Failed to delete image from cloudinary:', err);
        }
      }
    }
  }

  // Process new temp images (uploads)
  let newImageUrls = [];
  if (tempImageIds && Array.isArray(tempImageIds) && tempImageIds.length > 0) {
    for (const tempId of tempImageIds) {
      const tempUpload = await this.TempUpload.findByPk(tempId);
      
      if (tempUpload && !tempUpload.isUsed) {
        const moveResult = await FileMoveService.moveFileToPermanent(
          tempUpload.fileId,
          'course-image'
        );
        
        if (moveResult.success) {
          newImageUrls.push({
            url: moveResult.newUrl,
            public_id: moveResult.newPublicId,
            resource_type: 'image'
          });
          
          await tempUpload.update({
            isUsed: true,
            metadata: {
              ...tempUpload.metadata,
              movedTo: moveResult.newPublicId,
              movedAt: new Date()
            }
          });
        }
      }
    }
  }

  // Add new images
  if (newImageUrls.length > 0) {
    const mediaToInsert = newImageUrls.map((img, index) => ({
      url: img.url,
      public_id: img.public_id,
      isPrivate: false,
      type: 'image',
      folder: 'courses',
      moduleType: 'course',
      moduleId: courseId,
    }));

    await this.Media.bulkCreate(mediaToInsert);
  }

  // Handle name change - check uniqueness and update slug
  if (updateData.name && updateData.name !== course.name) {
    const existingCourse = await this.Course.findOne({
      where: { name: updateData.name }
    });
    if (existingCourse) {
      throw new Error('Course with this name already exists');
    }
    // Generate new slug if name changed
    updateData.slug = await generateUniqueSlug(updateData.name);
  }

  // Remove fields that shouldn't be updated directly
  delete updateData.createdAt;
  delete updateData.updatedAt;
  delete updateData.id;

  // Update course
  await course.update(updateData);
  
  // Get updated images with proper order
  const images = await this.Media.findAll({
    where: { moduleType: 'course', moduleId: courseId },
  });
  
  return { course, images };
}

  async deleteCourse(courseId) {
    const course = await this.Course.findByPk(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }
    
    // Delete associated images from Media table
    await this.Media.destroy({
      where: { moduleType: 'course', moduleId: courseId }
    });
    
    await course.destroy();
    
    return { message: 'Course deleted successfully' };
  }

  async getCourseStats() {
    const totalCourses = await this.Course.count();
    const activeCourses = await this.Course.count({ where: { isActive: true } });
    const categories = await this.Course.findAll({
      attributes: ['category', [this.Course.sequelize.fn('COUNT', this.Course.sequelize.col('id')), 'count']],
      group: ['category']
    });
    
    return {
      total: totalCourses,
      active: activeCourses,
      inactive: totalCourses - activeCourses,
      categories: categories.map(cat => ({
        name: cat.category,
        count: parseInt(cat.dataValues.count)
      }))
    };
  }
}

module.exports = CourseService;