/**
 * CircularGallery Component - RRM Slot Machine Version
 * - Auto-scrolls continuously on idle (left→right drift)
 * - Spins fast with laps when GO is pressed
 * - NO user interaction (no drag, no wheel, pure animation)
 */

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl';
import './CircularGallery.css';

function lerp(p1: number, p2: number, t: number): number {
  return p1 + (p2 - p1) * t;
}

function createTextTexture(
  gl: any,
  text: string,
  font: string = 'bold 30px monospace',
  color: string = 'black'
): { texture: any; width: number; height: number } {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  context.font = font;
  const metrics = context.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = Math.ceil(parseInt(font, 10) * 1.2);
  canvas.width = textWidth + 20;
  canvas.height = textHeight + 20;
  context.font = font;
  context.fillStyle = color;
  context.textBaseline = 'middle';
  context.textAlign = 'center';
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas;
  return { texture, width: canvas.width, height: canvas.height };
}

class Title {
  gl: any;
  plane: any;
  text: string;
  textColor: string;
  font: string;
  mesh: any;

  constructor({ gl, plane, text, textColor = '#545050', font = '30px sans-serif' }: any) {
    this.gl = gl;
    this.plane = plane;
    this.text = text;
    this.textColor = textColor;
    this.font = font;
    this.createMesh();
  }

  createMesh() {
    const { texture, width, height } = createTextTexture(this.gl, this.text, this.font, this.textColor);
    const geometry = new Plane(this.gl);
    const program = new Program(this.gl, {
      vertex: `
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform sampler2D tMap;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(tMap, vUv);
          if (color.a < 0.1) discard;
          gl_FragColor = color;
        }
      `,
      uniforms: { tMap: { value: texture } },
      transparent: true,
    });
    this.mesh = new Mesh(this.gl, { geometry, program });
    const aspect = width / height;
    const textHeight = this.plane.scale.y * 0.15;
    const textWidth = textHeight * aspect;
    this.mesh.scale.set(textWidth, textHeight, 1);
    this.mesh.position.y = -this.plane.scale.y * 0.5 - textHeight * 0.5 - 0.05;
    this.mesh.setParent(this.plane);
  }
}

class Media {
  extra: number = 0;
  geometry: any;
  gl: any;
  image: string;
  index: number;
  length: number;
  scene: any;
  screen: any;
  text: string;
  viewport: any;
  bend: number;
  textColor: string;
  borderRadius: number;
  font: string;
  program: any;
  plane: any;
  title: any;
  scale: number = 1;
  padding: number = 0;
  width: number = 0;
  widthTotal: number = 0;
  x: number = 0;
  speed: number = 0;
  isBefore: boolean = false;
  isAfter: boolean = false;

  constructor({ geometry, gl, image, index, length, scene, screen, text, viewport, bend, textColor, borderRadius = 0, font }: any) {
    this.geometry = geometry;
    this.gl = gl;
    this.image = image;
    this.index = index;
    this.length = length;
    this.scene = scene;
    this.screen = screen;
    this.text = text;
    this.viewport = viewport;
    this.bend = bend;
    this.textColor = textColor;
    this.borderRadius = borderRadius;
    this.font = font;
    this.createShader();
    this.createMesh();
    this.createTitle();
    this.onResize();
  }

  createShader() {
    const texture = new Texture(this.gl, { generateMipmaps: true });
    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSpeed;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.1 + uSpeed * 0.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        varying vec2 vUv;

        float roundedBoxSDF(vec2 p, vec2 b, float r) {
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
        }

        void main() {
          // object-fit: contain behavior - show full image without cropping
          float planeAspect = uPlaneSizes.x / uPlaneSizes.y;
          float imageAspect = uImageSizes.x / uImageSizes.y;

          vec2 ratio;
          if (imageAspect > planeAspect) {
            // Image is wider than plane
            ratio = vec2(1.0, planeAspect / imageAspect);
          } else {
            // Image is taller than plane
            ratio = vec2(imageAspect / planeAspect, 1.0);
          }

          vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
          );

          vec4 color = texture2D(tMap, uv);

          // Add background color for letterboxing areas
          if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
            color = vec4(0.1, 0.1, 0.1, 1.0); // Dark gray background
          }

