import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'mysql',
  dialectModule: mysql2,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'exchange_geo',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  timezone: '+00:00',
  define: {
    underscored: true,
    freezeTableName: true,
    timestamps: true
  }
});

export default sequelize;