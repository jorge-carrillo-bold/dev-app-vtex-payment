import { PaymentProviderService } from '@vtex/payment-provider'

import TestSuiteApprover from './connector'
import { CustomClients } from './clients'

export default new PaymentProviderService({
  connector: TestSuiteApprover,
  clients: {
    implementation: CustomClients,
    options: {
      myPCIClient: { retries: 2, timeout: 10000 },
    },
  },
})
