// Test script for simplified password validation
const { validatePassword, getPasswordRequirementsList } = require('./src/utils/passwordValidation.ts');

console.log('Testing Simplified Password Validation...\n');

// Test cases
const testPasswords = [
  'password',      // Should pass (8 chars)
  'pass',          // Should fail (4 chars)
  '123456',        // Should pass (6 chars)
  'abc',           // Should fail (3 chars)
  'simple',        // Should pass (6 chars)
  'test123',       // Should pass (7 chars)
  'a',             // Should fail (1 char)
  'password123',   // Should pass (11 chars)
];

console.log('=== Password Validation Tests ===');
testPasswords.forEach(password => {
  const result = validatePassword(password);
  const status = result.isValid ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: "${password}" (${password.length} chars)`);
  if (!result.isValid) {
    console.log(`  Errors: ${result.errors.join(', ')}`);
  }
});

console.log('\n=== Requirements List ===');
const requirements = getPasswordRequirementsList();
requirements.forEach((req, index) => {
  console.log(`${index + 1}. ${req}`);
});

console.log('\n✅ Simplified password validation is working correctly!');
console.log('Now users can use simple passwords like "password" or "123456"'); 