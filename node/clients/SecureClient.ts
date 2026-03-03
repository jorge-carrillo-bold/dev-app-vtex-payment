import { IOContext, InstanceOptions, RequestConfig } from '@vtex/api'
import {
  SecureExternalClient,
  CardAuthorization,
  isTokenizedCard,
} from '@vtex/payment-provider'

export class MyPCICertifiedClient extends SecureExternalClient {
  constructor(protected context: IOContext, options?: InstanceOptions) {
    super('https://qa.online-cde.api.bold.co', context, options)
  }

  public processPayment = (
    cardRequest: CardAuthorization,
    accountName: string | undefined
  ) => {
    let payload

    if (isTokenizedCard(cardRequest.card)) {
      payload = {
        holder: cardRequest.card.holderToken,
        number: cardRequest.card.numberToken,
        expiration: cardRequest.card.expiration,
        csc: cardRequest.card.cscToken,
      }
    } else {
      payload = {
        holder: cardRequest.card.holder,
        number: cardRequest.card.number,
        expiration: cardRequest.card.expiration,
        csc: cardRequest.card.csc,
      }
    }

    return this.http.post(
      '/ecommerce/vtex/payments',
      {
        accountName,
        payload,
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
