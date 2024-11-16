import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import gsap from 'gsap';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// ======= 0. Setup =======
let loadedFont = null;
let digitalText1, digitalText2;


const fontLoader = new FontLoader();
fontLoader.load(
  'fonts/helvetiker_regular.typeface.json',
  function (font) {
    loadedFont = font;

  },
  undefined,
  function (err) {
    console.error('An error occurred loading the font:', err);
  }
);

// Load 3D Models
const modelLoader = new GLTFLoader();


// ======= 1. Initialize Scene, Camera, and Renderer =======

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Black background

const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000
);

function add3DText(text, position, callback) {

  if (loadedFont) {

      // Create Text Geometry
      const textGeometry = new TextGeometry(text, {
        font: loadedFont,
        size: 1,
        depth: 0.2,
        curveSegments: 12,
        bevelEnabled: false,
    });

      

    // Create Text Material and Mesh
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);

    // Position Text
    textMesh.position.copy(position);
    scene.add(textMesh);

    // Call the callback with the textMesh
    if (callback) {
      callback(textMesh);
    }
  }
    else {
      // Font not loaded yet, try again in 1 second
      console.error('Font not loaded yet.');
  }
}




// Create WebGLRenderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  antialias: true,
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.zIndex = '0';
document.body.appendChild(renderer.domElement);


renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(5); // Set initial camera position

// Create CSS3DRenderer
const cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0';
cssRenderer.domElement.style.left = '0';
cssRenderer.domElement.style.zIndex = '1'; // Ensure it overlays the WebGL canvas
cssRenderer.domElement.style.pointerEvents = 'none'; // Allow clicks to pass through
document.body.appendChild(cssRenderer.domElement);


// ======= 2. Load Background =======

function createBackground(colorTop, colorBottom) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 1024;
  canvas.height = 1024;

  // Create Gradient
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, colorTop); // Light Sky Blue (reality)
  gradient.addColorStop(1, colorBottom); // Dark Blue (digital world)

  // Fill Background with Gradient
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Create Texture
  const backgroundTexture = new THREE.CanvasTexture(canvas);
  scene.background = backgroundTexture;

}

createBackground('#87CEEB', '#001a33');

// ======= 3. Initialize Lights =======

function createLights() {
  // Ambient Light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // Directional Light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);
}

createLights();

// ======= 4. Create Character and Phone =======

const character = createCharacter();
scene.add(character);


function createCharacter() {
  const characterGroup = new THREE.Group();
  characterGroup.name = 'Jarvis';

  modelLoader.load(
    'models/00346_Mansur006.glb',
    function (gltf) {
      const model = gltf.scene;
      model.position.set(0, -1, 0);
      model.scale.set(1,1,1);
      model.name = 'Jarvis';

      characterGroup.add(model);
    },
    undefined,
    function (error) {
      console.error('An error occurred loading the character:', error);
    }
  );
  
  return characterGroup;
}



// ======= 5. Initialize Raycaster =======

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let currentWorld = 'reality'; // reality or digital

function onMouseClick(event) {
  // Normalize Mouse Coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update Raycaster
  raycaster.setFromCamera(mouse, camera);

  // Calculate Intersects
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    let clickedObject = intersects[0].object;

    while (clickedObject) {
      if (clickedObject.name === 'Jarvis') {
        if (currentWorld === 'reality') {
          transitionToDigitalWorld();
        } else {
          transitionToReality();
        }
        break;
      }
    clickedObject = clickedObject.parent;
      
    }
  } 
}

window.addEventListener('click', onMouseClick);

// ======= 6. Transition Functions =======

function transitionToDigitalWorld() {
  distortReality();

  // Animate camera zoom into the phone
  gsap.to(camera.position, {
    z: 10,
    duration: 2,
    ease: 'power2.inOut',
    onComplete: () => {
      switchToDigitalWorld();
    }
  });
}

function switchToDigitalWorld() {
  currentWorld = 'digital'; // Update current world state

  // Change Background Color
  createBackground('#000000', '#0f0f0f');

  // Change Character Material
  character.traverse((child) => {
    if (child.isMesh) {
      child.material.color = new THREE.Color(0x00ff00); // Green
    }
  });

  // Add Particle Effects
  addParticleEffects();

  // Display Messages and store references
  add3DText("Disconnected from Reality", new THREE.Vector3(-8, 3, 2), function(mesh) {
    digitalText1 = mesh;
  }
  );
  add3DText("Balance your media use!", new THREE.Vector3(-7, -3, 2), function(mesh) {
    digitalText2 = mesh;
  }
  );


}

