import {
  AuthorizationRequest,
  AuthorizationResponse,
  CancellationRequest,
  CancellationResponse,
  Cancellations,
  isCardAuthorization,
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
import { Clients } from './clients'

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

  private getBoldClient() {
    return ((this.context.clients as unknown) as Clients).bold
  }

  private getCredentials() {
    const appToken =
      (this.context.request.headers['x-vtex-api-apptoken'] as string) ?? ''

    const appKey =
      (this.context.request.headers['x-vtex-api-appkey'] as string) ?? ''

    return { appToken, appKey }
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

    const { appToken, appKey } = this.getCredentials()
    const boldClient = this.getBoldClient()

    let cardAuthorization: AuthorizationRequest | any = authorization

    // Métodos de pago con tarjeta que pasan por Secure Proxy
    const cardMethods = ['Visa', 'Mastercard', 'American Express', 'Diners']

    const isCard =
      isCardAuthorization(authorization) &&
      cardMethods.includes(authorization.paymentMethod.toString())

    if (isCard) {
      cardAuthorization = {
        ...authorization,
        value:
          authorization.miniCart.buyer.lastName === '3ds'
            ? 555020
            : authorization.value,
        card: {
          holder: 'demo nombre larog',
          number: '411111111111111',
          document: '12345678900',
          csc: '123',
          expiration: {
            month: '12',
            year: '2030',
          },
        },
      }

      // Usar Secure Proxy: el Gateway reemplaza tokens por datos reales
      const { secureProxyUrl } = authorization

      if (secureProxyUrl) {
        const boldResponse = await boldClient.createPaymentViaSecureProxy(
          secureProxyUrl,
          cardAuthorization,
          appToken,
          appKey
        )

        return (boldResponse as unknown) as AuthorizationResponse
      }
    }

    // Métodos de pago alternativos (sin tarjeta) - llamada directa vía proxy VTEX IO
    if (authorization.miniCart.buyer.lastName === 'bancolombia') {
      cardAuthorization = {
        ...authorization,
        paymentMethod: 'Botón Bancolombia' as AuthorizationRequest['paymentMethod'],
      }
    }

    if (authorization.miniCart.buyer.lastName === 'nequi') {
      cardAuthorization = {
        ...authorization,
        paymentMethod: 'Nequi' as AuthorizationRequest['paymentMethod'],
      }
    }

    if (authorization.miniCart.buyer.lastName === 'qr') {
      cardAuthorization = {
        ...authorization,
        paymentMethod: 'QR' as AuthorizationRequest['paymentMethod'],
      }
    }

    if (authorization.miniCart.buyer.lastName === 'pse') {
      cardAuthorization = {
        ...authorization,
        paymentMethod: 'PSE' as AuthorizationRequest['paymentMethod'],
        metadata: {
          bankCode: '1811',
        },
      }
    }

    const boldResponse = await boldClient.createPayment(
      cardAuthorization,
      appToken,
      appKey
    )

    return (boldResponse as unknown) as AuthorizationResponse
  }

  public async cancel(
    cancellation: CancellationRequest
  ): Promise<CancellationResponse> {
    if (this.isTestSuite) {
      return Cancellations.approve(cancellation, {
        cancellationId: randomString(),
      })
    }

    const { appToken, appKey } = this.getCredentials()
    const boldResponse = await this.getBoldClient().cancelPayment(
      cancellation.paymentId,
      cancellation,
      appToken,
      appKey
    )

    return (boldResponse as unknown) as CancellationResponse
  }

  public async refund(refund: RefundRequest): Promise<RefundResponse> {
    if (this.isTestSuite) {
      return Refunds.deny(refund)
    }

    const { appToken, appKey } = this.getCredentials()
    const boldResponse = await this.getBoldClient().refundPayment(
      refund.paymentId,
      refund,
      appToken,
      appKey
    )

    return (boldResponse as unknown) as RefundResponse
  }

  public async settle(
    settlement: SettlementRequest
  ): Promise<SettlementResponse> {
    if (this.isTestSuite) {
      return Settlements.deny(settlement)
    }

    const { appToken, appKey } = this.getCredentials()
    const boldResponse = await this.getBoldClient().settlePayment(
      settlement.paymentId,
      settlement,
      appToken,
      appKey
    )

    return (boldResponse as unknown) as SettlementResponse
  }

  public inbound: undefined
}
