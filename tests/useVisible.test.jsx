// tests/useVisible.test.jsx
import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { useVisible } from '../src/hooks/useVisible'

describe('useVisible', () => {
  let observerCallback
  let mockObserver

  beforeEach(() => {
    mockObserver = { observe: vi.fn(), disconnect: vi.fn() }
    global.IntersectionObserver = class {
      constructor(cb) {
        observerCallback = cb
      }
      observe() {
        mockObserver.observe()
      }
      disconnect() {
        mockObserver.disconnect()
      }
    }
  })

  it('starts as not visible', () => {
    const ref = { current: document.createElement('div') }
    const { result } = renderHook(() => useVisible(ref))
    expect(result.current).toBe(false)
  })

  it('becomes true when intersection entry is intersecting', () => {
    const ref = { current: document.createElement('div') }
    const { result } = renderHook(() => useVisible(ref))
    act(() => {
      observerCallback([{ isIntersecting: true }])
    })
    expect(result.current).toBe(true)
  })

  it('stays true once visible (never reverts)', () => {
    const ref = { current: document.createElement('div') }
    const { result } = renderHook(() => useVisible(ref))
    act(() => { observerCallback([{ isIntersecting: true }]) })
    act(() => { observerCallback([{ isIntersecting: false }]) })
    expect(result.current).toBe(true)
  })

  it('disconnects observer once visible', () => {
    const ref = { current: document.createElement('div') }
    renderHook(() => useVisible(ref))
    act(() => { observerCallback([{ isIntersecting: true }]) })
    expect(mockObserver.disconnect).toHaveBeenCalled()
  })
})
