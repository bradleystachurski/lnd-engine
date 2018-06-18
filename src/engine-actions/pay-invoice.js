const {
  sendPayment
} = require('../lnd-actions')

/**
 * Given a payment request, it pays the invoices and returns a refund invoice
 *
 * @param {String} paymentRequest
 * @param {Object} options
 * @param {Number} expiry expiration of refund invoices
 * @return {String} refundPaymentRequest
 */

async function payInvoice (paymentRequest, options = {}) {
  const { paymentError } = await sendPayment(paymentRequest, { client: this.client })

  if (paymentError) {
    this.logger.error('Failed to pay invoice', { paymentRequest })
    throw new Error(paymentError)
  }

  this.logger.debug('Payment successfully made', { paymentRequest })

  return null
}

module.exports = payInvoice
