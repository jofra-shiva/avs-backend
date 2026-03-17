const bcrypt = require('bcryptjs');
const hash = '$2a$10$ndcRFLujcmNgMBG80PHrT.vMa40BvcCpiO53ZJkWS7dAWr8YQ7nva';
const pass = '12345678';
bcrypt.compare(pass, hash).then(res => {
    console.log('Result for hash 1:', res);
});

// Let's also check if it was hashed twice
const doubleHashPass = '$2a$10$ndcRFLujcmNgMBG80PHrT.vMa40BvcCpiO53ZJkWS7dAWr8YQ7nva'; // This IS the hash
// If this hash was treated as a password and hashed again...
// Then comparing '12345678' to it would fail.
// But comparing the hash to ITSELF (if it was hashed) would succeed? No.

// Let's check a standard hash of '12345678'
bcrypt.hash('12345678', 10).then(h => {
    console.log('Standard hash example:', h);
});
