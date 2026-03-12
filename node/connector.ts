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

import { randomString } from './utils'
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

      if (persistedResponse !== undefined && persistedResponse !== null) {
        return persistedResponse
      }

      return executeAuthorization(authorization, response =>
        this.saveAndRetry(authorization, response)
      )
    }

    // Call direct fake payment "Botón Bancolombia"
    if (authorization.paymentMethod.toString() === 'Botón Bancolombia') {
      const appToken =
        (this.context.request.headers['x-vtex-api-apptoken'] as string) ?? ''

      const boldClient = (this.context.clients as any).bold
      const boldResponse = await boldClient.createPayment(
        authorization,
        appToken
      )

      return boldResponse as AuthorizationResponse
    }

    // Call direct fake payment cards (Visa, Mastercard, etc.)
    const cardMethods = ['Visa', 'Mastercard', 'American Express', 'Diners']

    if (cardMethods.includes(authorization.paymentMethod.toString())) {
      const appToken =
        (this.context.request.headers['x-vtex-api-apptoken'] as string) ?? ''

      const cardAuthorization = {
        ...authorization,
        card: {
          holder: 'demo nombre larog',
          number: '411111111111111',
          csc: '123',
          expiration: {
            month: '12',
            year: '2030',
          },
        },
      }

      const boldClient = (this.context.clients as any).bold
      const boldResponse = await boldClient.createPayment(
        cardAuthorization,
        appToken
      )

      return boldResponse as AuthorizationResponse
    }

    throw new Error('Not implemented')
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
