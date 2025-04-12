/**
 * NetworkTables 4.1 for Node.js
 * 
 * This is a Node.js implementation of the NetworkTables 4.1 protocol.
 */

const { NetworkTablesClient, DataType: ClientDataType } = require('./src/client');
const { NetworkTablesServer, DataType: ServerDataType } = require('./src/server');

// Export client and server
module.exports = {
  NetworkTablesClient,
  NetworkTablesServer,
  DataType: ClientDataType // Both client and server use the same data types
};
