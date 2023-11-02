import { Power3, gsap } from 'gsap'
import { Swiper } from 'swiper'

import { container } from '../container'
import { type ImageJSON } from '../resources'
import { setIndex, state } from '../state'
import { Watchable, expand } from '../utils'

import { imgs, mounted } from './collection'
import { scrollable } from './scroll'

/**
 * variables
 */

let swiperNode: HTMLDivElement
let gallery: HTMLDivElement
let curtain: HTMLDivElement
let swiper: Swiper
const isAnimating = new Watchable<boolean>(false)
let lastIndex = -1
let indexDispNums: HTMLSpanElement[] = []
let galleryImages: HTMLImageElement[] = []

/**
 * main functions
 */

export function slideUp(): void {
  if (isAnimating.get()) return
  isAnimating.set(true)

  // load active image
  loadImages()

  gsap.to(curtain, {
    opacity: 1,
    duration: 1
  })

  gsap.to(gallery, {
    y: 0,
    ease: Power3.easeInOut,
    duration: 1,
    delay: 0.4
  })

  setTimeout(() => {
    scrollable.set(false)
    isAnimating.set(false)
  }, 1200)
}

function slideDown(): void {
  scrollable.set(true)
  scrollToActive()

  gsap.to(gallery, {
    y: '100%',
    ease: Power3.easeInOut,
    duration: 1
  })

  gsap.to(curtain, {
    opacity: 0,
    duration: 1.2,
    delay: 0.4
  })
}

/**
 * init
 */

export function initGallery(ijs: ImageJSON[]): void {
  // create gallery
  createGallery(ijs)
  // get elements
  indexDispNums = Array.from(
    document.getElementsByClassName('nav').item(0)?.getElementsByClassName('num') ?? []
  ) as HTMLSpanElement[]
  swiperNode = document.getElementsByClassName('galleryInner').item(0) as HTMLDivElement
  gallery = document.getElementsByClassName('gallery').item(0) as HTMLDivElement
  curtain = document.getElementsByClassName('curtain').item(0) as HTMLDivElement
  galleryImages = Array.from(gallery.getElementsByTagName('img'))
  // state watcher
  state.addWatcher(() => {
    const s = state.get()
    // change slide only when index is changed
    if (s.index === lastIndex) return
    changeSlide(s.index)
    updateIndexText()
    lastIndex = s.index
  })
  // mounted watcher
  mounted.addWatcher(() => {
    if (!mounted.get()) return
    scrollable.set(true)
    swiper = new Swiper(swiperNode, { spaceBetween: 20 })
    swiper.on('slideChange', ({ realIndex }) => {
      setIndex(realIndex)
    })
  })
  // mounted
  mounted.set(true)
  // dynamic load
  window.addEventListener('touchstart', () => {})
}

/**
 * helper
 */

function changeSlide(slide: number): void {
  loadImages()
  swiper.slideTo(slide, 0)
}

function scrollToActive(): void {
  imgs[state.get().index].scrollIntoView({
    block: 'center',
    behavior: 'auto'
  })
}

function updateIndexText(): void {
  const indexValue: string = expand(state.get().index + 1)
  const indexLength: string = expand(state.get().length)
  indexDispNums.forEach((e: HTMLSpanElement, i: number) => {
    if (i < 4) {
      e.innerText = indexValue[i]
    } else {
      e.innerText = indexLength[i - 4]
    }
  })
}

function createGallery(ijs: ImageJSON[]): void {
  /**
   * gallery
   * |- galleryInner
   *    |- swiper-wrapper
   *       |- swiper-slide
   *          |- img
   *       |- swiper-slide
   *          |- img
   *       |- ...
   * |- nav
   *    |- index
   *    |- close
   */
  // swiper wrapper
  const _swiperWrapper = document.createElement('div')
  _swiperWrapper.className = 'swiper-wrapper'
  // swiper slide
  for (const ij of ijs) {
    const _swiperSlide = document.createElement('div')
    _swiperSlide.className = 'swiper-slide'
    // img
    const e = document.createElement('img')
    e.dataset.src = ij.hiUrl
    e.height = ij.hiImgH
    e.width = ij.hiImgW
    e.alt = 'image'
    // append
    _swiperSlide.append(e)
    _swiperWrapper.append(_swiperSlide)
  }
  // swiper node
  const _swiperNode = document.createElement('div')
  _swiperNode.className = 'galleryInner'
  _swiperNode.append(_swiperWrapper)
  // index
  const _index = document.createElement('div')
  _index.insertAdjacentHTML(
    'afterbegin',
    `<span class="num"></span><span class="num"></span><span class="num"></span><span class="num"></span>
    <span>/</span>
    <span class="num"></span><span class="num"></span><span class="num"></span><span class="num"></span>`
  )
  // close
  const _close = document.createElement('div')
  _close.innerText = 'Close'
  _close.addEventListener(
    'click',
    () => {
      slideDown()
    },
    { passive: true }
  )
  _close.addEventListener(
    'keydown',
    () => {
      slideDown()
    },
    { passive: true }
  )
  // nav
  const _navDiv = document.createElement('div')
  _navDiv.className = 'nav'
  _navDiv.append(_index, _close)
  // gallery
  const _gallery = document.createElement('div')
  _gallery.className = 'gallery'
  _gallery.append(_swiperNode)
  _gallery.append(_navDiv)

  /**
   * curtain
   */
  const _curtain = document.createElement('div')
  _curtain.className = 'curtain'

  /**
   * container
   * |- gallery
   * |- curtain
   */
  container.append(_gallery, _curtain)
}

/**
 * helper
 */

function loadImages(): void {
  const activeImages = []
  // load current, next, prev image
  activeImages.push(galleryImages[swiper.activeIndex])
  activeImages.push(
    galleryImages[Math.min(swiper.activeIndex + 1, swiper.slides.length)]
  )
  activeImages.push(galleryImages[Math.max(swiper.activeIndex - 1, 0)])
  for (const e of activeImages) {
    e.src = e.dataset.src as string
  }
}
