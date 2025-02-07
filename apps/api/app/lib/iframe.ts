// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IParentFrameRPCInterface {}

interface IChildFrameRPCInterface {
  createWallet(): Promise<string | undefined>
}

abstract class InternalLogic {
  peer: IParentFrameRPCInterface
  name: string = ''
  constructor(peer: IParentFrameRPCInterface) {
    this.peer = peer
  }
}

export class ChildRPCHandlerClass extends InternalLogic implements IChildFrameRPCInterface {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(peer: IParentFrameRPCInterface) {
    super(peer)
  }

  async createWallet(): Promise<string | undefined> {
    return createWorkerWallet()
  }
}