function distortReality() {
  gsap.to(camera, {
    fov: 100,
    duration: 2,
    ease: "power2.inOut",
    onUpdate: () => {
      camera.updateProjectionMatrix();
    }
  });
}

function transitionToReality() {
  backToReality();

  // Animate camera zoom out from the phone
  gsap.to(camera.position, {
    z: 10,
    duration: 2,
    ease: 'power2.inOut',
    onComplete: () => {
      switchToReality();
    }
  });
}

function switchToReality() {

  currentWorld = 'reality'; // Update current world state

  // Restore Background
  createBackground('#87CEEB', '#001a33');

  // Restore Character Material
  character.traverse((child) => {
    if (child.isMesh) {
      child.material.color = new THREE.Color(0xFFDAB9); // PeachPuff
    }
  });

  // Remove Particle Effects
  const particles = scene.getObjectByName('particles');
  if (particles) {
    scene.remove(particles);
  }

  // Remove Digital World Text
  if (digitalText1) scene.remove(digitalText1);
  if (digitalText2) scene.remove(digitalText2);

  add3DText("Welcome back to Reality", new THREE.Vector3(-8, 3, 0));
  add3DText("Enjoy the real world!", new THREE.Vector3(-6, -3, 0));

}

function backToReality() {
  // Animate camera zoom out from the phone
  gsap.to(camera, {
    fov: 75,
    duration: 2,
    ease: 'power2.inOut',
    onUpdate: () => {
      camera.updateProjectionMatrix();
    }
  });
}


// ======= 7. Particle Effects =======

function addParticleEffects() {
  const particleCount = 500;
  const particlesGeometry = new THREE.BufferGeometry();
  const positions = [];

  for (let i = 0; i < particleCount; i++) {
    positions.push(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20
    );
  }

  particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  const particlesMaterial = new THREE.PointsMaterial({
    color: 0x00ff00,
    size: 0.1,
    transparent: true,
    opacity: 0.7
  });

  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  particles.name = 'particles';
  scene.add(particles);

  // Animate Particles
  gsap.to(particles.rotation, {
    y: Math.PI * 2,
    duration: 20,
    repeat: -1,
    ease: "linear"
  });
}

// ======= 8. Text Overlays =======


// ======= 9. Create Clock =======

const clock = createClock();
scene.add(clock);

function createClock() {
  const clockGroup = new THREE.Group();

  const clockGeometry = new THREE.CircleGeometry(1, 32);
  const clockMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const clockFace = new THREE.Mesh(clockGeometry, clockMaterial);
  clockFace.position.set(-3, 2, 0);
  clockGroup.add(clockFace);

  // Hour Hand
  const hourHandGeometry = new THREE.BoxGeometry(0.05, 0.7, 0.05);
  const hourHandMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const hourHand = new THREE.Mesh(hourHandGeometry, hourHandMaterial);
  hourHand.position.set(0,0,0);
  clockFace.add(hourHand);

  // Minute Hand
  const minuteHandGeometry = new THREE.BoxGeometry(0.05, 1, 0.05);
  const minuteHand = new THREE.Mesh(minuteHandGeometry, hourHandMaterial);
  minuteHand.position.set(0,0,0);
  clockFace.add(minuteHand);

  clockGroup.userData = { hourHand, minuteHand };
  return clockGroup;
}

function animateClock() {
  const { hourHand, minuteHand } = clock.userData;
  hourHand.rotation.z -= 0.001;
  minuteHand.rotation.z -= 0.01;
}

// ======= 10. Initialize Controls =======

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI / 2;
controls.minDistance = 2;
controls.maxDistance = 10;

// ======= 11. Animation Loop =======

function animate() {
  requestAnimationFrame(animate);

  // Update Controls
  controls.update();

  // Rotate Character only in digital world
  if (currentWorld === 'digital' && character)
  {
    character.rotation.y += 0.005;
  }

  // Animate Clock
  animateClock();

  // Render Scene
  renderer.render(scene, camera);
  cssRenderer.render(scene, camera);
}

animate();

// ======= 12. Handle Window Resize =======

window.addEventListener('resize', onWindowResize);

function onWindowResize() {
    // Update Camera Aspect Ratio
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();


  // Update Renderer Size
  renderer.setSize(window.innerWidth, window.innerHeight);
  cssRenderer.setSize(window.innerWidth, window.innerHeight);
}

