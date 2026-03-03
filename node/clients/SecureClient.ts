import { IOContext, InstanceOptions, RequestConfig } from '@vtex/api'
import { SecureExternalClient, CardAuthorization } from '@vtex/payment-provider'

export class MyPCICertifiedClient extends SecureExternalClient {
  constructor(protected context: IOContext, options?: InstanceOptions) {
    super('https://qa.online-cde.api.bold.co', context, options)
  }

  public processPayment = (
    cardRequest: CardAuthorization
  ): Promise<Record<string, any>> => {
    return this.http.post(
      '/ecommerce/vtex/payments',
      {
        cardRequest,
      },
      {
        headers: {
          Authorization: 'Bearer your-api-key',
          'Content-Type': 'application/json',
        },
        secureProxy: cardRequest.secureProxyUrl,
      } as RequestConfig
    )
  }
}
