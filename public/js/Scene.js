import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { COURT, NET, PLAYER, BALL } from '/shared/constants.js';

export default class Scene {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2a2140);
    this.scene.fog = new THREE.Fog(0x2a2140, 28, 48);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);

    this.buildLights();
    this.buildCourt();
    this.buildCrowd();
    this.players = {
      A: this.buildPlayer(0xffd23f),
      B: this.buildPlayer(0x3fa7ff)
    };
    this.ball = this.buildBall();

    this.composer = new EffectComposer(this.renderer);
    this.pixelPass = new RenderPixelatedPass(4, this.scene, this.camera);
    this.composer.addPass(this.pixelPass);
    this.composer.addPass(new OutputPass());

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  buildLights() {
    const hemi = new THREE.HemisphereLight(0xffe9c4, 0x402d5a, 0.9);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff2d0, 1.1);
    sun.position.set(6, 14, 8);
    sun.castShadow = true;
    sun.shadow.camera.left = -14;
    sun.shadow.camera.right = 14;
    sun.shadow.camera.top = 14;
    sun.shadow.camera.bottom = -14;
    sun.shadow.mapSize.set(1024, 1024);
    this.scene.add(sun);
  }

  buildCourt() {
    const w = COURT.halfWidth * 2;
    const d = COURT.halfDepth * 2;

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(w + 2, 0.5, d + 2),
      new THREE.MeshLambertMaterial({ color: 0xc98a4b })
    );
    floor.position.y = -0.25;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const half = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshLambertMaterial({ color: 0xe0a868 })
    );
    half.rotation.x = -Math.PI / 2;
    half.position.y = 0.01;
    half.receiveShadow = true;
    this.scene.add(half);

    const lineMat = new THREE.MeshBasicMaterial({ color: 0xfff4e0 });
    const mkLine = (lw, ld, x, z) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(lw, ld), lineMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.02, z);
      this.scene.add(m);
    };
    mkLine(w, 0.12, 0, -COURT.halfDepth);
    mkLine(w, 0.12, 0, COURT.halfDepth);
    mkLine(0.12, d, -COURT.halfWidth, 0);
    mkLine(0.12, d, COURT.halfWidth, 0);

    const net = new THREE.Mesh(
      new THREE.BoxGeometry(NET.thickness, NET.height, d),
      new THREE.MeshLambertMaterial({ color: 0xf5f0ff, transparent: true, opacity: 0.55 })
    );
    net.position.y = NET.height / 2;
    this.scene.add(net);

    const tape = new THREE.Mesh(
      new THREE.BoxGeometry(NET.thickness + 0.05, 0.12, d),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    tape.position.y = NET.height;
    this.scene.add(tape);

    const postMat = new THREE.MeshLambertMaterial({ color: 0x5a4a2a });
    for (const z of [-COURT.halfDepth, COURT.halfDepth]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, NET.height + 0.4, 6), postMat);
      post.position.set(0, (NET.height + 0.4) / 2, z);
      post.castShadow = true;
      this.scene.add(post);
    }
  }

  buildCrowd() {
    const colors = [0xff5d73, 0x4dd6a0, 0xffd23f, 0x3fa7ff, 0xb06dff, 0xff9f45];
    const group = new THREE.Group();
    const ringW = COURT.halfWidth + 4;
    const ringD = COURT.halfDepth + 3;

    for (let i = 0; i < 70; i++) {
      const c = colors[i % colors.length];
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 1.2, 0.6),
        new THREE.MeshLambertMaterial({ color: c })
      );
      const edge = Math.floor(Math.random() * 4);
      let x, z;
      if (edge === 0) { x = -ringW; z = (Math.random() * 2 - 1) * ringD; }
      else if (edge === 1) { x = ringW; z = (Math.random() * 2 - 1) * ringD; }
      else if (edge === 2) { z = -ringD; x = (Math.random() * 2 - 1) * ringW; }
      else { z = ringD; x = (Math.random() * 2 - 1) * ringW; }
      m.position.set(x, 0.6 + Math.random() * 0.6, z);
      group.add(m);
    }
    this.scene.add(group);
  }

  buildPlayer(color) {
    const group = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(PLAYER.radius, PLAYER.radius * 1.2, 4, 8),
      new THREE.MeshLambertMaterial({ color })
    );
    body.position.y = PLAYER.radius * 1.1;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshLambertMaterial({ color: 0xffe0bd })
    );
    head.position.y = PLAYER.radius * 2.1;
    head.castShadow = true;
    group.add(head);

    this.scene.add(group);
    return group;
  }

  buildBall() {
    const ball = new THREE.Mesh(
      new THREE.IcosahedronGeometry(BALL.radius, 1),
      new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true })
    );
    ball.castShadow = true;
    this.scene.add(ball);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(BALL.radius * 1.1, 12),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 })
    );
    shadow.rotation.x = -Math.PI / 2;
    this.scene.add(shadow);
    this.ballShadow = shadow;

    return ball;
  }

  setSide(slot) {
    const dir = slot === 'A' ? -1 : 1;
    this.camera.position.set(dir * (COURT.halfWidth + 5), 7, 0);
    this.camera.lookAt(0, 1.5, 0);
  }

  updatePlayer(slot, x, y, z) {
    this.players[slot].position.set(x, y, z);
  }

  updateBall(x, y, z) {
    this.ball.position.set(x, y, z);
    this.ballShadow.position.set(x, 0.03, z);
    const s = THREE.MathUtils.clamp(1 - y * 0.05, 0.4, 1);
    this.ballShadow.scale.set(s, s, s);
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.composer.render();
  }
}
