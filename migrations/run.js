const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

async function runMigrations() {
  const dbName = process.env.DB_NAME || 'racional_db';
  
  // Pool para conectar a la base de datos "postgres" (siempre existe)
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('🔍 Checking if database exists...\n');
    
    // Verificar si la base de datos existe
    const checkDb = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (checkDb.rows.length === 0) {
      console.log(`📦 Creating database "${dbName}"...\n`);
      await adminPool.query(`CREATE DATABASE ${dbName}`);
      console.log('✅ Database created successfully!\n');
    } else {
      console.log('✅ Database already exists\n');
    }

    await adminPool.end();

    // Ahora conectar a nuestra base de datos
    const appPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: dbName,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    });

    console.log('🚀 Running migrations...\n');

    // Ejecutar migración principal (schema)
    const migrationFile = path.join(__dirname, '001_init.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    await appPool.query(sql);

    console.log('✅ Schema created successfully!\n');

    // Ejecutar datos de prueba
    console.log('📝 Inserting sample data...\n');
    const sampleDataFile = path.join(__dirname, '002_sample_data.sql');
    
    if (fs.existsSync(sampleDataFile)) {
      const sampleSql = fs.readFileSync(sampleDataFile, 'utf8');
      await appPool.query(sampleSql);
      console.log('✅ Sample data inserted!\n');
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('📊 Database schema created:');
    console.log('   - users');
    console.log('   - portfolios');
    console.log('   - cash_movements');
    console.log('   - stock_orders');
    console.log('   - portfolio_positions');
    console.log('\n✨ Sample data inserted for testing\n');

    await appPool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n💡 Tips:');
    console.error('   - Check that PostgreSQL is running');
    console.error('   - Verify your .env credentials are correct');
    console.error('   - Make sure DB_PASSWORD matches your PostgreSQL password');
    process.exit(1);
  }
}

runMigrations();
