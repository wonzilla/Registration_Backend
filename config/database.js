const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.MYSQL_DATABASE || 'registrations-353035311130',
    process.env.MYSQL_USER || 'Manager-99bf',
    process.env.MYSQL_PASSWORD || 'Farhan33..',
    
    {
        host: process.env.MYSQL_HOST || 'mysql.gb.stackcp.com',
         port: process.env.MYSQL_PORT,
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

module.exports = sequelize; 