import {
  AuthorizationRequest,
  AuthorizationResponse,
  CancellationRequest,
  CancellationResponse,
  Cancellations,
  PaymentProvider,
  RefundRequest,
  RefundResponse,
  Refunds,
  SettlementRequest,
  SettlementResponse,
  Settlements,
} from '@vtex/payment-provider'
import { VBase } from '@vtex/api'

import { randomString, randomUrl } from './utils'
import { executeAuthorization } from './flow'

const authorizationsBucket = 'authorizations'
const persistAuthorizationResponse = async (
  vbase: VBase,
  resp: AuthorizationResponse
) => vbase.saveJSON(authorizationsBucket, resp.paymentId, resp)

const getPersistedAuthorizationResponse = async (
  vbase: VBase,
  req: AuthorizationRequest
) =>
  vbase.getJSON<AuthorizationResponse | undefined>(
    authorizationsBucket,
    req.paymentId,
    true
  )

export default class TestSuiteApprover extends PaymentProvider {
  // This class needs modifications to pass the test suit.
  // Refer to https://help.vtex.com/en/tutorial/payment-provider-protocol#4-testing
  // in order to learn about the protocol and make the according changes.

  private async saveAndRetry(
    req: AuthorizationRequest,
    resp: AuthorizationResponse
  ) {
    await persistAuthorizationResponse(this.context.clients.vbase, resp)
    this.callback(req, resp)
  }

  public async authorize(
    authorization: AuthorizationRequest
  ): Promise<AuthorizationResponse> {
    if (this.isTestSuite) {
      const persistedResponse = await getPersistedAuthorizationResponse(
        this.context.clients.vbase,
        authorization
      )

      if (persistedResponse) return persistedResponse

      return executeAuthorization(authorization, response =>
        this.saveAndRetry(authorization, response)
      )
    }

    // FLUJO PENDING PARA PROBAR APP DATA
    // Respondemos con status 'undefined' según la interfaz de VTEX
    return {
      paymentId: authorization.paymentId,
      status: 'undefined', // Indica que el pago está pendiente/en proceso
      tid: authorization.transactionId,
      authorizationId: randomString(), // ID interno de tu sistema
      delayToCancel: 3600, // Tiempo en segundos antes de que VTEX cancele automáticamente

      // Probar paymentAppData (Esto es lo que recibirá tu App de pago en el frontend)
      paymentAppData: {
        appName: 'bold-vtex-payment-app-3ds', // El nombre de tu app de pago definida en el manifest
        payload: JSON.stringify({
          paymentUrl: randomUrl(),
        }),
      },
      paymentUrl: null, // O una URL de respaldo si la app falla
      acquirer: 'Bold',
      code: '201', // Código de creación exitosa
      message: 'Awaiting payment app interaction',
    }
  }

  public async cancel(
    cancellation: CancellationRequest
  ): Promise<CancellationResponse> {
    if (this.isTestSuite) {
      return Cancellations.approve(cancellation, {
        cancellationId: randomString(),
      })
    }

    throw new Error('Not implemented')
  }

  public async refund(refund: RefundRequest): Promise<RefundResponse> {
    if (this.isTestSuite) {
      return Refunds.deny(refund)
    }

    throw new Error('Not implemented')
  }

  public async settle(
    settlement: SettlementRequest
  ): Promise<SettlementResponse> {
    if (this.isTestSuite) {
      return Settlements.deny(settlement)
    }

    throw new Error('Not implemented')
  }

  public inbound: undefined
}
