import { ExternalClient, IOContext, InstanceOptions } from '@vtex/api'
import { AuthorizationRequest } from '@vtex/payment-provider'

const BOLD_BASE_URL = 'https://qa.online-cde.api.bold.co'

export default class BoldClient extends ExternalClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(BOLD_BASE_URL, ctx, {
      ...options,
      headers: {
        ...options?.headers,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 6000,
      retries: 1,
    })
  }

  public async createPayment(
    body: AuthorizationRequest,
    appToken: string,
    appKey: string
  ): Promise<any> {
    return this.http.post('/ecommerce/vtex/payments', body, {
      headers: {
        'x-vtex-api-appKey': appKey,
        'x-vtex-api-appToken': appToken,
        'x-vtex-api-is-testsuite': 'false',
      },
      timeout: 6000,
      metric: 'bold-create-payment',
    })
  }
}
