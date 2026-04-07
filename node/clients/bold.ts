import { IOContext, InstanceOptions } from '@vtex/api'
import {
  AuthorizationRequest,
  SecureExternalClient,
} from '@vtex/payment-provider'

const BOLD_BASE_URL = 'https://qa.online-cde.api.bold.co'
const BOLD_PROXY_TO = `${BOLD_BASE_URL}:443`
const BASE_PATH = '/ecommerce/vtex'
const BOLD_PAYMENTS_ENDPOINT = `${BOLD_BASE_URL}${BASE_PATH}/payments`

export default class BoldClient extends SecureExternalClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(BOLD_BASE_URL, ctx, {
      ...options,
      headers: {
        ...options?.headers,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-vtex-use-https': 'true',
        'x-vtex-proxy-to': BOLD_PROXY_TO,
      },
      timeout: 15000,
      retries: 1,
    })
  }

  private proxyHeaders(appToken: string, appKey: string, isTestSuite = false) {
    return {
      'x-vtex-api-appKey': appKey,
      'x-vtex-api-appToken': appToken,
      'x-vtex-use-https': 'true',
      'x-vtex-proxy-to': BOLD_PROXY_TO,
      'x-vtex-api-is-testsuite': isTestSuite.toString(),
    }
  }

  /**
   * Llama al secureProxyUrl de VTEX Gateway para que este reemplace
   * los tokens de tarjeta por datos reales y reenvíe la solicitud a Bold.
   */
  public async createPaymentViaSecureProxy(
    secureProxyUrl: string,
    body: any,
    appToken: string,
    appKey: string,
    isTestSuite: boolean
  ): Promise<any> {
    return this.http.post(secureProxyUrl, body, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-PROVIDER-Forward-To': BOLD_PAYMENTS_ENDPOINT,
        'X-PROVIDER-Forward-x-vtex-api-appkey': appKey,
        'X-PROVIDER-Forward-x-vtex-api-apptoken': appToken,
        'X-PROVIDER-Forward-x-vtex-api-is-testsuite': isTestSuite.toString(),
      },
      metric: 'bold-create-payment-secure-proxy',
    })
  }

  /**
   * Para métodos de pago que NO usan tarjeta (PSE, Nequi, Bancolombia, QR),
   * se llama directamente a Bold a través del proxy de VTEX IO.
   */
  public async createPayment(
    body: AuthorizationRequest | any,
    appToken: string,
    appKey: string,
    isTestSuite: boolean
  ): Promise<any> {
    return this.http.post(`${BASE_PATH}/payments`, body, {
      headers: this.proxyHeaders(appToken, appKey, isTestSuite),
      metric: 'bold-create-payment',
    })
  }

  public async cancelPayment(
    paymentId: string,
    body: any,
    appToken: string,
    appKey: string
  ): Promise<any> {
    return this.http.post(
      `${BASE_PATH}/payments/${paymentId}/cancellations`,
      body,
      {
        headers: this.proxyHeaders(appToken, appKey),
        metric: 'bold-cancel-payment',
      }
    )
  }

  public async refundPayment(
    paymentId: string,
    body: any,
    appToken: string,
    appKey: string
  ): Promise<any> {
    return this.http.post(`${BASE_PATH}/payments/${paymentId}/refunds`, body, {
      headers: this.proxyHeaders(appToken, appKey),
      metric: 'bold-refund-payment',
    })
  }

  public async settlePayment(
    paymentId: string,
    body: any,
    appToken: string,
    appKey: string
  ): Promise<any> {
    return this.http.post(
      `${BASE_PATH}/payments/${paymentId}/settlements`,
      body,
      {
        headers: this.proxyHeaders(appToken, appKey),
        metric: 'bold-settle-payment',
      }
    )
  }
}
