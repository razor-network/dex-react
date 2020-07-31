import { useEffect, useMemo } from 'react'
import BigNumber from 'bignumber.js'

import { TokenDetails } from 'types'

import useSafeState from 'hooks/useSafeState'
import { usePriceEstimationWithSlippage } from 'hooks/usePriceEstimation'
import { logDebug } from 'utils'

const OWL_TOKEN_ID = 0

/**
 * Hook to query how much in quote token is equivalent to given amount in OWL
 *
 * @param owlUnits How many OWL
 * @param networkId The network id
 * @param quoteToken Token to quote OWL in
 */
export function useOwlAmountInQuoteUnits(
  owlUnits: number,
  networkId: number,
  quoteToken: TokenDetails,
): { amount: BigNumber | null; isLoading: boolean } {
  const [isLoading, setIsLoading] = useSafeState(false)
  const [owlsInQuote, setOwlsInQuote] = useSafeState<BigNumber | null>(null)

  const owlUnitsBigNumber = useMemo(() => new BigNumber(owlUnits), [owlUnits])

  // Get the price of 1 OWL in quote token
  // But why quoting 1 OWL instead of `owlUnits` OWL ?
  // Because due to slippage, the price might be smaller.
  // We don't want that here, thus we multiply the result by given `owlUnits`
  const { priceEstimation, isPriceLoading } = usePriceEstimationWithSlippage({
    networkId,
    amount: '1',
    quoteTokenId: OWL_TOKEN_ID,
    baseTokenId: quoteToken.id,
    baseTokenDecimals: quoteToken.decimals,
  })

  useEffect(() => {
    if (isPriceLoading) {
      setIsLoading(true)
      setOwlsInQuote(null)
      return
    }

    setIsLoading(false)

    if (priceEstimation) {
      setOwlsInQuote(
        quoteToken.id == OWL_TOKEN_ID
          ? owlUnitsBigNumber // Quote token is OWL, 1 OWL in OWL == 1
          : priceEstimation.multipliedBy(owlUnitsBigNumber),
      )
      logDebug(`[useOwlAmountInQuoteUnits] 1 OWL in ${quoteToken.symbol} => ${priceEstimation.toString(10)}`)
    }
  }, [isPriceLoading, owlUnitsBigNumber, priceEstimation, setOwlsInQuote, setIsLoading, quoteToken])

  return { amount: owlsInQuote, isLoading }
}