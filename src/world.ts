import * as THREE from 'three';

import { Colours } from 'src/colours';
import { Shape, Sphere, Torus, Icosahedron, Cylinder, Box, Tetrahedron, Octahedron, Dodecahedron, LiveLoopShape, EffectShape } from 'src/shape';
import { Selector } from 'src/selector';
import { LiveLoopName, EffectName } from './generation/directory';
import createReticle from './reticle';
import VrEnvironment from './VrEnvironment';
import window from 'src/window';

export class World {

  /**
   * Each World will have a scene, camera, and renderer
   * (set up at construction time):
   * NOTE: These are private members.
   */
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private vrEnvironment: VrEnvironment;

  /**
   * Each World will also keep track of what shapes are currently in it.
   * NOTE: This is a  private member.
   */
  private shapes: Array<Shape> = [];

  /**
   * Lights associated with the world.
   * NOTE: We simply use three's implementations of lights as
   * we need not carry around any additional information (yet).
   */
  private lights: Array<THREE.Light> = [];

  private shapeSelector: Selector;

  constructor() {
    // Basic set up of scene, camera, and renderer:
    this.scene = new THREE.Scene();

    // NOTE: arguments to perspective camera are:
    // Field of view, aspect ratio, near and far clipping plane
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1, 1000,
    );
    this.camera.add(createReticle());
    this.scene.add(this.camera);

    // Set up VR environment:
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.vrEnvironment = new VrEnvironment(this.renderer, this.camera, this.scene);
    this.vrEnvironment.init();
    this.vrEnvironment.setSize(window.innerWidth, window.innerHeight);

