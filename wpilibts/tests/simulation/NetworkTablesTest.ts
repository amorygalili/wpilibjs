/**
 * Test for the NetworkTables integration.
 *
 * This test verifies that the NetworkTables integration works correctly.
 */

import { networkTables } from '../../src';

/**
 * Run the NetworkTables test.
 */
async function runNetworkTablesTest() {
  console.log('Starting NetworkTables test...');

  try {
    // Test 1: Start the NetworkTables server on port 1736
    console.log('Test 1: Starting NetworkTables server on port 1736...');
    await networkTables.startServer(1736);
    console.log('Test 1: NetworkTables server started successfully');

    // Test 2: Create and set topics
    console.log('Test 2: Creating and setting topics...');
    const booleanTopic = networkTables.getBoolean('Test/Boolean');
    const numberTopic = networkTables.getNumber('Test/Number');
    const stringTopic = networkTables.getString('Test/String');

    // Set values using the setValue method instead of the value property
    booleanTopic.setValue(true);
    numberTopic.setValue(42);
    stringTopic.setValue('Hello, NetworkTables!');

    // Verify that the values were set correctly
    if (booleanTopic.value !== true) throw new Error('Boolean topic value not set correctly');
    if (numberTopic.value !== 42) throw new Error('Number topic value not set correctly');
    if (stringTopic.value !== 'Hello, NetworkTables!') throw new Error('String topic value not set correctly');

    console.log('Test 2: Topics created and set successfully');

    // Test 3: Listen for value changes
    console.log('Test 3: Testing value change events...');

    let booleanChanged = false;
    let numberChanged = false;
    let stringChanged = false;

    booleanTopic.on('valueChanged', (value) => {
      console.log(`Boolean topic changed to ${value}`);
      booleanChanged = true;
    });

    numberTopic.on('valueChanged', (value) => {
      console.log(`Number topic changed to ${value}`);
      numberChanged = true;
    });

    stringTopic.on('valueChanged', (value) => {
      console.log(`String topic changed to ${value}`);
      stringChanged = true;
    });

    // Change the values
    booleanTopic.setValue(false);
    numberTopic.setValue(99);
    stringTopic.setValue('Updated value');

    // Wait a moment for the events to fire
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify that the events fired
    if (!booleanChanged) throw new Error('Boolean topic change event not fired');
    if (!numberChanged) throw new Error('Number topic change event not fired');
    if (!stringChanged) throw new Error('String topic change event not fired');

    console.log('Test 3: Value change events fired successfully');

    // Test 4: Disconnect from NetworkTables
    console.log('Test 4: Disconnecting from NetworkTables...');
    await networkTables.disconnect();
    console.log('Test 4: Disconnected from NetworkTables successfully');

    console.log('All NetworkTables tests passed!');
    return true;
  } catch (error) {
    console.error('NetworkTables test failed:', error);
    return false;
  }
}

// Run the test if this file is run directly
if (require.main === module) {
  runNetworkTablesTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export { runNetworkTablesTest };
