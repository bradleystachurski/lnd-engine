const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const isAvailable = rewire(path.resolve(__dirname, 'is-available'))

describe('is-available', () => {
  describe.only('isAvailable', () => {
    let getInfoStub
    let engine
    let genSeedStub

    beforeEach(() => {
      getInfoStub = sinon.stub().resolves(true)
      genSeedStub = sinon.stub().resolves(true)

      engine = {
        walletUnlocker: sinon.stub(),
        client: sinon.stub()
      }

      isAvailable.__set__('genSeed', genSeedStub)
      isAvailable.__set__('getInfo', getInfoStub)
    })

    it('makes a call to genSeed to see if it succeeds or not', async () => {
      await isAvailable.call(engine)
      expect(genSeedStub).to.have.been.calledWith(sinon.match({ client: engine.walletUnlocker }))
    })

    it('returns true if the call to genSeed is successful', async () => {
      const res = await isAvailable.call(engine)
      expect(res).to.be.true()
    })

    context('engine is available', () => {
      it('returns true if genSeed called failed due to program error', async () => {
        const error = new Error('Something Happened')
        error.code = 2
        genSeedStub.rejects(error)
        const res = await isAvailable.call(engine)
        expect(res).to.be.true()
        expect(getInfoStub).to.not.have.been.called()
      })

      it('returns true if the call to getInfo has succeeded', async () => {
        const UNIMPLEMENTED = isAvailable.__get__('UNIMPLEMENTED_SERVICE_CODE')
        const error = new Error('Unimplemented')
        error.code = UNIMPLEMENTED
        genSeedStub.rejects(error)

        const res = await isAvailable.call(engine)
        expect(res).to.be.true()
        expect(getInfoStub).to.have.been.calledWith(sinon.match({ client: engine.client }))
      })

      it('returns true if the call to getInfo has succeeded, but method has failed', async () => {
        const UNIMPLEMENTED = isAvailable.__get__('UNIMPLEMENTED_SERVICE_CODE')
        const unimplementedError = new Error('Unimplemented')
        unimplementedError.code = UNIMPLEMENTED
        genSeedStub.rejects(unimplementedError)

        const error = new Error('Something Happened')
        error.code = 2
        getInfoStub.rejects(error)

        const res = await isAvailable.call(engine)
        expect(res).to.be.true()
        expect(getInfoStub).to.have.been.calledWith(sinon.match({ client: engine.client }))
      })
    })

    context('engine are unavailable', () => {
      it('returns false if deadline exceeded', async () => {
        const DEADLINE_EXCEEDED_CODE = isAvailable.__get__('DEADLINE_EXCEEDED_CODE')
        const error = new Error('Deadline Exceeded')
        error.code = DEADLINE_EXCEEDED_CODE
        genSeedStub.rejects(error)
        const res = await isAvailable.call(engine)
        expect(res).to.be.false()
        expect(getInfoStub).to.not.have.been.called()
      })

      it('returns false if deadline exceeded', async () => {
        const UNAVAILABLE_CODE = isAvailable.__get__('UNAVAILABLE_CODE')
        const error = new Error('Deadline Exceeded')
        error.code = UNAVAILABLE_CODE
        genSeedStub.rejects(error)
        const res = await isAvailable.call(engine)
        expect(res).to.be.false()
        expect(getInfoStub).to.not.have.been.called()
      })

      it('calls getInfo if the engines is available but genSeed is unimplemented', async () => {
        const UNIMPLEMENTED = isAvailable.__get__('UNIMPLEMENTED_SERVICE_CODE')
        const error = new Error('Unimplemented')
        error.code = UNIMPLEMENTED
        genSeedStub.rejects(error)
        await isAvailable.call(engine)
        expect(getInfoStub).to.have.been.calledWith(sinon.match({ client: engine.client }))
      })

      describe('getInfo rpc check', () => {
        beforeEach(() => {
          const UNIMPLEMENTED = isAvailable.__get__('UNIMPLEMENTED_SERVICE_CODE')
          const error = new Error('Unimplemented')
          error.code = UNIMPLEMENTED
          genSeedStub.rejects(error)
        })

        it('returns false if getInfo returns unavailable', async () => {
          const UNAVAILABLE = isAvailable.__get__('UNAVAILABLE_CODE')
          const error = new Error('Unavailable')
          error.code = UNAVAILABLE
          getInfoStub.rejects(error)
          const res = await isAvailable.call(engine)
          expect(res).to.be.false()
          expect(getInfoStub).to.have.been.calledWith(sinon.match({ client: engine.client }))
        })

        it('returns false if getInfo returns deadline exceeded', async () => {
          const DEADLINE_EXCEEDED_CODE = isAvailable.__get__('DEADLINE_EXCEEDED_CODE')
          const error = new Error('Unavailable')
          error.code = DEADLINE_EXCEEDED_CODE
          getInfoStub.rejects(error)
          const res = await isAvailable.call(engine)
          expect(res).to.be.false()
          expect(getInfoStub).to.have.been.calledWith(sinon.match({ client: engine.client }))
        })
      })
    })
  })
})
