import { QueryClient } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react-native'
import { useClearQueryCacheOnIdentityChange } from './useClearQueryCacheOnIdentityChange'

describe('useClearQueryCacheOnIdentityChange', () => {
  it('does not clear on the very first render (nothing cached yet, no prior identity to compare against)', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })
    const clear = jest.spyOn(queryClient, 'clear')
    renderHook(({ userId }) => useClearQueryCacheOnIdentityChange(queryClient, userId), { initialProps: { userId: 'user-a' } })
    expect(clear).not.toHaveBeenCalled()
  })

  it('clears the cache when the identity changes from one account to a different one', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })
    const clear = jest.spyOn(queryClient, 'clear')
    const { rerender } = renderHook(({ userId }) => useClearQueryCacheOnIdentityChange(queryClient, userId), {
      initialProps: { userId: 'user-a' as string | null },
    })

    rerender({ userId: 'user-b' })

    expect(clear).toHaveBeenCalledTimes(1)
  })

  it('clears the cache on logout (identity goes from a real user to null)', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })
    const clear = jest.spyOn(queryClient, 'clear')
    const { rerender } = renderHook(({ userId }) => useClearQueryCacheOnIdentityChange(queryClient, userId), {
      initialProps: { userId: 'user-a' as string | null },
    })

    rerender({ userId: null })

    expect(clear).toHaveBeenCalledTimes(1)
  })

  it('does not clear again on the login that follows a logout (already cleared once)', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })
    const clear = jest.spyOn(queryClient, 'clear')
    const { rerender } = renderHook(({ userId }) => useClearQueryCacheOnIdentityChange(queryClient, userId), {
      initialProps: { userId: 'user-a' as string | null },
    })

    rerender({ userId: null }) // logout — clears once
    rerender({ userId: 'user-b' }) // a different account logs in

    expect(clear).toHaveBeenCalledTimes(1)
  })

  it('does not clear when the same identity re-renders (e.g. a token refresh)', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })
    const clear = jest.spyOn(queryClient, 'clear')
    const { rerender } = renderHook(({ userId }) => useClearQueryCacheOnIdentityChange(queryClient, userId), {
      initialProps: { userId: 'user-a' as string | null },
    })

    rerender({ userId: 'user-a' })

    expect(clear).not.toHaveBeenCalled()
  })

  it('never clears while staying logged out (null -> null)', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })
    const clear = jest.spyOn(queryClient, 'clear')
    const { rerender } = renderHook(({ userId }) => useClearQueryCacheOnIdentityChange(queryClient, userId), {
      initialProps: { userId: null as string | null },
    })

    rerender({ userId: null })

    expect(clear).not.toHaveBeenCalled()
  })
})
