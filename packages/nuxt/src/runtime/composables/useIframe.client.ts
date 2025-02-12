import type { EncryptedRPCSession } from 'safe-rpc-iframe'
import { createParentIFrameRPCSession } from 'safe-rpc-iframe'
import { useRuntimeConfig, useState } from '#imports'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IParentFrameRPCInterface {}

export interface IChildFrameRPCInterface {
  createWallet(): Promise<{ data?: string, error?: string }>
}

abstract class InternalLogic {
  peer: IChildFrameRPCInterface

  rpcSession: EncryptedRPCSession

  constructor(peer: IChildFrameRPCInterface, rpcSession: EncryptedRPCSession) {
    this.peer = peer
    this.rpcSession = rpcSession
  }

  dispose() {
    this.rpcSession.dispose()
  }
}

export class ParentRPCHandlerClass extends InternalLogic implements IParentFrameRPCInterface {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(peer: IChildFrameRPCInterface, rpcSession: EncryptedRPCSession) {
    super(peer, rpcSession)
  }
}

export function useIframe() {
  const baseURL = useRuntimeConfig().public.apiUrl

  const iframe = useState<ParentRPCHandlerClass | null>('auth:iframe', () => null)

  async function createIFrame(src: string): Promise<ParentRPCHandlerClass> {
    console.log('creating iframe')
    const session = await createParentIFrameRPCSession(src)
    console.log('session', session)

    return session.registerHandlerClass<ParentRPCHandlerClass, IChildFrameRPCInterface>(
      (peer, session) => new ParentRPCHandlerClass(peer, session),
    )
  }

  const init = async () => {
    console.log('[useAuth] init')
    if (iframe.value === null) {
      iframe.value = await createIFrame(`${baseURL}/iframe`)
    }
  }

  const createWallet = async () => {
    if (iframe.value === null) {
      return { error: 'iframe not initialized' }
    }

    return iframe.value.peer.createWallet()
  }

  return {
    init,
    createWallet,
  }
}
