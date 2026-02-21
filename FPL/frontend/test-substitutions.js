// Quick test file to validate substitution logic
import { runSubstitutionTests, testScenario } from './src/lib/substitution-test.ts';

console.log('🚀 FPL Substitution Logic Tests');
console.log('================================');

// Run all tests
const results = runSubstitutionTests();

// Test specific scenarios
console.log('\n🎯 Detailed Test Results:');
console.log('=========================');

// Test captain/vice-captain scenario in detail
const captainTest = testScenario('captainViceCaptainSwap');
console.log('\n📋 Captain/Vice-Captain Test:', captainTest);

export { results };