// scripts/hash-admin.js
const bcrypt = require('bcryptjs');

(async () => {
  const hash = await bcrypt.hash('123456789', 10); // <-- tu clave actual
  console.log('HASH:', hash);
})();
