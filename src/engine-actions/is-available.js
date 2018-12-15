const {
  getInfo,
  genSeed
} = require('../lnd-actions')

/**
 * CODE 4 for gRPC is equal to 'deadline exceeded'
 *
 * @see https://github.com/grpc/grpc-go/blob/master/codes/codes.go
 * @constant
 * @type {Number}
 * @default
 */
const DEADLINE_EXCEEDED_CODE = 4

/**
 * CODE 12 for gRPC is equal to 'unimplemented'
 *
 * @see https://github.com/grpc/grpc-go/blob/master/codes/codes.go
 * @constant
 * @type {Number}
 * @default
 */
const UNIMPLEMENTED_SERVICE_CODE = 12

/**
 * CODE 14 for gRPC is equal to 'unavailable' or 'could not connect'
 * @see https://github.com/grpc/grpc-go/blob/master/codes/codes.go
 * @constant
 * @type {Number}
 * @default
 */
const UNAVAILABLE_CODE = 14

/**
 * Queries LND for a response as an assumption if the engine is down or not
 *
 * @return {Boolean}
 */
function isAvailable () {
  return new Promise((resolve, reject) => {
    // We call genSeed to see if the engine is up. If we receive a response from
    // the engine, then we can assume that it is available
    genSeed({ client: this.walletUnlocker })
      .then(() => resolve(true))
      .catch((e) => {
        // If we receive a timeout, then it means the engine is down and we can simply
        // return
        if (e.code === DEADLINE_EXCEEDED_CODE) {
          return resolve(false)
        }

        // If this error code is 'unavailable', then that means the node may be down
        // however it is functioning to take at least take requests.
        //
        // If the error code is 'unimplemented', then this means the engine was started
        // in development mode with 'noseedbackup' enabled
        //
        // TODO: Need to figure out a better way to handle development mode for
        //       validations
        if (e.code !== UNAVAILABLE_CODE && e.code !== UNIMPLEMENTED_SERVICE_CODE) {
          return resolve(true)
        }

        // We should only call `getInfo` in the case of development mode for an
        // engine since the WalletUnlocker RPC (genSeed) should always be available
        // on our engine in production usage
        getInfo({ client: this.client })
          .then(() => resolve(true))
          .catch((e) => {
            if (e.code === UNAVAILABLE_CODE || e.code === DEADLINE_EXCEEDED_CODE) {
              resolve(false)
            }

            resolve(true)
          })
      })
  })
}

module.exports = isAvailable
