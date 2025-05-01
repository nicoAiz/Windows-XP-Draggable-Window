// Test window
const wins = [
	createWindow('Test JS Window', '🤓', `
		<h1>Another window</h1>
		<p>This window was created with JavaScript.</p>
		<br>
		<button>Windows XP Button</button>
		<br>
		<button disabled>Windows XP Button</button>
	`, innerWidth / 2, innerHeight / 2 + 100, 600, 300),
]

wins.forEach(win => document.body.append(win.element))