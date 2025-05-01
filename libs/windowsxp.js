const body = wrapElem(document.body)

function $(selectors, target = document) {
	return wrapElem(target.querySelector(selectors))
}

function $$(selectors, target = document) {
	return [...target.querySelectorAll(selectors)].map(wrapElem)
}

function $$each(selectors, callback, target = document) {
	$$(selectors, target).forEach(callback)
}

function wrapElem(elem) {
	if (!(elem instanceof HTMLElement)) return elem

	if (!elem.wrapped) {
		elem.$ = (selectors) => $(selectors, elem)
		elem.$$ = (selectors) => $$(selectors, elem)
		elem.$$each = (selectors) => $$each(selectors, elem)
		elem.on = (event, callback) => elem.addEventListener(event, callback)
	}
	
	return elem
}

function dom(tagName, parent) {
	const elem = document.createElement(tagName)
	if (parent instanceof HTMLElement) parent.append(elem)
  	return wrapElem(elem);
}

function clamp(value, min, max) {
	return Math.max(Math.min(value, max), min)
}

function randInt(max) {
	return Math.floor(Math.random() * max)
}

function getMousePosition(e) {
	return {
		mx: e.pageX,
		my: e.pageY
	}
}

function getWindowPosition(win) {
	const rect = win.getBoundingClientRect()

	return {
		wx: rect.left,
		wy: rect.top
	}
}

function getWindowSize(win) {
	const rect = win.getBoundingClientRect()

	return {
		ww: rect.width,
		wh: rect.height
	}
}

function setWindow(win, wx, wy, ww, wh) {
	win.style.left = wx + 'px'
	win.style.top = wy + 'px'
	win.style.width = ww + 'px'
	win.style.height = wh + 'px'
}

function initWindow(win) {
	const wHead = win.$('.head')
	const wBody = win.$('.body')

	const bMinimize = win.$('button.minimize')
	const bSize = win.$('button.size')
	const bClose = win.$('button.close')
	const movable = win.dataset.movable

	if (bMinimize) {
		bMinimize.on('click', () => {
			// Already minimized
			if (wBody.style.display === 'none') {
				minimized = false
				wBody.style.display = 'block'
				setWindow(win, wx, wy, ww, wh)
			} else
			// Visible
			{
				minimized = true
				wBody.style.display = 'none'
				win.style.height = 'fit-content'
			}
		})
	}
	
	if (bSize) {
		bSize.on('click', () => {
			win.classList.remove('maximized')

			if (minimized) return

			// Already maximized
			if (ww === innerWidth && wh === innerHeight) {
				setSize(win._prevW, win._prevH)
				setPosition(win._prevX, win._prevY)
			} else
			// Maximize window
			{
				win._prevX = wx
				win._prevY = wy
				win._prevW = ww
				win._prevH = wh

				setSize(innerWidth, innerHeight)
				setPosition(0, 0)
				win.classList.add('maximized')
			}
		})
	}
	
	if (bClose) {
		bClose.on('click', () => win.remove())
	}
	
	let minimized = false
	let resizeMode = null
	let resizing = false
	let dragging = false
	let pmx = 0
	let pmy = 0
	
	let { wx, wy } = getWindowPosition(win)
	let { ww, wh } = getWindowSize(win)
	ww = clamp(ww, 200, 2000)
	wh = clamp(wh, 200, 2000)
	setWindow(win, wx, wy, ww, wh)

	setInterval(() => {
		constrain()

		if (!minimized) {
			setWindow(win, wx, wy, ww, wh)
		}
	}, 1000 + randInt(1000))

	function setPosition(x, y) {
		wx = x
		wy = y
		constrain()
		setWindow(win, wx, wy, ww, wh)
	}

	function setSize(w, h) {
		if (minimized) {
			win.style.height = 'fit-content'
			return
		}

		ww = w
		wh = h
		constrain()
		setWindow(win, wx, wy, ww, wh)

		win.classList.add('resizing')
		setTimeout(() => win.classList.remove('resizing'), 100)
	}

	function constrain() {
		if (!movable) return
		wx = clamp(wx, 0, innerWidth - ww)
		wy = clamp(wy, 0, innerHeight - wh)
	}
	
	wHead.on('pointerdown', e => {
		if (e.target.tagName === 'BUTTON') return
	
		pmx = e.pageX
		pmy = e.pageY
		dragging = movable && true

		win.classList.add('dragging')
	})

	wHead.on('dblclick', () => bSize.click())
	
	body.on('pointermove', e => {
		if (!'movable' in win.dataset) dragging = false

		if (!'resizable' in win.dataset) {
			resizing = false
			resizeMode = null
		}

		if (!dragging && !resizing) return
	
		const { mx, my } = getMousePosition(e)
		const dx = mx - pmx
		const dy = my - pmy
	
		// Dragging
		if (dragging) {
			wx += dx
			wy += dy
		} else
		// D Resize
		if (resizeMode === 'D') {
			ww = mx - wx
			wh = my - wy
			body.style.cursor = 'se-resize'
		} else
		// H Resize
		if (resizeMode === 'H') {
			ww = mx - wx
			body.style.cursor = 'e-resize'
		} else
		// V Resize
		if (resizeMode === 'V') {
			wh = my - wy
			body.style.cursor = 's-resize'
		}
		
		ww = clamp(ww, 200, 2000)
		wh = clamp(wh, 200, 2000)
		pmx = mx
		pmy = my
	
		constrain()
		setWindow(win, wx, wy, ww, wh)
		if (minimized) win.style.height = 'fit-content'
	})
	
	body.on('pointerup', () => {
		dragging = false
		resizing = null
		resizeMode = null
		body.style.cursor = 'default'

		win.classList.remove('dragging')
	})
	
	win.on('pointermove', e => {
		if (!'resizable' in win.dataset) return

		if (dragging || resizing) return

		const { mx, my } = getMousePosition(e)
		const dx = ww - Math.abs(wx - mx)
		const dy = wh - Math.abs(wy - my)
	
		win.style.cursor = 'default'
		resizeMode = null

		// D resize
		if (dx < 10 && dy < 10) {
			win.style.cursor = 'se-resize'
			resizeMode = 'D'
		} else
		// H resize
		if (dx < 10) {
			win.style.cursor = 'e-resize'
			resizeMode = 'H'
		} else
		// V resize
		if (dy < 10) {
			win.style.cursor = 's-resize'
			resizeMode = 'V'
		}
	})
	
	win.on('pointerdown', e => {
		if (resizeMode) {
			const { mx, my } = getMousePosition(e)
	
			resizing = true
			pmx = mx
			pmy = my
			win.classList.remove('maximized')
		}

		const wins = $$('.window')
		wins.splice(wins.indexOf(win), 1)
		wins.push(win)
		wins.forEach((win, i) => win.style.zIndex = i)
	})

	return {
		element: win,
		constrain,
		setPosition,
		setSize,
		close() {
			win.remove()
		}
	}
}

