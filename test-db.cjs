const { Client } = require('pg');

const passwords = ['postgres', 'password', 'root', 'admin', '', '1234', '123456'];
const username = 'postgres';
const database = 'postgres';

async function testPasswords() {
  for (const pwd of passwords) {
    const client = new Client({
      host: 'localhost',
      port: 5432,
      user: username,
      password: pwd,
      database: database,
    });

    try {
      await client.connect();
      console.log(`SUCCESS: Connected with password: "${pwd}"`);
      await client.end();
      return pwd;
    } catch (err) {
      console.log(`FAILED with password: "${pwd}" - ${err.message}`);
    }
  }
  console.log('NO MATCH FOUND');
  return null;
}

testPasswords();
