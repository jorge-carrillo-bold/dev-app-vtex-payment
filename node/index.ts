import { PaymentProviderService } from '@vtex/payment-provider'

import { Clients } from './clients'
import TestSuiteApprover from './connector'

export default new PaymentProviderService({
  connector: TestSuiteApprover,
  clients: {
    implementation: Clients,
    options: {
      default: {
        retries: 2,
        timeout: 10000,
      },
    },
  },
})