/**
 * Creates a draggable window in Windows XP style.
 * @param { string } title - Window title
 * @param { string } icon - Not well implemented. Will render the text if it's length is < 5; otherwise, render an image using the `icon` as src. CSS styling is at the end of windowsxp.css
 * @param { HTMLElement, HTMLElement[], string } body - Element, list of elements or the innerHTML string of the body
 * @param { number } x - X position of the window
 * @param { number } y - Y position of the window
 * @param { number } w - Width of the window
 * @param { number } h - Height of the window
 * @returns 
 */
function createWindow(title, icon, body, x, y, w, h, {
	disableMinimize = true,
	disableSize = true,
	disableClose = true,
	resizable = true,
	movable = true,
	startCentered = true
} = {}) {
	const div = dom('div')
	div.className = 'window'

	if (resizable) div.dataset.resizable = 'true'
	if (movable !== 'false') div.dataset.movable = 'true'

	div.innerHTML = `
		<div class="head">
			<div class="info">
				<span class="icon">
					${icon.length < 5 ? icon : `<img src="${icon}">`}
				</span>
				<p class="title">${title}</p>
			</div>

			<div class="actions">
				${disableMinimize ? '<button class="action-btn minimize">_</button>' : ''}
				${disableSize ? '<button class="action-btn size">⬒</button>' : ''}
				${disableClose ? '<button class="action-btn close">✕</button>' : ''}
			</div>
		</div>

		<div class="body"></div>`
	
	if (body instanceof HTMLElement) {
		div.$('.body').append(body)
	} else if (Array.isArray(body)) {
		div.$('.body').append(...body)
	} else {
		div.$('.body').innerHTML = body
	}

	const win = initWindow(div)
	win.setSize(w, h)

	if (startCentered) {
		x -= w / 2
		y -= h / 2
	}

	win.setPosition(x, y)
	win.constrain()

	return win
}

$$each('.window', winDataElem => {
	const { disableminimize, disablesize, disableclose, startcentered, resizable, movable, title, icon, x, y, w, h } = winDataElem.dataset

	const win = createWindow(title ?? '', icon ?? '', [...winDataElem.children], Number(x) || innerWidth / 2, Number(y) || innerHeight / 2, Number(w) || 200, Number(h) || 200, {
		disableClose: disableclose,
		disableMinimize: disableminimize,
		disableSize: disablesize,
		movable: movable,
		resizable: resizable,
		startCentered: startcentered ?? true
	})

	if (winDataElem.classList.contains('no-shadow')) {
		win.element.classList.add('no-shadow')
	}

	winDataElem.classList.remove('window')
	document.body.append(win.element)
})