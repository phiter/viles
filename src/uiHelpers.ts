export const getCenteredScrollTop = (
  top: number,
  itemHeight: number,
  viewportHeight: number,
  currentScrollY: number,
  scrollHeight: number,
  clientHeight: number,
) => {
  const desiredScrollTop = currentScrollY + top - Math.max((viewportHeight - itemHeight) / 2, 0)
  const maxScrollTop = scrollHeight - clientHeight

  return Math.min(Math.max(desiredScrollTop, 0), maxScrollTop)
}

export const scrollElementToViewportCenter = (element: HTMLElement) => {
  const elementRect = element.getBoundingClientRect()
  const centeredScrollTop = getCenteredScrollTop(
    elementRect.top,
    elementRect.height,
    globalThis.innerHeight,
    globalThis.scrollY,
    document.documentElement.scrollHeight,
    document.documentElement.clientHeight,
  )

  const scrollDelta = Math.abs(centeredScrollTop - globalThis.scrollY)
  if (scrollDelta < 24) {
    return
  }

  globalThis.scrollTo({ top: centeredScrollTop, behavior: 'smooth' })
}

export const scrollToTop = () => {
  globalThis.scrollTo({ top: 0, behavior: 'smooth' })
}

export const preloadImageUrls = (urls: string[]) => {
  const preloadedImages = urls.map((url) => {
    const image = new Image()
    image.decoding = 'async'
    image.src = url
    return image
  })

  return () => {
    preloadedImages.forEach((image) => {
      image.src = ''
    })
  }
}
