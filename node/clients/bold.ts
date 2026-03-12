import { ExternalClient, IOContext, InstanceOptions } from '@vtex/api'
import { AuthorizationRequest } from '@vtex/payment-provider'

const BOLD_BASE_URL = 'https://qa.online-cde.api.bold.co'
const BOLD_PROXY_TO = `${BOLD_BASE_URL}:443`
const BASE_PATH = '/ecommerce/vtex'

export default class BoldClient extends ExternalClient {
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
      timeout: 8000,
      retries: 1,
    })
  }

  private proxyHeaders(appToken: string, appKey: string) {
    return {
      'x-vtex-api-appKey': appKey,
      'x-vtex-api-appToken': appToken,
      'x-vtex-use-https': 'true',
      'x-vtex-proxy-to': BOLD_PROXY_TO,
    }
  }

  public async createPayment(
    body: AuthorizationRequest | any,
    appToken: string,
    appKey: string
  ): Promise<any> {
    return this.http.post(`${BASE_PATH}/payments`, body, {
      headers: this.proxyHeaders(appToken, appKey),
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
