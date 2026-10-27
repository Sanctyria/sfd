<script lang="ts">
	import { onMount } from 'svelte';

	let { color }: { color: string } = $props();
	let activeColor = $derived(color);

	onMount(() => {
		const canvas = document.createElement('canvas');
		canvas.className = 'pointer-events-none fixed inset-0 h-full w-full';
		canvas.style.zIndex = '9999';
		canvas.style.mixBlendMode = 'screen';
		document.body.appendChild(canvas);
		const context = canvas.getContext('2d');
		if (!context) return;
		let frame = 0;
		let mouseX = 0;
		let mouseY = 0;
		let mousePresent = false;
		type Particle = {
			x: number;
			y: number;
			vx: number;
			vy: number;
			size: number;
			life: number;
			maxLife: number;
			color: string;
		};
		let particles: Particle[] = [];
		const resize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};
		const onMove = (event: MouseEvent) => {
			mouseX = event.clientX;
			mouseY = event.clientY;
			mousePresent = true;
		};
		const onLeave = () => {
			mousePresent = false;
		};
		const onClick = (event: MouseEvent) => {
			for (let index = 0; index < 15; index += 1) {
				const angle = Math.random() * Math.PI * 2;
				const speed = Math.random() * 4 + 1.2;
				particles.push({
					x: event.clientX,
					y: event.clientY,
					vx: Math.cos(angle) * speed,
					vy: Math.sin(angle) * speed - 0.2,
					size: Math.random() * 3 + 1,
					life: 15 + Math.random() * 30,
					maxLife: 15 + Math.random() * 30,
					color: activeColor
				});
			}
		};
		const animate = () => {
			context.clearRect(0, 0, canvas.width, canvas.height);
			if (mousePresent && mouseX && mouseY) {
				for (let index = 0; index < 2; index += 1) {
					if (Math.random() > 0.35)
						particles.push({
							x: mouseX,
							y: mouseY,
							vx: (Math.random() - 0.5) * 1.3,
							vy: -Math.random() * 1.4 - 0.4,
							size: Math.random() * 2.6 + 0.6,
							life: 12 + Math.random() * 25,
							maxLife: 12 + Math.random() * 25,
							color: activeColor
						});
				}
			}
			particles = particles.filter((particle) => {
				particle.x += particle.vx;
				particle.y += particle.vy;
				particle.vy -= 0.008;
				particle.life -= 1;
				context.save();
				context.beginPath();
				context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
				context.fillStyle = particle.color;
				context.shadowBlur = 6;
				context.shadowColor = particle.color;
				context.globalAlpha = particle.life / particle.maxLife;
				context.fill();
				context.restore();
				return particle.life > 0;
			});
			if (particles.length > 200) particles = particles.slice(-200);
			frame = requestAnimationFrame(animate);
		};
		resize();
		window.addEventListener('resize', resize);
		window.addEventListener('mousemove', onMove);
		document.addEventListener('mouseleave', onLeave);
		window.addEventListener('click', onClick);
		animate();
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener('resize', resize);
			window.removeEventListener('mousemove', onMove);
			document.removeEventListener('mouseleave', onLeave);
			window.removeEventListener('click', onClick);
			canvas.remove();
		};
	});
</script>
