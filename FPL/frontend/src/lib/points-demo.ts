/**
 * Quick demonstration of FPL Points Engine functionality
 */

import { demonstratePointsEngine, demonstrateAdvancedScenario } from './fpl-points-integration';

export function runPointsDemo() {
  console.log('🚀 Running FPL Points Engine Demo...\n');
  
  // Basic scenario demo
  const basicResult = demonstratePointsEngine();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Advanced scenario with chips
  const advancedResult = demonstrateAdvancedScenario();
  
  console.log('\n🎉 Demo completed! Check the console logs above for detailed results.');
  
  return { basicResult, advancedResult };
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).runFPLPointsDemo = runPointsDemo;
}