          float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
          float edgeSmooth = 0.002;
          float alpha = 1.0 - smoothstep(-edgeSmooth, edgeSmooth, d);
          gl_FragColor = vec4(color.rgb, alpha);
        }
      `,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [0, 0] },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: this.borderRadius },
      },
      transparent: true,
    });

    const img = new Image();
    // Don't set crossOrigin for local files - causes issues with some browsers
    // img.crossOrigin = 'anonymous';
    img.src = this.image;
    console.log('📸 Loading image:', this.image);

    img.onload = () => {
      console.log('✅ Image loaded successfully:', this.image, `${img.naturalWidth}x${img.naturalHeight}`);
      texture.image = img;
      this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight];
    };

    img.onerror = (e) => {
      console.error('❌ FAILED TO LOAD IMAGE:', this.image);
      console.error('❌ Error details:', e);
      // Try to load without encoding to debug
      const unencoded = this.image.replace(/%20/g, ' ').replace(/%2B/g, '+');
      console.error('❌ Attempted URL (encoded):', this.image);
      console.error('❌ Decoded would be:', unencoded);
    };
  }

  createMesh() {
    this.plane = new Mesh(this.gl, { geometry: this.geometry, program: this.program });
    this.plane.setParent(this.scene);
  }

  createTitle() {
    this.title = new Title({
      gl: this.gl,
      plane: this.plane,
      text: this.text,
      textColor: this.textColor,
      font: this.font,
    });
  }

  update(scroll: any, direction: string) {
    this.plane.position.x = this.x - scroll.current - this.extra;
    const x = this.plane.position.x;
    const H = this.viewport.width / 2;

    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      const B_abs = Math.abs(this.bend);
      const R = (H * H + B_abs * B_abs) / (2 * B_abs);
      const effectiveX = Math.min(Math.abs(x), H);
      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
      if (this.bend > 0) {
        this.plane.position.y = -arc;
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
      } else {
        this.plane.position.y = arc;
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
      }
    }

    this.speed = scroll.current - scroll.last;
    this.program.uniforms.uTime.value += 0.04;
    this.program.uniforms.uSpeed.value = this.speed;

    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    this.isAfter = this.plane.position.x - planeOffset > viewportOffset;
    if (direction === 'right' && this.isBefore) {
      this.extra -= this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
    if (direction === 'left' && this.isAfter) {
      this.extra += this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
  }

  onResize({ screen, viewport }: any = {}) {
    if (screen) this.screen = screen;
    if (viewport) this.viewport = viewport;
    this.scale = this.screen.height / 1500;

    // Square format for cover art (800x800)
    const cardSize = 800 * this.scale;
    this.plane.scale.y = (this.viewport.height * cardSize) / this.screen.height;
    this.plane.scale.x = (this.viewport.width * cardSize) / this.screen.width;

    this.plane.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];
    this.padding = 2;
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}

class App {
  container: HTMLElement;
  renderer: any;
  gl: any;
  camera: any;
  scene: any;
  screen: any;
  viewport: any;
  planeGeometry: any;
  mediasImages: any[];
  medias: Media[] = [];
  scroll: any;
  raf: number | null = null;
  boundOnResize: any;
  isSpinning: boolean = false;
  isFrozen: boolean = false; // Stop all animation (after win)
  autoScrollSpeed: number = 0.15; // Slow drift speed (50% slower)
  frameCount: number = 0; // For debug logging

  constructor(container: HTMLElement, { items, bend, textColor = '#ffffff', borderRadius = 0, font = 'bold 30px Figtree' }: any = {}) {
    this.container = container;
    this.scroll = { ease: 0.08, current: 0, target: 0, last: 0 };
    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createMedias(items, bend, textColor, borderRadius, font);
    this.update();
    this.addEventListeners();
  }

  createRenderer() {
    this.renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 2) });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    this.container.appendChild(this.gl.canvas);
  }

  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
  }

  createScene() {
    this.scene = new Transform();
  }

  createGeometry() {
    this.planeGeometry = new Plane(this.gl, { heightSegments: 50, widthSegments: 100 });
  }

  createMedias(items: any, bend: number, textColor: string, borderRadius: number, font: string) {
    const defaultItems = [
      { image: 'https://picsum.photos/seed/1/800/600?grayscale', text: 'Bridge' },
      { image: 'https://picsum.photos/seed/2/800/600?grayscale', text: 'Desk Setup' },
    ];
    const galleryItems = items && items.length ? items : defaultItems;
    this.mediasImages = galleryItems.concat(galleryItems);
    this.medias = this.mediasImages.map(
      (data, index) =>
        new Media({
          geometry: this.planeGeometry,
          gl: this.gl,
          image: data.image,
          index,
          length: this.mediasImages.length,
          scene: this.scene,
          screen: this.screen,
          text: data.text,
          viewport: this.viewport,
          bend,
          textColor,
          borderRadius,
          font,
        })
    );
  }

  onResize() {
    this.screen = { width: this.container.clientWidth, height: this.container.clientHeight };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({ aspect: this.screen.width / this.screen.height });
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };
    if (this.medias) {
      this.medias.forEach((media) => media.onResize({ screen: this.screen, viewport: this.viewport }));
    }
  }

  update = () => {
    // Debug log every 60 frames (roughly 1 second)
    if (this.frameCount % 60 === 0) {
      console.log(`🔄 Update loop: isFrozen=${this.isFrozen}, isSpinning=${this.isSpinning}`);
    }
    this.frameCount++;

    // Don't update anything if frozen (after win, before modal close)
    if (!this.isFrozen) {
      // Auto-scroll when not spinning
      if (!this.isSpinning) {
        this.scroll.target += this.autoScrollSpeed;
      }

      this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
    } else {
      // When frozen, keep target and current in sync (no drift)
      // This prevents accumulated drift during freeze
      this.scroll.target = this.scroll.current;
    }

    const direction = this.scroll.current > this.scroll.last ? 'right' : 'left';
    if (this.medias) {
      this.medias.forEach((media) => media.update(this.scroll, direction));
    }
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;
    this.raf = window.requestAnimationFrame(this.update);
  };

  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this);
    window.addEventListener('resize', this.boundOnResize);
  }

  destroy() {
    if (this.raf) window.cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.boundOnResize);
    if (this.renderer && this.renderer.gl && this.renderer.gl.canvas.parentNode) {
      this.renderer.gl.canvas.parentNode.removeChild(this.renderer.gl.canvas);
    }
  }
}

export interface CircularGalleryHandle {
  spinToIndex(index: number, duration: number, laps?: number): Promise<void>;
  freeze(): void;
  unfreeze(): void;
  getCenteredIndex(): number;
}

const CircularGallery = forwardRef<CircularGalleryHandle, any>(
  ({ items, bend = 3, textColor = '#ffffff', borderRadius = 0.05, font = 'bold 30px Figtree' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<any>(null);

    useEffect(() => {
      const app = new App(containerRef.current!, { items, bend, textColor, borderRadius, font });
      appRef.current = app;
      return () => app.destroy();
    }, [items, bend, textColor, borderRadius, font]);

    useImperativeHandle(
      ref,
      () => ({
        spinToIndex: async (targetIndex: number, duration: number, laps: number = 3) => {
        return new Promise((resolve) => {
          if (!appRef.current || !appRef.current.medias[0]) {
            resolve();
            return;
          }

          const app = appRef.current;
          app.isSpinning = true;

          const itemWidth = app.medias[0].width;
          const baseLength = items.length;

          // Add multiple full laps PLUS the target index
          const totalItems = (laps * baseLength) + targetIndex;
          const targetScroll = app.scroll.current + (totalItems * itemWidth);

          const startScroll = app.scroll.current;
          const startTime = Date.now();

          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-out-cubic for smooth deceleration
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            app.scroll.target = startScroll + (targetScroll - startScroll) * easeProgress;

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              app.scroll.target = targetScroll;
              app.isSpinning = false;
              resolve();
            }
          };

          animate();
        });
      },
      freeze: () => {
        if (appRef.current) {
          console.log('🧊 CircularGallery: FREEZE called, setting isFrozen=true');
          appRef.current.isFrozen = true;
          console.log('🧊 CircularGallery: isFrozen is now:', appRef.current.isFrozen);
        } else {
          console.warn('⚠️ CircularGallery: freeze() called but appRef is null');
        }
      },
      unfreeze: () => {
        if (appRef.current) {
          console.log('🔓 CircularGallery: UNFREEZE called, setting isFrozen=false');
          appRef.current.isFrozen = false;
          console.log('🔓 CircularGallery: isFrozen is now:', appRef.current.isFrozen);
        } else {
          console.warn('⚠️ CircularGallery: unfreeze() called but appRef is null');
        }
      },
      getCenteredIndex: () => {
        if (!appRef.current || !appRef.current.medias[0]) {
          return 0;
        }

        const app = appRef.current;
        const itemWidth = app.medias[0].width;
        const baseLength = items.length;

        // Calculate which item is at center (scroll position 0)
        // The current scroll position tells us how far we've moved
        const scrollPosition = app.scroll.current;

        // Divide by item width to get the index
        const rawIndex = Math.round(scrollPosition / itemWidth);

        // Modulo to get the index within the base set (not the duplicated set)
        const centeredIndex = rawIndex % baseLength;

        console.log(`📍 Centered index calculation: scrollPos=${scrollPosition.toFixed(2)}, itemWidth=${itemWidth.toFixed(2)}, rawIndex=${rawIndex}, centeredIndex=${centeredIndex}`);

        return centeredIndex;
      },
    }),
      []
    );

    return <div className="circular-gallery-rrm" ref={containerRef} />;
  }
);

CircularGallery.displayName = 'CircularGallery';

export default CircularGallery;
