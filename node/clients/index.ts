import { IOClients } from '@vtex/api'

import { MyPCICertifiedClient } from './SecureClient'

export class CustomClients extends IOClients {
  public get myPCIClient() {
    return this.getOrSet('myPCIClient', MyPCICertifiedClient)
  }
}
