const { newAddress } = require('../lnd-actions')

/**
 * Nested Segregated Witness address type. This address is referred to as
 * nested-pay-to-witness-key-hash (np2wkh).
 *
 * This value is taken from grpc enums located in lnd's rpc.proto
 *
 * @see {https://github.com/lightningnetwork/lnd/blob/master/lnrpc/rpc.proto}
 * @constant
 * @type {Number}
 * @default
 */
const NESTED_WITNESS_ADDRESS_TYPE = 1 // np2wkh

/**
 * Creates a new wallet address
 *
 * @return {String} address
 */
async function createNewAddress () {
  const address = await newAddress(NESTED_WITNESS_ADDRESS_TYPE, { client: this.client })
  return address
}

module.exports = createNewAddress
