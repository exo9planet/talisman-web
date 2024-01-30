import { StatemintAdapter } from '@polkawallet/bridge/adapters/statemint'
import { ParallelAdapter } from '@polkawallet/bridge/adapters/parallel'
import { CentrifugeAdapter } from '@polkawallet/bridge/adapters/centrifuge'
import { type BaseCrossChainAdapter } from '@polkawallet/bridge/base-chain-adapter'

import BN from 'bn.js'

type RouteConfig = {
  to: string
  token: string
  xcm: {
    fee: { token: string; amount: string }
    weightLimit: string
  }
}

type TokenConfig = {
  name: string
  symbol: string
  decimals: number
  ed: string
  toRaw: () => BN | number | string
}

type ExtendedAdapter<T extends new (...args: any[]) => BaseCrossChainAdapter> = new () => InstanceType<T> &
  BaseCrossChainAdapter

function createRouteConfigs(from: string, routes: RouteConfig[]): RouteConfig[] {
  return routes.map(route => ({ ...route, from }))
}

function extendAdapter<T extends typeof StatemintAdapter | typeof ParallelAdapter | typeof CentrifugeAdapter>(
  AdapterClass: T,
  additionalRoutes: RouteConfig[],
  additionalTokens: Record<string, TokenConfig>
): ExtendedAdapter<T> {
  return class ExtendedAdapter extends AdapterClass {
    routers: RouteConfig[] | undefined
    tokens: Record<string, TokenConfig> | undefined

    constructor() {
      super()
      this.addRouters()
      this.addTokens()
    }

    addRouters() {
      // TODO: check for additionalRoutes already existing. If so, don't add.
      const newRoutes = createRouteConfigs('extended', additionalRoutes)
      const existingRoutes = this.routers ?? []
      this.routers = [...existingRoutes, ...newRoutes]
    }

    addTokens() {
      // TODO: check for additionalTokens already existing. If so, don't add.
      const existingTokens = this.tokens ?? {}
      this.tokens = { ...existingTokens, ...additionalTokens }
    }
  } as unknown as ExtendedAdapter<T>
}

const newStatemintRoutes: RouteConfig[] = [
  {
    to: 'parallel',
    token: 'USDT',
    xcm: {
      fee: { token: 'USDT', amount: '4000' },
      weightLimit: 'Unlimited',
    },
  },
  {
    to: 'centrifuge',
    token: 'USDC',
    xcm: {
      fee: { token: 'USDC', amount: '4000' },
      weightLimit: 'Unlimited',
    },
  },
]

const newStatemintTokens: Record<string, TokenConfig> = {
  USDC: {
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    ed: '700000',
    toRaw: () => new BN(1337),
  },
}

const newParallelRoutes: RouteConfig[] = [
  {
    to: 'statemint',
    token: 'USDT',
    xcm: {
      fee: { token: 'USDT', amount: '4000' },
      weightLimit: 'Unlimited',
    },
  },
]

const newParallelTokens: Record<string, TokenConfig> = {
  USDT: {
    name: 'USDT',
    symbol: 'USDT',
    decimals: 6,
    ed: '700000',
    toRaw: () => 102,
  },
}

const newCentrifugeTokens: Record<string, TokenConfig> = {
  USDC: {
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    ed: '700000',
    toRaw: () => 'USDC',
  },
}

const ExtendedStatemintAdapter = extendAdapter(StatemintAdapter, newStatemintRoutes, newStatemintTokens)
const ExtendedParallelAdapter = extendAdapter(ParallelAdapter, newParallelRoutes, newParallelTokens)
const ExtendedCentrifugeAdapter = extendAdapter(CentrifugeAdapter, [], newCentrifugeTokens)

export { ExtendedStatemintAdapter, ExtendedParallelAdapter, ExtendedCentrifugeAdapter }