    // Set up the Selector by passing it the scene and camera
    this.shapeSelector = new Selector(
      this.camera,
      this.scene,
      (mesh: THREE.Mesh) => { /* On mesh selection */
        // TEMPORARY - For demonstration purposes
        if ((mesh as THREE.Mesh).geometry instanceof THREE.BoxGeometry) {
          (mesh.material as THREE.MeshPhongMaterial).color.set(Colours.getBoxSelected());
        }
      }, (mesh: THREE.Mesh) => { /* On mesh deselection */
        // TEMPORARY - For demonstration purposes
        if ((mesh as THREE.Mesh).geometry instanceof THREE.BoxGeometry) {
          (mesh.material as THREE.MeshPhongMaterial).color.set(Colours.getBoxDefault());
        }
      }, () => {
        // TEMPORARY
        console.log('We have finished projecting the shape into the world');
      },
    );
  }

  // Public methods:

  /**
   * Add shape to world:
   */
  addShape(shape: Shape) {
    // First add to scene:
    this.scene.add(shape.mesh);
    // Then add to shapes array:
    this.shapes.push(shape);
  }

  /**
   * Start live loop (by name and shape) to the world as a LiveLoopShape.
   */
  startLiveLoop(name: LiveLoopName, shape: Shape) {
    const liveLoopShape = new LiveLoopShape(name, shape);
    liveLoopShape.liveloop.oscilloscopeData().subscribe(
      amplitude => {
        // Calculate scaling factor from old and new amplitudes.
        const oldAmp = liveLoopShape.shape.amplitude;
        const factor = amplitude / oldAmp;
        // Apply scaling.
        liveLoopShape.shape.geometry.scale(factor, factor, factor);
        // Update shape's amplitude.
        liveLoopShape.shape.amplitude = amplitude;
      },
    );
  }

  /**
   * Stop live loop (by LiveLoopShape) from the world.
   */
  stopLiveLoop(liveLoopShape: LiveLoopShape) {
    liveLoopShape.stop();
  }

  /**
   * Add effect (by name and shape) to a particular live loop (by LiveLoopShape).
   */
  addEffect(name: EffectName, shape: Shape, liveLoopShape: LiveLoopShape) {
    const effect = new EffectShape(name, shape, liveLoopShape);
  }

  /**
   * Remove effect (by EffectShape) from a particular live loop.
   */
  removeEffect(effectShape: EffectShape) {
    effectShape.remove();
  }

  /**
   * Set up the physical environment itself.
  */
  setupEnvironment() {
    // Set a background colour:
    this.scene.background = new THREE.Color(0x0d0d0d);

    // Add a wireframe grid helper to the scene:
    // (for debug purposes)
    const gridHelper = new THREE.GridHelper(150, 150);
    gridHelper.position.set(0, -2, 0);
    this.scene.add(gridHelper);

    // Add ambient light:
    const ambientLight = new THREE.AmbientLight(0x808080);
    this.lights.push(ambientLight);
    this.scene.add(ambientLight);

    // Add a point light:
    const pLight = new THREE.PointLight(0xffffff, 7, 10, 2);
    pLight.position.set(0, 5, 0);
    this.lights.push(pLight);
    this.scene.add(pLight);

    // Place the cylinder floor in the world:
    // (This is a placeholder for the tray that will hold the live loops.)
    const cylinder = new Cylinder(
      new THREE.CylinderGeometry(10, 10, 0.5, 32, 32),
      new THREE.MeshPhongMaterial({ color: 0xffffff, opacity: 0.2, transparent: true }),
    );

    cylinder.getMesh().position.set(0, -5, 0);

    // Add the shape and mesh to their respective arrays:
    this.shapes.push(cylinder);
    this.scene.add(cylinder.getMesh());

    // TEMPORARY
    // Add a box here...

    const box = new Box(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshPhongMaterial({ color: 0x00ffff, specular: 0x69bccc, shininess: 10, shading: THREE.FlatShading, opacity: 0.8, transparent: true }),
    );
    box.getMesh().position.set(0, -0.7, -1.5);
    this.addShape(box);

    const tetrahedron = new Tetrahedron(
      new THREE.TetrahedronGeometry(0.5),
      new THREE.MeshPhongMaterial({ color: 0xff6600, specular: 0x69bccc, shininess: 10, shading: THREE.FlatShading, opacity: 0.8, transparent: true }),
    );
    tetrahedron.getMesh().position.set(1.5, -0.7, 0);
    this.addShape(tetrahedron);

    const octahedron = new Octahedron(
      new THREE.OctahedronGeometry(0.4, 0),
      new THREE.MeshPhongMaterial({ color: 0xffff00, specular: 0x69bccc, shininess: 10, shading: THREE.FlatShading, opacity: 0.8, transparent: true }),
    );
    octahedron.getMesh().position.set(-1.5, -0.5, 0);
    this.addShape(octahedron);

    const icos = new Icosahedron(
      new THREE.IcosahedronGeometry(0.5, 0),
      new THREE.MeshPhongMaterial({ color: 0xff00ff, specular: 0x69bccc, shininess: 10, shading: THREE.FlatShading, opacity: 0.8, transparent: true }),
    );
    icos.getMesh().position.set(1.4, -1, -1.4);
    this.addShape(icos);

    const dodecahedron = new Dodecahedron(
      new THREE.DodecahedronGeometry(0.4, 0),
      new THREE.MeshPhongMaterial({ color: 0x66ff33, specular: 0x69bccc, shininess: 10, shading: THREE.FlatShading, opacity: 0.8, transparent: true }),
    );
    dodecahedron.getMesh().position.set(-1.2, -0.7, -1.2);
    this.addShape(dodecahedron);
  }

  /**
   * Update the objects in the world
   */
  update(delta: number) {
    // TODO: Do something more maintainable about these function calls
    /* this.shapeSelector.updateSelectedMesh();
     this.shapeSelector.projectMesh();*/
  }

  /**
   * Start rendering and updating the world
   */
  start() {
    window.document.body.appendChild(this.renderer.domElement);

    // Set up the environement itself (i.e. populate with shapes)
    this.setupEnvironment();

    this.vrEnvironment
      .createAnimator(delta => this.update(delta))
      .start();
  }
}
