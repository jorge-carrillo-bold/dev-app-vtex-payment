import { ExternalClient, IOContext, InstanceOptions } from '@vtex/api'

const BOLD_BASE_URL = 'https://qa.online-cde.api.bold.co'

export default class BoldClient extends ExternalClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(BOLD_BASE_URL, ctx, {
      ...options,
      headers: {
        ...options?.headers,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-vtex-api-appKey': 'KeXJ3hJ1V7UuaTMGwFjFzMd679gFAaF3OEayjcd9OPA',
      },
    })
  }

  public async createPayment(body: any, appToken: string): Promise<any> {
    return this.http.post('/ecommerce/vtex/payments', body, {
      headers: {
        'x-vtex-api-appToken': appToken,
        'x-vtex-api-is-testsuite': 'false',
      },
    })
  }
}
