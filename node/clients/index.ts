import { IOClients } from '@vtex/api'

import BoldClient from './boldClient'

export class Clients extends IOClients {
  public get bold() {
    return this.getOrSet('bold', BoldClient)
  }
}
